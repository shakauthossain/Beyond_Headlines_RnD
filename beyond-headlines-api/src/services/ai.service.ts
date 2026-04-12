import OpenAI from 'openai';
import { z } from 'zod';
import { config } from '../config';
import { makeKey, getCached, setCached } from '../redis/cache';
import {
  topicBriefResponseSchema,
  researchResponseSchema,
  subEditResponseSchema,
  seoMetadataResponseSchema,
  packagingResponseSchema,
  inlineAssistResponseSchema,
  type TopicBriefResponse,
  type ResearchResponse,
  type OutlineResponse,
  type InlineAssistResponse,
  type SubEditResponse,
  type SEOMetadataResponse,
  type PackagingResponse,
} from '../types/ai.types';

// ── OpenRouter client (OpenAI-compatible) ────────────────────────────────────

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: config.openRouterApiKey,
  defaultHeaders: {
    'HTTP-Referer': 'https://beyondheadlines.com',
    'X-Title': 'Beyond Headlines',
  },
});

// ── Core call wrapper ────────────────────────────────────────────────────────
// Handles: model call → strip markdown fences → JSON.parse → Zod validate
// Retries once with stricter instruction on validation failure

async function callModel<T>(
  model: string,
  system: string,
  user: string,
  schema: z.ZodType<T>,
  maxTokens: number = 1024,
): Promise<T> {
  const _call = async (prompt: string): Promise<T> => {
    const response = await openrouter.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: prompt },
      ],
    }, { timeout: 45000 }); // 45s timeout to prevent worker hangs
    const raw = (response.choices[0].message.content ?? '')
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/,       '')
      .trim();
    return schema.parse(JSON.parse(raw));
  };

  try {
    return await _call(user);
  } catch {
    // Retry once with stricter instruction
    return await _call(`${user}\n\nRespond with valid JSON only. No preamble, no markdown.`);
  }
}

// ── Step 1: Cluster headlines (Claude Haiku) ─────────────────────────────────

const clusterOutputSchema = z.array(z.object({
  topic:         z.string(),
  summary:       z.string(),
  sentiment:     z.enum(['critical', 'neutral', 'supportive']),
  article_count: z.number(),
  is_emerging:   z.boolean(),
  indices:       z.array(z.number()), // Array of 0-based indices from the input list
}));

export async function clusterHeadlines(headlines: string[]): Promise<z.infer<typeof clusterOutputSchema>> {
  const cacheKey = makeKey('cluster', headlines.sort().join('|'));
  const cached   = await getCached<z.infer<typeof clusterOutputSchema>>(cacheKey);
  if (cached) return cached;

  const result = await callModel(
    config.claudeHaikuModel,
    'You are an editorial analyst. Group the following headlines into topic clusters. Return ONLY a JSON array, no preamble. Identify headlines by their 0-based index.',
    `Headlines:\n${headlines.map((h, i) => `${i}. ${h}`).join('\n')}\n\nReturn structure: [{"topic":"string","summary":"string","sentiment":"critical|neutral|supportive","article_count":number,"is_emerging":boolean,"indices":[number]}]`,
    clusterOutputSchema,
    1500,
  );

  await setCached(cacheKey, result, config.clusterCacheTtl);
  return result;
}

// ── Step 2: Topic brief (Claude Sonnet) ─────────────────────────────────────

export async function generateTopicBrief(
  clusterSummary: string,
  headlines: string[],
): Promise<TopicBriefResponse> {
  return callModel(
    config.claudeSonnetModel,
    'You are a senior editorial analyst producing structured briefing documents for journalists. Return ONLY valid JSON.',
    `Cluster summary: ${clusterSummary}\n\nHeadlines:\n${headlines.join('\n')}\n\nReturn: {"issue_summary":"string","key_questions":["string"],"stakeholders":[{"name":"string","role":"string"}],"viewpoints":["string"],"suggested_angles":[{"title":"string","reasoning":"string","target_audience":"string"}],"generatedAt":"ISO string"}`,
    topicBriefResponseSchema,
    4000,
  );
}

