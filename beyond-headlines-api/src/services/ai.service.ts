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

// ── Step 0: Categorize Query (Claude Haiku) ──────────────────────────────────

const categorySchema = z.object({
  category: z.enum(['General', 'Politics', 'Sports', 'Business', 'Tech', 'Entertainment', 'Lifestyle', 'World', 'National']),
  rationale: z.string(),
});

export async function categorizeQuery(query: string): Promise<string> {
  const result = await callModel(
    config.claudeHaikuModel,
    'You are a news editor. Categorize the user search query into exactly ONE of the allowed categories. Return ONLY JSON.',
    `Query: "${query}"\n\nAllowed: General, Politics, Sports, Business, Tech, Entertainment\n\nReturn: {"category":"string","rationale":"1 sentence"}`,
    categorySchema,
    200,
  );
  return result.category;
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

export async function clusterHeadlines(
  headlines: string[],
  category: string = 'General'
): Promise<z.infer<typeof clusterOutputSchema>> {
  const cacheKey = makeKey('cluster', `${category}:${headlines.sort().join('|')}`);
  const cached   = await getCached<z.infer<typeof clusterOutputSchema>>(cacheKey);
  if (cached) return cached;

  const result = await callModel(
    config.claudeHaikuModel,
    `You are an expert editorial analyst specializing in ${category} news. 
     Your goal is to group headlines into distinct, narrative-driven clusters.
     
     STRICT RULES:
     1. Do NOT use generic category names as topics (e.g., avoid "National News", "Politics", "General").
     2. Create highly specific topics based on the actual content (e.g., "Fury vs Usyk Heavyweight Unification", "Election Reform Protests in Dhaka").
     3. If headlines are completely unrelated to ${category}, group them into a "Miscellaneous" cluster.
     4. Focus on the most recent and impactful narratives.
     
     Return ONLY a JSON array.`,
    `Headlines:\n${headlines.map((h, i) => `${i}. ${h}`).join('\n')}\n\nReturn structure: [{"topic":"string","summary":"string","sentiment":"critical|neutral|supportive","article_count":number,"is_emerging":boolean,"indices":[number]}]`,
    clusterOutputSchema,
    4000,
  );

  await setCached(cacheKey, result, config.clusterCacheTtl);
  return result;
}

// ── Step 1.5: Deep Intelligence Selection (Claude Haiku) ──────────────────────

const topArticlesSchema = z.object({
  topIndices: z.array(z.number()).min(0).max(3),
  rationale: z.string(),
});

/**
 * Ranks headlines against a query and returns the top 3 most relevant indices.
 * These will be targeted for deep scraping.
 */
export async function selectTop3Articles(
  query: string,
  headlines: string[]
): Promise<number[]> {
  if (headlines.length === 0) return [];

  const result = await callModel(
    config.claudeHaikuModel,
    'You are a high-speed news filter. Pick up to 3 indices of headlines that are most relevant to the User Query. These must be the items most likely to contain the specific data the user is looking for. Return JSON only.',
    `User Query: "${query}"\n\nHeadlines:\n${headlines.map((h, i) => `${i}. ${h}`).join('\n')}\n\nReturn: {"topIndices": [number], "rationale": "string"}`,
    topArticlesSchema,
    200,
  );

  return result.topIndices;
}

// ── Step 1.6: Deep Synthesis (Claude Sonnet or Haiku) ───────────────────────

/**
 * Generates an enriched summary for a cluster using the full body content 
 * of the top 3 identified articles.
 */
export async function synthesizeDeepIntelligence(
  query: string,
  topic: string,
  articles: { headline: string; content: string }[]
): Promise<string> {
  if (articles.length === 0) return "No deep content available.";

  const system = `You are an elite intelligence analyst for "Beyond Headlines." 
Your task is to synthesize a high-fidelity intelligence summary for the topic: "${topic}".
You are given the full body content of the top 3 most relevant articles discovered for the query: "${query}".

Focus on:
1. HARD FACTS: Specific names, dates, percentages, and dollar amounts.
2. NARRATIVE: The "why" and "how" behind the news.
3. TREND: Is this an isolated event or part of a larger shift?

Format as a concise 3-paragraph intelligence briefing. Do NOT use markdown headers.`;

  const user = `Full Article Contexts:\n\n${articles.map((a, i) => `ARTICLE ${i+1}: ${a.headline}\nCONTENT: ${a.content.substring(0, 3000)}`).join('\n\n---\n\n')}`;

  const response = await openrouter.chat.completions.create({
    model: config.claudeHaikuModel, 
    max_tokens: 1000,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user },
    ],
  });

  return response.choices[0].message.content ?? "Failed to synthesize intelligence.";
}