// ── Step 3a: Perplexity web search (Sonar Pro) ───────────────────────────────

export async function searchPerplexity(angle: string): Promise<{ sources: any[]; rawText: string }> {
  const cacheKey = makeKey('perplexity', angle);
  const cached   = await getCached<{ sources: any[]; rawText: string }>(cacheKey);
  if (cached) return cached;

  const response = await openrouter.chat.completions.create({
    model: config.perplexitySonarModel,
    messages: [{ role: 'user', content: `Research this editorial angle with citations: ${angle}` }],
  });

  const rawText  = response.choices[0].message.content ?? '';
  // @ts-ignore — OpenRouter surfaces Perplexity citations under this field
  const citations: string[] = (response as any).citations ?? [];

  const sources = citations.map((url: string, i: number) => ({
    id:          `s${i + 1}`,
    url,
    credibility: ['thedailystar.net','prothomalo.com','bdnews24.com','jugantor.com','dhakatribune.com']
      .some(d => url.includes(d)) ? 1 : 2,
  }));

  const result = { sources, rawText };
  await setCached(cacheKey, result, config.researchCacheTtl);
  return result;
}

// ── Step 3b: Research synthesis (Claude Haiku) ───────────────────────────────

export async function synthesiseResearch(
  angle: string,
  perplexityRawText: string,
  rawSources: any[] = [],
): Promise<ResearchResponse> {
  return callModel(
    config.claudeHaikuModel,
    'You are a research analyst. Synthesise the following web research into a high-fidelity JSON report for premium journalism. Return ONLY valid JSON.',
    `Editorial angle: ${angle}\n\nResearch content:\n${perplexityRawText}\n\nURLs found:\n${rawSources.map(s => s.url).join('\n')}\n\nReturn EXACTLY this structure: {
      "timeline": [{"date":"YYYY-MM-DD","event":"string","impact":"Short description of consequence"}],
      "data_points": [{"value":"Big number/stat","metric":"What it measures","context":"Why it matters"}],
      "gaps": [{"topic":"string","details":"string"}],
      "sources": [{"title":"Article title","summary":"2-sentence summary","url":"string","credibility":"High|Medium|Developing"}],
      "generatedAt":"ISO string"
    }`,
    researchResponseSchema,
    2500,
  );
}

// ── Step 4a: Outline (Claude Sonnet) ─────────────────────────────────────────

const outlineSchema = z.object({
  sections: z.array(z.object({ label: z.string(), direction: z.string() })),
  generatedAt: z.string(),
});

export async function generateOutline(
  angle: string,
  tone: string,
  sources: string[] = [],
): Promise<OutlineResponse> {
  return callModel(
    config.claudeSonnetModel,
    'You are a senior journalist. Generate a structured article outline. Return ONLY valid JSON.',
    `Angle: ${angle}\nTone: ${tone}\nKey sources: ${sources.join(', ')}\n\nReturn: {"sections":[{"label":"string","direction":"1 sentence"}],"generatedAt":"ISO string"}`,
    outlineSchema,
    800,
  );
}

// ── Step 4b: Inline paragraph assist (Claude Sonnet) ─────────────────────────

export async function inlineAssist(paragraph: string, tone: string): Promise<InlineAssistResponse> {
  return callModel(
    config.claudeSonnetModel,
    'You are a skilled editor. Improve the journalist\'s paragraph. Return ONLY valid JSON.',
    `Tone: ${tone}\n\nParagraph:\n${paragraph}\n\nReturn: {"original":"string","suggested":"string","rationale":"string","generatedAt":"ISO string"}`,
    inlineAssistResponseSchema,
    600,
  );
}

// ── Step 4c: Counterpoint (Claude Sonnet) ────────────────────────────────────

export async function generateCounterpoint(paragraph: string): Promise<{ counterpoint: string; generatedAt: string }> {
  const schema = z.object({ counterpoint: z.string(), generatedAt: z.string() });
  return callModel(
    config.claudeSonnetModel,
    'You are a devil\'s advocate. Steelman the opposing position. Return ONLY valid JSON.',
    `Argument:\n${paragraph}\n\nReturn: {"counterpoint":"string","generatedAt":"ISO string"}`,
    schema,
    500,
  );
}

// ── Step 5a: Sub-edit (Claude Sonnet) ────────────────────────────────────────

export async function subEditArticle(articleBody: string): Promise<SubEditResponse> {
  return callModel(
    config.claudeSonnetModel,
    'You are a sub-editor. Analyse this article for clarity, tone, and flow issues. Return ONLY valid JSON.',
    `Article:\n${articleBody}\n\nReturn: {"clarity_issues":[{"paragraph_index":0,"issue_description":"string","suggested_fix":"string"}],"tone_issues":[...],"flow_issues":[...],"generatedAt":"ISO string"}`,
    subEditResponseSchema,
    4000,
  );
}

// ── Step 5b: Headline scoring (Claude Sonnet) ────────────────────────────────

const headlineScoreOutputSchema = z.object({
  scores: z.array(z.object({
    headline: z.string(),
    score:    z.number(),
    feedback: z.string(),
  })),
  generatedAt: z.string(),
});

export async function scoreHeadlines(
  headlines: string[],
): Promise<z.infer<typeof headlineScoreOutputSchema>> {
  return callModel(
    config.claudeSonnetModel,
    'You are a senior editor. Score these headlines on clarity, SEO strength, and brand voice. Return ONLY valid JSON.',
    `Headlines:\n${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\nReturn: {"scores":[{"headline":"string","score":0-10,"feedback":"string"}],"generatedAt":"ISO string"}`,
    headlineScoreOutputSchema,
    600,
  );
}

// ── Step 5c: SEO metadata (Claude Haiku) ─────────────────────────────────────

export async function generateSEOMetadata(
  title: string,
  excerpt: string,
): Promise<SEOMetadataResponse> {
  return callModel(
    config.claudeHaikuModel,
    'You are an SEO specialist. Generate metadata for this article. Return ONLY valid JSON.',
    `Title: ${title}\n\nFirst 200 words: ${excerpt}\n\nReturn: {"meta_title":"string","meta_description":"150 chars max","tags":["string"],"generatedAt":"ISO string"}`,
    seoMetadataResponseSchema,
    400,
  );
}

// ── Step 6: Packaging (Claude Haiku — 3 tasks in one call) ───────────────────

export async function generatePackaging(
  title: string,
  articleBody: string,
): Promise<PackagingResponse> {
  return callModel(
    config.claudeHaikuModel,
    'You are a digital editor. Generate packaging assets for this article. Return ONLY valid JSON.',
    `Title: ${title}\n\nArticle:\n${articleBody}\n\nReturn: {"image_concept":"2-3 sentence visual description","pull_quotes":[{"quote":"string","paragraph_index":0}],"social_captions":{"twitter":"280 chars max","linkedin":"professional tone","whatsapp":"forward-friendly"},"generatedAt":"ISO string"}`,
    packagingResponseSchema,
  );
}

// ── Step 7: Query Classification (Claude Haiku) ──────────────────────────────

export async function classifyQuery(query: string): Promise<'General' | 'Sports' | 'Business' | 'Politics' | 'Entertainment'> {
  const schema = z.object({ category: z.enum(['General', 'Sports', 'Business', 'Politics', 'Entertainment']) });
  try {
    const result = await callModel(
      config.claudeHaikuModel,
      'You are a news desk editor. Categorize the user search query into one of: General, Sports, Business, Politics, Entertainment. Return ONLY JSON.',
      `Query: "${query}"\n\nReturn: {"category":"General|Sports|Business|Politics|Entertainment"}`,
      schema,
      100,
    );
    return result.category;
  } catch (err) {
    console.error('[AI] Classification failed, defaulting to General:', err);
    return 'General';
  }
}