const discoveryOutputSchema = z.array(z.object({
  headline: z.string(),
  url: z.string(),
  source: z.string(),
  category: z.string(),
}));

export async function discoverStories(
  query: string,
  category: string = 'General',
  timeframe: string = 'past 48 hours',
  region: string = 'Bangladesh'
): Promise<z.infer<typeof discoveryOutputSchema>> {
  return callModel(
    config.perplexitySonarStandardModel,
    `You are a targeted news discovery engine. Find 6 to 12 recent news storylines related to the topic '${query}' that fit the '${category}' category. 
    
     SEARCH PARAMETERS:
     - Target Region: ${region}
     - Target Timeframe: ${timeframe}
     
     If you cannot find exact matches for the query within the timeframe, broaden your search slightly within the category and region to find the most relevant current events. ALWAYS return at least some relevant storylines.

     For each storyline, provide:
     - A punchy, factual headline.
     - The name of the primary news source (e.g., 'Reuters', 'Associated Press', 'Interfax').
     - The direct URL to the article.
     - The category (${category}).
     
     Focus on credible sources. Return ONLY a valid JSON array.`,
    `Query: "${query}" | Category: "${category}" | Region: "${region}" | Timeframe: "${timeframe}"`,
    discoveryOutputSchema,
    2000,
  );
}

const filterOutputSchema = z.array(z.object({
  headline: z.string(),
  url: z.string(),
  source: z.string(),
  category: z.string(),
}));

export async function filterScrapedHeadlines(
  rawHeadlines: any[],
  query: string,
  category: string,
  timeframe: string,
  region: string
): Promise<z.infer<typeof filterOutputSchema>> {
  if (rawHeadlines.length === 0) return [];
  
  const formattedInput = rawHeadlines.map((h: any) => ({
    headline: h.headline,
    source: h.source,
    url: h.url,
    category: h.category
  }));

  const prompt = `You are a strict editorial data filter. 
I am going to provide you with a JSON list of freshly scraped local news headlines.
Your ONLY task is to filter this list and return a JSON array containing ONLY the headlines that are highly relevant to the user query and category.

USER QUERY: "${query}"
TARGET CATEGORY: "${category}"
TIME CONTEXT: ${timeframe}
REGION: ${region}

STRICT INSTRUCTIONS:
1. ONLY return items from the provided INPUT HEADLINES list. Do NOT search the web for new ones or invent any.
2. If the query is a broad topic (e.g. "Energy Crisis"), select the headlines that are most relevant to that topic.
3. Keep the exact same properties (headline, source, url, category) for each item you select.
4. If absolute 0 headlines match, return an empty array [].
5. Output NOTHING ELSE but the valid JSON array.

INPUT HEADLINES JSON:
${JSON.stringify(formattedInput, null, 2)}`;

  return callModel(
    config.perplexitySonarStandardModel,
    prompt,
    `Filter ${rawHeadlines.length} headlines for query: ${query}`,
    filterOutputSchema,
    2000
  );
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

// ── Step 7: Query Refinement (Claude Haiku) ──────────────────────────────────
// Corrects spelling/grammar before intent classification

const refinedQuerySchema = z.object({
  refinedQuery: z.string(),
  isCorrected:  z.boolean(),
});

export async function refineQuery(query: string): Promise<string> {
  try {
    const result = await callModel(
      config.claudeHaikuModel,
      `You are a query normalization engine. Correct any spelling or grammar mistakes in the user's news search query. 
       Return the corrected query. If it's already perfect, return as is.
       Keep it concise. Do NOT add preamble. Return ONLY JSON.`,
      `Query: "${query}"\n\nReturn: {"refinedQuery":"string","isCorrected":boolean}`,
      refinedQuerySchema,
      200
    );
    return result.refinedQuery;
  } catch {
    return query; // Fallback to original
  }
}

// ── INTENT CLASSIFICATION ────────────────────────────────────────────────────────

export interface SearchIntentParams {
  category: 'politics' | 'crime' | 'finance' | 'business' | 'technology' | 'health' | 'sports' | 'environment' | 'international' | 'culture';
  region: 'bangladesh_national' | 'dhaka' | 'chittagong' | 'sylhet' | 'rajshahi' | 'south_asia' | 'international';
  timeframe: 'last_24h' | 'last_week' | 'last_month' | 'any';
  searchSlug: string; // SEO-friendly keywords like 'fuel-crisis' or 'oil-prices'
  refinedQuery: string; // Corrected version of the user query
  confidence: {
    category: number;
    region: number;
    timeframe: number;
  };
}

const searchIntentSchema = z.object({
  category: z.enum(['politics', 'crime', 'finance', 'business', 'technology', 'health', 'sports', 'environment', 'international', 'culture']),
  region: z.enum(['bangladesh_national', 'dhaka', 'chittagong', 'sylhet', 'rajshahi', 'south_asia', 'international']),
  timeframe: z.enum(['last_24h', 'last_week', 'last_month', 'any']),
  searchSlug: z.string(),
  refinedQuery: z.string(),
  confidence: z.object({
    category: z.number().min(0).max(1),
    region: z.number().min(0).max(1),
    timeframe: z.number().min(0).max(1),
  })
});

export async function extractSearchIntent(query: string): Promise<SearchIntentParams> {
  // 1. Refine query (spelling/grammar)
  const refined = await refineQuery(query);

  const systemPrompt = `You are a strict, ultra-fast intent classification engine for a local news scraper.
Analyze the user's free-text search query and map it perfectly to the available dimensions.

SOVEREIGNTY RULE:
- If the query mentions G7/G20 countries (USA, China, Russia, UK, India, etc.) or global entities (Middle East, EU, OPEC) without explicitly mentioning 'Bangladesh' or a specific Bangladeshi city, set region: 'international'.
- If the query mentions 'Bangladesh' or any of its divisions (Dhaka, Chittagong, Sylhet, Rajshahi), set region: 'bangladesh_national' or the specific city.
- DEFAULT: If ambiguous, use 'bangladesh_national'.

SEARCH SLUG RULES:
- Generate a 'searchSlug' which is a 1-2 word, broad news tag (lowercase, hyphenated).
- FOCUS ON ESTABLISHED TAGS: News portals use broad tags like 'middle-east', 'energy-crisis', 'cricket', 'israel-palestine', 'rohingya'. 
- AVOID narrow strings like 'mideast-conflict' if 'middle-east' is more standard.
- 'refinedQuery': This should be the same as the input query but with perfect spelling/grammar.

Output Schema requirements:
- category: politics, crime, finance, business, technology, health, sports, environment, international, culture
- region: bangladesh_national, dhaka, chittagong, sylhet, rajshahi, south_asia, international
- timeframe: last_24h, last_week, last_month, any
- searchSlug: string (lowercase, hyphenated)
- refinedQuery: string
- confidence: object containing scores between 0.0 to 1.0.

Return ONLY raw JSON. No markdown fences. No preambles.`;

  try {
    const result = await callModel(
      config.claudeHaikuModel,
      systemPrompt,
      `Classify this refined query: "${refined}"`,
      searchIntentSchema,
      300
    );
    
    console.log(`[AI Engine] Intent Classified for "${query}" (Refined: "${refined}"):`, {
      category: result.category,
      region: result.region,
      timeframe: result.timeframe,
      conf: result.confidence
    });
    
    return result;
  } catch (err: any) {
    console.warn(`[AI Engine] Intent schema parsing failed, falling back to defaults. Error: ${err.message}`);
    return {
      category: 'business',
      region: 'bangladesh_national',
      timeframe: 'last_week',
      searchSlug: refined.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      refinedQuery: refined,
      confidence: { category: 0.5, region: 0.5, timeframe: 0.5 }
    } as SearchIntentParams;
  }
}
