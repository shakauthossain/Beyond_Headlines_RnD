# Beyond Headlines — AI Editorial System

## Complete Project Document

### Express.js Implementation Reference

> For use with Claude / Cursor / GitHub Copilot / AI coding tools
> Version 1.0 | April 2026 | Notionhive Bangladesh Ltd.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [AI guiding principles](#2-ai-guiding-principles)
3. [Model selection & cost strategy](#3-model-selection--cost-strategy)
4. [Full AI model map](#4-full-ai-model-map)
5. [Step-by-step AI plan](#5-step-by-step-ai-plan)
6. [Express.js API reference](#6-expressjs-api-reference)
7. [AI service architecture](#7-ai-service-architecture)
8. [Worker architecture](#8-worker-architecture)
9. [Database schema](#9-database-schema)
10. [Cache strategy](#10-cache-strategy)
11. [Project structure](#11-project-structure)
12. [Auth system](#12-auth-system)
13. [Error handling](#13-error-handling)
14. [Environment variables](#14-environment-variables)
15. [Open items & pending inputs](#15-open-items--pending-inputs)
16. [Quick start](#16-quick-start)

---

## 1. Project overview

Beyond Headlines is an AI-assisted, analysis-driven news platform built for decision-makers, professionals, and political bodies. It combines a public-facing editorial website with an internal AI-powered editorial dashboard. Readers never interact with AI directly — all AI output is reviewed and approved by human editors before publication.

The editorial dashboard guides a journalist through a structured 7-step workflow from news signal detection to publication. AI acts exclusively as an internal research and writing support tool, operating in structured report format rather than conversational chat.

| Attribute        | Value                                                              |
| ---------------- | ------------------------------------------------------------------ |
| Platform         | AI-assisted news website + internal CMS                            |
| Primary audience | Decision-makers, professionals, political bodies                   |
| Design reference | The Economist, The New Yorker                                      |
| AI role          | Internal editorial support only — never reader-facing              |
| Frontend         | Next.js (App Router)                                               |
| Backend          | Node.js + Express.js + TypeScript                                  |
| Database         | PostgreSQL (containerised via Docker Compose)                      |
| Queue            | BullMQ + Redis (containerised via Docker Compose)                  |
| AI models        | Claude Sonnet, Claude Haiku, Perplexity Sonar (all via OpenRouter) |
| Infrastructure   | Docker Compose (local + production parity)                         |
| Phase 1 roles    | Admin and Editor only                                              |
| Comments         | Facebook Comments Plugin                                           |
| Analytics        | Google Analytics (slug-wise tracking)                              |
| Ads              | Google Ad Manager                                                  |

---

## 2. AI guiding principles

Three rules govern every AI decision in this platform.

### Structured output, not conversational

Every AI response renders as a formatted report with sections, labels, and clear hierarchy. No chat bubbles, no conversational filler — the journalist reads a briefing document, not a chatbot reply.

### Always assistive, never autonomous

Nothing gets published without a human accepting it. Every AI suggestion has an accept/reject/edit control. All content remains under full editorial control before publication.

### Fail gracefully

If AI returns garbage or times out, the journalist can still work manually. AI enhances the workflow — it never blocks it. Every AI call has a validation layer and one retry before returning a graceful fallback.

---

## 3. Model selection & cost strategy

Core principle: use expensive models only where output quality directly affects the published article. Everything else runs on cheaper models or no AI at all.

### 3.1 Model assignments

| Model                   | Role                           | Accessed via  | Why                                                                           |
| ----------------------- | ------------------------------ | ------------- | ----------------------------------------------------------------------------- |
| Claude Sonnet           | Quality-critical writing tasks | OpenRouter    | Drafting, framing, sub-editing — output directly shapes the published article |
| Claude Haiku            | Low-stakes structured outputs  | OpenRouter    | Clustering, SEO metadata, captions — ~15x cheaper than Sonnet                 |
| Perplexity Sonar        | Live web search & retrieval    | OpenRouter    | Built-in search grounding — available on OpenRouter, no separate key needed   |
| Rule-based logic        | Scraping, emerging detection   | —             | Arithmetic comparison of cluster sizes — no AI needed                         |
| No AI                   | Publish workflow (Step 7)      | —             | Pure CMS logic — zero editorial benefit from AI here                          |

> **API Gateway:** All AI models are accessed through a single **OpenRouter** account (`https://openrouter.ai/api/v1`). OpenRouter uses an OpenAI-compatible API format. One key, one bill, zero per-provider complexity.

### 3.2 Cost impact

Shifting Steps 5 SEO, Step 6, and all fallbacks from Sonnet to Haiku reduces per-article AI cost by approximately 40–50% without affecting any content the reader sees. The quality-critical path — framing, drafting, and sub-editing — stays on Sonnet. OpenRouter adds no hard rate limits on paid models — upstream provider limits apply but are non-restrictive at MVP editorial throughput.

---

## 4. Full AI model map

| Step | Task                    | Model               | Rationale                                   |
| ---- | ----------------------- | ------------------- | ------------------------------------------- |
| 1    | Headline scraping       | BullMQ rule-based   | No AI needed — rule-based HTTP fetch        |
| 1    | Topic clustering        | Claude Haiku        | Simple JSON grouping task                   |
| 1    | Emerging detection      | Arithmetic logic    | Compare cluster sizes across 3 cycles       |
| 2    | Topic brief & framing   | Claude Sonnet       | Shapes entire story — highest leverage call |
| 3    | Web search & retrieval  | Perplexity API      | Built-in grounded search, no custom RAG     |
| 3    | Research synthesis      | Claude Haiku        | Summarisation — no deep reasoning required  |
| 3    | Credibility scoring     | Hardcoded tier list | Static domain list — no AI needed           |
| 4    | Outline generation      | Claude Sonnet       | Quality-critical writing                    |
| 4    | Inline paragraph assist | Claude Sonnet       | Journalist actively writing                 |
| 4    | Counterpoint suggestion | Claude Sonnet       | Reasoning-heavy editorial task              |
| 5    | Sub-editing & flow      | Claude Sonnet       | Directly affects published article quality  |
| 5    | Headline scoring        | Claude Sonnet       | Brand voice judgement required              |
| 5    | SEO metadata            | Claude Haiku        | Short structured extraction                 |
| 6    | Image concept           | Claude Haiku        | Low-stakes text description                 |
| 6    | Pull quotes             | Claude Haiku        | Simple extraction task                      |
| 6    | Social captions         | Claude Haiku        | Short structured outputs                    |
| 7    | Publish workflow        | No AI               | Pure CMS logic                              |

---

## 5. Step-by-step AI plan

---

### Step 1 — News intake & signal detection

**Models: BullMQ (scraping) + Claude Haiku (clustering)**

#### Product features

- News Intelligence Feed panel — auto-refreshes every 30 minutes
- Headlines grouped into topic clusters with label and article count
- 2-line AI-generated summary per cluster
- Emerging tag for topics spiking in coverage in the last 6 hours
- Sentiment indicator per cluster: critical, neutral, or supportive

#### Scraping rules

- Scrape headlines, URLs, categories, and timestamps only — not full article text
- 5 approved sources: Prothom Alo, Daily Star, BDNews24, Jugantor, Dhaka Tribune
- No full article scraping — legally risky and maintenance-heavy for MVP
- International coverage handled by Perplexity in Step 3, not a separate scraper

#### Technical approach

- BullMQ repeatable job every 30 minutes — Playwright for JS-rendered pages, Cheerio for static HTML
- Raw headlines stored in PostgreSQL with source, timestamp, and URL
- Batch headlines sent to Claude Haiku — returns JSON clusters with sentiment
- Redis caches cluster output at 30-minute TTL
- Emerging detection: flag if cluster size grows 3x across last 3 cycles — no AI

#### Haiku clustering prompt pattern

```
System: "You are an editorial analyst. Group the following headlines into
         topic clusters. Return ONLY a JSON array, no preamble."

User:   "Headlines: [...]
         Return: [{
           topic:         string,
           summary:       string,   // 2 sentences max
           sentiment:     string,   // critical | neutral | supportive
           article_count: number,
           is_emerging:   boolean
         }]"
```

#### Cache strategy

```
Key:  cluster:{sha256(sorted_headlines)}
TTL:  1800 seconds (30 minutes)
Hit:  return cached clusters immediately, skip AI call
Miss: run Haiku clustering, store result, return
```

> **Why Haiku:** Clustering and summarising headlines is a simple structured output task. No reasoning depth required. Haiku handles it well at a fraction of Sonnet's cost.

---

### Step 2 — Topic selection & framing

**Model: Claude Sonnet**

#### Product features

- Clicking a cluster opens a Topic Brief panel
- Brief contains: 3–4 sentence issue summary, 3 key questions, stakeholder list, 2–3 contrasting viewpoints
- Angle selector — journalist picks or writes their own angle before proceeding
- Confirmed angle saved and carried as context through all subsequent steps

#### Technical approach

- Single Sonnet call triggered on cluster click — passes cluster headlines and summary
- System prompt positions Claude as a senior editorial analyst producing a structured brief
- Confirmed angle stored in session state and attached to the article DB record

#### Output schema

```json
{
  "issue_summary": "string",
  "key_questions": ["string"],
  "stakeholders": [{ "name": "string", "role": "string" }],
  "viewpoints": ["string"]
}
```

> **Why Sonnet:** The angle a journalist picks here shapes the entire article. This is the highest-leverage AI call in the pipeline. A weak framing at Step 2 produces a weak article regardless of how well Steps 4 and 5 perform.

---

### Step 3 — Deep research & context building

**Models: Perplexity API (retrieval) + Claude Haiku (synthesis)**

This is the most technically complex step. The Perplexity / Haiku split is what keeps it affordable.

#### Product features

- Research Workspace panel with 4 tabs: Sources, Timeline, Data Points, Gaps
- Source cards with headline, outlet, credibility tier badge, and 2-sentence summary
- One-click bookmark to add source to article reference list
- Timeline tab: chronological history of how the issue developed
- Gaps tab: what current coverage is missing — high editorial value feature

#### Technical approach

- Perplexity API queried with confirmed angle — returns grounded citations with URLs
- Local PostgreSQL queried in parallel for historical headlines on same topic cluster
- Both result sets passed to Claude Haiku for synthesis
- Haiku returns: `timeline[]`, `data_points[]`, `gaps[]`
- Credibility tier scoring is a hardcoded domain list — no AI involved
- Research output stored in `research_sessions` table linked to article record

#### Credibility tier list

```
Tier 1 (trusted): thedailystar.net, prothomalo.com, bdnews24.com,
                  jugantor.com, dhakatribune.com
Tier 2 (general): all other web results
```

#### Haiku synthesis output schema

```json
{
  "timeline": [{ "date": "string", "event": "string", "source": "string" }],
  "data_points": ["string"],
  "gaps": ["string"]
}
```

#### Cache strategy

```
Key:  research:{sha256(angle)}
TTL:  7200 seconds (2 hours)
Hit:  return cached research, skip Perplexity + Haiku calls
Miss: run full pipeline, store result, return
```

> **Why Perplexity + Haiku split:** Perplexity is paid for its search grounding, not its reasoning. Once it returns citations, handing synthesis to Haiku instead of Sonnet saves significant cost per research session with no meaningful quality loss.

---

### Step 4 — Drafting & story construction

**Model: Claude Sonnet**

#### Product features

- Block-based Writing Panel using Tiptap — not WYSIWYG
- AI generates suggested outline on panel load: intro, context, analysis, conclusion — each a collapsed block
- Inline AI assist button on any paragraph — journalist sees diff view, accepts or rejects
- Tone selector: Analytical / Critical / Explanatory — passed as parameter to every writing prompt
- Counterpoint suggester — steelmanned opposite position in side panel, never auto-inserted
- Autosave every 30 seconds — creates revision record for full rollback capability

#### Outline schema

```json
{
  "sections": [
    { "label": "Introduction", "direction": "string" },
    { "label": "Context", "direction": "string" },
    { "label": "Analysis", "direction": "string" },
    { "label": "Conclusion", "direction": "string" }
  ]
}
```

#### Inline assist flow

```
1. Journalist highlights paragraph, clicks AI assist
2. POST /api/v1/ai/inline-assist  { articleId, paragraph, tone }
3. Sonnet receives: paragraph + full article context + tone
4. Returns: { original, suggested, rationale }
5. Diff view shown — journalist accepts or rejects
6. Accepted text replaces paragraph in Tiptap editor
```

> **Why Sonnet:** The journalist is actively writing here. This is quality-critical. Haiku's writing quality is noticeably weaker for long-form analytical content.

---

### Step 5 — Sub-editing & optimisation

**Models: Claude Sonnet (editorial) + Claude Haiku (SEO metadata)**

#### Product features

- Sub-edit button triggers full article analysis
- Results panel with 4 tabs: Clarity, Tone, Flow, SEO
- Each issue shows: problem description + suggested fix — journalist accepts or dismisses individually
- Headline analyser: score up to 3 headline options on clarity, SEO, and brand voice fit
- SEO metadata auto-generated: meta title, meta description, tags — all editable before saving

#### Sub-edit output schema (Sonnet)

```json
{
  "clarity_issues": [
    {
      "paragraph_index": 0,
      "issue_description": "string",
      "suggested_fix": "string"
    }
  ],
  "tone_issues": [
    {
      "paragraph_index": 0,
      "issue_description": "string",
      "suggested_fix": "string"
    }
  ],
  "flow_issues": [
    {
      "paragraph_index": 0,
      "issue_description": "string",
      "suggested_fix": "string"
    }
  ]
}
```

#### SEO metadata schema (Haiku)

```
Input:  title + first 200 words of article
Output: { meta_title, meta_description, tags: string[] }
```

#### Headline scoring schema (Sonnet)

```
Input:  string[] (max 3 headlines)
Output: { headlines: [{ headline, score: number, rationale }] }
```

> **Why the split:** Sub-editing and headline scoring directly affect published article quality — Sonnet justified. SEO metadata is a short structured extraction task — Haiku is sufficient and cuts cost here.

---

### Step 6 — Visual & packaging support

**Model: Claude Haiku (all tasks)**

#### Product features

- Feature image concept: text description for briefing a designer — no image generation in MVP
- Pull quote suggester: 2–3 most quotable lines from the article
- Social caption generator: Twitter/X short, LinkedIn professional, WhatsApp forward-friendly
- All outputs are suggestions — journalist selects and edits before saving to article record

#### Technical approach

- All 3 features triggered by single Generate Packaging button
- Runs as 3 parallel Haiku calls to minimise latency
- No image generation in MVP — `image_concept` is a text description only

#### Packaging output schema

```json
{
  "image_concept": "string",
  "pull_quotes": [{ "quote": "string", "paragraph_index": 0 }],
  "social_captions": {
    "twitter": "string",
    "linkedin": "string",
    "whatsapp": "string"
  }
}
```

> **Why Haiku:** All three outputs are short, low-stakes, and heavily reviewed by the journalist before use. Haiku is more than capable here.

---

### Step 7 — Review & publication

**Model: No AI — pure CMS workflow**

#### Product features

- Pre-publish checklist: headline set, meta description filled, image concept saved, at least one tag added
- Two publish routes: Submit for review (flags article in Admin queue) or Publish now (Editor direct)
- Post-publish: article status updated, slug registered, Google Analytics event fired, ad slots registered with Google Ad Manager

#### Publish routes

| Route                             | Role   | Action                                         |
| --------------------------------- | ------ | ---------------------------------------------- |
| `POST /publish/:id`               | Editor | Direct publish — article goes live immediately |
| `POST /publish/:id/submit-review` | Editor | Flags article as PENDING_REVIEW in Admin queue |
| `POST /publish/:id/approve`       | Admin  | Approves and publishes the article             |
| `POST /publish/:id/reject`        | Admin  | Returns to DRAFT with notes attached           |
| `GET  /publish/queue`             | Admin  | Lists all PENDING_REVIEW articles              |
| `GET  /publish/checklist/:id`     | Both   | Returns checklist status per article           |

#### Post-publish actions

```
1. UPDATE articles SET status = PUBLISHED, published_at = NOW()
2. Fire Google Analytics event with article slug as custom dimension
3. Register ad slots with Google Ad Manager
4. Return: { articleId, status, slug, publishedAt, url }
```

---

## 6. Express.js API reference

All routes are prefixed with `/api/v1`. JWT Bearer token required on all routes except `/auth/login` and `/health`.

### Auth

| Method | Route          | Description                                      |
| ------ | -------------- | ------------------------------------------------ |
| POST   | `/auth/login`  | Login — returns JWT token (any password in mock) |
| GET    | `/auth/me`     | Get current authenticated user from JWT          |
| POST   | `/auth/logout` | Logout — client discards token                   |

### Articles

| Method | Route                     | Description                                                         |
| ------ | ------------------------- | ------------------------------------------------------------------- |
| GET    | `/articles`               | List — filters: `status`, `categoryId`, `authorId`, `page`, `limit` |
| GET    | `/articles/:id`           | Get by ID or slug                                                   |
| POST   | `/articles`               | Create new article                                                  |
| PATCH  | `/articles/:id`           | Update article fields                                               |
| DELETE | `/articles/:id`           | Delete — returns 204                                                |
| GET    | `/articles/:id/revisions` | Full revision history                                               |
| POST   | `/articles/:id/autosave`  | Autosave body — creates revision record                             |

### Clusters — Step 1

| Method | Route                     | Description                                  |
| ------ | ------------------------- | -------------------------------------------- |
| GET    | `/clusters`               | List all clusters — filter: `?emerging=true` |
| GET    | `/clusters/:id`           | Get cluster with its headlines               |
| GET    | `/clusters/headlines/raw` | Raw scraped headlines — filter: `?source=`   |

### Research — Steps 2 & 3

| Method | Route                   | Description                                              |
| ------ | ----------------------- | -------------------------------------------------------- |
| POST   | `/research/topic-brief` | Generate topic brief — body: `{ clusterId }`             |
| POST   | `/research/generate`    | Generate research session — body: `{ articleId, angle }` |
| GET    | `/research/:articleId`  | All research sessions for article                        |
| GET    | `/research/session/:id` | Single research session                                  |

### AI routes — Steps 4–6

| Method | Route                 | Model  | Description                                                            |
| ------ | --------------------- | ------ | ---------------------------------------------------------------------- |
| POST   | `/ai/outline`         | Sonnet | Generate article outline — body: `{ articleId, angle, tone, sources }` |
| POST   | `/ai/inline-assist`   | Sonnet | Improve a paragraph inline — body: `{ articleId, paragraph, tone }`    |
| POST   | `/ai/counterpoint`    | Sonnet | Steelman opposing position — body: `{ articleId, paragraph }`          |
| POST   | `/ai/sub-edit`        | Sonnet | Full sub-edit analysis — body: `{ articleId }`                         |
| POST   | `/ai/score-headlines` | Sonnet | Score up to 3 headlines — body: `{ headlines: string[] }`              |
| POST   | `/ai/seo-metadata`    | Haiku  | Auto-generate SEO metadata — body: `{ articleId }`                     |
| POST   | `/ai/packaging`       | Haiku  | Full packaging suite — body: `{ articleId }`                           |
| POST   | `/ai/image-concept`   | Haiku  | Image concept only — body: `{ articleId }`                             |
| POST   | `/ai/social-captions` | Haiku  | Social captions only — body: `{ articleId }`                           |
| POST   | `/ai/pull-quotes`     | Haiku  | Pull quotes only — body: `{ articleId }`                               |

### Publish — Step 7

| Method | Route                               | Description                       |
| ------ | ----------------------------------- | --------------------------------- |
| POST   | `/publish/:articleId`               | Direct publish                    |
| POST   | `/publish/:articleId/submit-review` | Submit for Admin approval         |
| POST   | `/publish/:articleId/approve`       | Admin approves and publishes      |
| POST   | `/publish/:articleId/reject`        | Admin rejects — body: `{ notes }` |
| GET    | `/publish/queue`                    | Pending review queue              |
| GET    | `/publish/checklist/:articleId`     | Pre-publish checklist status      |

### Supporting routes

| Method | Route                      | Description                   |
| ------ | -------------------------- | ----------------------------- |
| GET    | `/users`                   | List users                    |
| POST   | `/users`                   | Create user (Admin only)      |
| PATCH  | `/users/:id`               | Update user                   |
| DELETE | `/users/:id`               | Delete user — 204             |
| GET    | `/media`                   | List media assets             |
| POST   | `/media/upload`            | Upload — returns CDN URL      |
| PATCH  | `/media/:id`               | Update media metadata         |
| DELETE | `/media/:id`               | Delete media — 204            |
| GET    | `/analytics/overview`      | Platform analytics overview   |
| GET    | `/analytics/top-articles`  | Top performing articles       |
| GET    | `/analytics/traffic`       | Daily traffic data            |
| GET    | `/analytics/article/:slug` | Per-article analytics by slug |
| POST   | `/scrape/trigger`          | Manually trigger scrape cycle |
| GET    | `/scrape/status/:jobId`    | Scrape job status             |
| GET    | `/scrape/last-run`         | Last scrape run summary       |
| GET    | `/health`                  | Health check                  |

---

## 7. AI service architecture

All AI calls go through a single `AIService` layer in `src/services/ai.service.ts`. No route should call Anthropic or Perplexity directly.

### 7.1 Core call wrapper

```typescript
async function callClaude<T>(
  model: string,
  system: string,
  user: string,
  schema: z.ZodType<T>,
  maxTokens: number = 1000,
): Promise<T>;

// Flow:
// 1. Call model, strip markdown fences from response
// 2. JSON.parse → Zod validate against schema
// 3. On validation failure: retry ONCE with stricter prompt appended
// 4. On second failure: throw — route returns graceful fallback to client
```

### 7.2 Exported functions

| Function                 | Model      | Called by                    |
| ------------------------ | ---------- | ---------------------------- |
| `clusterHeadlines()`     | Haiku      | Cluster BullMQ worker        |
| `generateTopicBrief()`   | Sonnet     | `POST /research/topic-brief` |
| `searchPerplexity()`     | Perplexity | `POST /research/generate`    |
| `synthesiseResearch()`   | Haiku      | `POST /research/generate`    |
| `generateOutline()`      | Sonnet     | `POST /ai/outline`           |
| `inlineAssist()`         | Sonnet     | `POST /ai/inline-assist`     |
| `generateCounterpoint()` | Sonnet     | `POST /ai/counterpoint`      |
| `subEditArticle()`       | Sonnet     | `POST /ai/sub-edit`          |
| `scoreHeadlines()`       | Sonnet     | `POST /ai/score-headlines`   |
| `generateSEOMetadata()`  | Haiku      | `POST /ai/seo-metadata`      |
| `generatePackaging()`    | Haiku      | `POST /ai/packaging`         |

### 7.3 Response validation pattern

````typescript
const _call = async (prompt: string): Promise<T> => {
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = (response.content[0] as { text: string }).text
    .trim()
    .replace(/^```json|```$/g, "") // strip markdown fences
    .trim();
  return schema.parse(JSON.parse(raw)); // Zod validates shape
};

try {
  return await _call(user);
} catch {
  // Retry once with stricter instruction
  return await retryOnce(() =>
    _call(user + "\n\nRespond with valid JSON only. No preamble."),
  );
}
````

---

## 8. Worker architecture

Three BullMQ workers run as separate Node.js processes. They communicate via Redis queues and never block the main API server.

| Worker               | Queue      | Trigger                                           | Concurrency    |
| -------------------- | ---------- | ------------------------------------------------- | -------------- |
| `scrape.worker.ts`   | `scrape`   | BullMQ repeatable — every 30 min + manual trigger | 1 (no overlap) |
| `cluster.worker.ts`  | `cluster`  | Dispatched by scrape worker after each scrape     | 2              |
| `research.worker.ts` | `research` | Dispatched by `POST /research/generate`           | 3              |

### 8.1 Scrape worker flow

```
1. BullMQ fires "scrape-all-sources" job every 1,800,000ms
2. Runs scrapeAllSources()
   - Playwright for JS-rendered sources (Prothom Alo)
   - Cheerio for static HTML (Daily Star, BDNews24, Jugantor, Dhaka Tribune)
   - Playwright falls back to Cheerio on failure
3. Stores ScrapedHeadline records in PostgreSQL
4. Dispatches "run-clustering" job to cluster queue
5. Logs: headlineCount, sources, completedAt
```

### 8.2 Cluster worker flow

```
1. Receives headlines[] from scrape worker
2. Checks Redis cache — hit: skip AI call
3. Miss: calls clusterHeadlines() via Claude Haiku
4. Stores Cluster records in PostgreSQL
5. Sets Redis cache with 30-minute TTL
6. Logs: clusterCount, headlineCount
```

### 8.3 Research worker flow

```
1. Receives { articleId, angle }
2. Checks Redis cache — hit: return cached result
3. Miss:
   a. searchPerplexity(angle) — live web search with citations
   b. Enrich sources with credibility tier
   c. synthesiseResearch(angle, sources) via Claude Haiku
4. Stores ResearchSession in PostgreSQL
5. Sets Redis cache with 2-hour TTL
```

---

## 9. Database schema

### Core tables

| Table               | Key fields                                                                          | Notes                           |
| ------------------- | ----------------------------------------------------------------------------------- | ------------------------------- |
| `users`             | id, email, name, role, password                                                     | role: `ADMIN \| EDITOR`         |
| `articles`          | id, title, slug, body(JSON), status, angle, tone                                    | body stores Tiptap block JSON   |
| `categories`        | id, name, slug, parentId                                                            | supports parent-child hierarchy |
| `tags`              | id, name, slug                                                                      | flat taxonomy                   |
| `scraped_headlines` | id, source, headline, url, scraped_at, cluster_id                                   | 5 source enum values            |
| `clusters`          | id, topic, summary, sentiment, article_count, is_emerging                           | generated by Haiku each cycle   |
| `research_sessions` | id, article_id, angle, sources(JSON), timeline(JSON), data_points(JSON), gaps(JSON) | linked to article               |
| `revisions`         | id, article_id, body(JSON), title, saved_at                                         | created on every autosave       |
| `media`             | id, filename, url, mime_type, size, alt                                             | CDN URL stored, not the file    |

### Key enums

```prisma
enum ArticleStatus { DRAFT  PENDING_REVIEW  PUBLISHED  ARCHIVED }
enum Tone          { ANALYTICAL  CRITICAL  EXPLANATORY }
enum UserRole      { ADMIN  EDITOR }
enum Source        { PROTHOM_ALO  DAILY_STAR  BDNEWS24  JUGANTOR  DHAKA_TRIBUNE }
```

### Prisma schema (condensed)

```prisma
model Article {
  id               String        @id @default(uuid())
  title            String
  slug             String        @unique
  body             Json?
  status           ArticleStatus @default(DRAFT)
  angle            String?
  tone             Tone?
  metaTitle        String?
  metaDescription  String?
  tags             String[]
  publishedAt      DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  authorId         String
  categoryId       String?
  revisions        Revision[]
  researchSessions ResearchSession[]
}

model ResearchSession {
  id         String   @id @default(uuid())
  articleId  String
  angle      String
  sources    Json
  timeline   Json
  dataPoints Json
  gaps       Json
  createdAt  DateTime @default(now())
}

model ScrapedHeadline {
  id        String   @id @default(uuid())
  source    Source
  headline  String
  url       String
  scrapedAt DateTime @default(now())
  clusterId String?
}
```

---

## 10. Cache strategy

| Cache key                            | TTL   | Contents                     | Invalidation                    |
| ------------------------------------ | ----- | ---------------------------- | ------------------------------- |
| `cluster:{sha256(sorted_headlines)}` | 1800s | Haiku cluster output         | Auto-expiry — next scrape cycle |
| `research:{sha256(angle)}`           | 7200s | Perplexity + Haiku synthesis | Auto-expiry — 2 hours           |

BullMQ and the cache layer share one Redis instance. Two separate key namespaces (`cluster:` and `research:`) ensure no key collisions with BullMQ's internal keys.

```typescript
// Cache helpers — src/redis/cache.ts
export const makeKey = (prefix: string, content: string): string => {
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  return `${prefix}:${hash}`;
};

export const getCached = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCached = async (key: string, value: unknown, ttl: number) => {
  await redis.setex(key, ttl, JSON.stringify(value));
};
```

---

## 11. Project structure

```
beyond-headlines-api/
├── src/
│   ├── app.ts                   # Express setup, middleware, Swagger, route mounting
│   ├── server.ts                # app.listen() entry point
│   ├── config.ts                # dotenv config object
│   ├── middleware/
│   │   ├── auth.ts              # authenticate + requireAdmin
│   │   ├── validate.ts          # Zod validation middleware factory
│   │   └── errorHandler.ts      # Global 500 error handler
│   ├── routes/
│   │   ├── index.ts             # Mounts all routers under /api/v1
│   │   ├── auth.routes.ts
│   │   ├── articles.routes.ts
│   │   ├── categories.routes.ts
│   │   ├── tags.routes.ts
│   │   ├── clusters.routes.ts   # Step 1
│   │   ├── research.routes.ts   # Steps 2 & 3
│   │   ├── ai.routes.ts         # Steps 4, 5, 6
│   │   ├── publish.routes.ts    # Step 7
│   │   ├── users.routes.ts
│   │   ├── media.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── scrape.routes.ts
│   ├── services/
│   │   ├── ai.service.ts        # All Claude + Perplexity calls
│   │   ├── scraper.service.ts   # Playwright + Cheerio
│   │   ├── cache.service.ts     # Redis get/set helpers
│   │   └── publish.service.ts   # Checklist validation, slug generation
│   ├── workers/
│   │   ├── queue.ts             # BullMQ queue definitions + scheduler
│   │   ├── scrape.worker.ts
│   │   ├── cluster.worker.ts
│   │   └── research.worker.ts
│   ├── types/
│   │   ├── ai.types.ts          # Zod schemas for all AI responses
│   │   ├── article.types.ts
│   │   └── user.types.ts
│   ├── data/
│   │   └── mockData.ts          # All in-memory mock data
│   ├── redis/
│   │   ├── client.ts            # ioredis instance
│   │   └── cache.ts             # makeKey, getCached, setCached
│   ├── db/
│   │   └── client.ts            # Prisma client singleton
│   └── utils/
│       ├── credibility.ts       # getCredibilityTier(url)
│       ├── retry.ts             # retryOnce, retryWithBackoff
│       ├── delay.ts             # LATENCY helpers for mock mode
│       └── response.ts          # ok, created, notFound, list helpers
├── prisma/
│   └── schema.prisma
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 12. Auth system

JWT-based auth with two roles. The `authenticate` middleware is applied to every protected route. `requireAdmin` additionally checks role.

### JWT payload

```typescript
{
  id:    string,  // user UUID
  email: string,
  role:  'ADMIN' | 'EDITOR'
}
// Signed with JWT_SECRET | Expiry: 24h | Any password accepted in mock mode
```

### Middleware pattern

```typescript
// authenticate — verify JWT, attach req.user
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, config.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// requireAdmin — calls authenticate then checks role
export const requireAdmin = [
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    if ((req.user as any).role !== "ADMIN")
      return res.status(403).json({ error: "Forbidden" });
    next();
  },
];
```

### Zod validation middleware factory

```typescript
// validate(schema) — returns Express middleware
export const validate =
  (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success)
      return res.status(422).json({
        error: "Validation failed",
        details: result.error.errors,
      });
    req.body = result.data;
    next();
  };
```

---

## 13. Error handling

| Status | Scenario                 | Response shape                                                  |
| ------ | ------------------------ | --------------------------------------------------------------- |
| 200    | Success                  | `{ data }` or `{ data, meta: { total, page, limit } }`          |
| 201    | Resource created         | `{ ...newResource }`                                            |
| 204    | Deleted successfully     | (empty body)                                                    |
| 401    | Missing or invalid JWT   | `{ "error": "Unauthorized" }`                                   |
| 403    | Insufficient role        | `{ "error": "Forbidden" }`                                      |
| 404    | Resource not found       | `{ "error": "X not found" }`                                    |
| 422    | Zod validation failure   | `{ "error": "Validation failed", "details": [...] }`            |
| 422    | Publish checklist failed | `{ "error": "Pre-publish checklist failed", "missing": [...] }` |
| 500    | Unhandled server error   | `{ "error": "Internal server error" }` (generic in production)  |

---

## 14. Environment variables

| Variable                | Description                     | Example                                                  |
| ----------------------- | ------------------------------- | -------------------------------------------------------- |
| `PORT`                  | Server port                     | `8000`                                                   |
| `NODE_ENV`              | Environment flag                | `development`                                            |
| `DATABASE_URL`          | PostgreSQL connection string    | `postgresql://user:pass@localhost:5432/beyond_headlines` |
| `REDIS_URL`             | Redis connection string         | `redis://localhost:6379`                                 |
| `OPENROUTER_API_KEY`    | Single key for all AI models    | `sk-or-...`                                              |
| `CLAUDE_SONNET_MODEL`   | Sonnet model identifier         | `anthropic/claude-sonnet-4-5`                            |
| `CLAUDE_HAIKU_MODEL`    | Haiku model identifier          | `anthropic/claude-haiku-4-5`                             |
| `PERPLEXITY_SONAR_MODEL`| Perplexity model identifier     | `perplexity/sonar-pro`                                   |
| `JWT_SECRET`            | JWT signing secret              | `your-secret-key`                                        |
| `SCRAPE_INTERVAL_MS`    | Scrape interval in milliseconds | `1800000`                                                |
| `CLUSTER_CACHE_TTL`     | Cluster cache TTL in seconds    | `1800`                                                   |
| `RESEARCH_CACHE_TTL`    | Research cache TTL in seconds   | `7200`                                                   |

---

## 15. Open items & pending inputs

These items from the project kickoff meeting are still pending and will directly affect implementation:

| Item                                    | Owner                 | Impact on implementation                                           |
| --------------------------------------- | --------------------- | ------------------------------------------------------------------ |
| Revision algorithm details              | Arshif Bhai           | Affects Step 5 sub-editing prompt design and scoring logic         |
| Dataset use case                        | Ashraf Bhai           | Affects Step 3 research library storage schema and retrieval logic |
| Model pricing comparison (500 articles) | Dev team              | Cost estimate across Claude, OpenAI, and Perplexity                |
| Brand guidelines & assets               | Beyond Headlines team | Required before any writing or sub-editing prompt can be finalised |
| Final 5 scraping sources                | Beyond Headlines team | Required before Playwright/Cheerio selectors can be implemented    |
| Cloud hosting provider                  | Beyond Headlines team | DigitalOcean vs Vultr — affects deployment and infra config        |

---

## 16. Quick start

### Prerequisites
- Docker & Docker Compose installed
- An OpenRouter API key (`sk-or-...`)

### Setup

```bash
# 1. Copy and fill in environment variables
cp beyond-headlines-api/.env.example beyond-headlines-api/.env
# Edit .env — set OPENROUTER_API_KEY and JWT_SECRET

# 2. Start all services (postgres, redis, api, workers)
docker compose up -d

# 3. Run Prisma migrations (first time only)
docker compose run --rm migrate

# 4. Check everything is healthy
docker compose ps
```

**API:** `http://localhost:8000`
**Swagger docs:** `http://localhost:8000/docs`
**Health check:** `http://localhost:8000/health`

### Common Commands

```bash
# View live logs for the API
docker compose logs -f api

# View worker logs
docker compose logs -f worker-scrape worker-cluster worker-research

# Stop everything
docker compose down

# Stop and wipe all data volumes (full reset)
docker compose down -v

# Restart a single service after a code change
docker compose restart api

# Run Prisma Studio (DB browser) against the container
docker compose exec api npx prisma studio

# Open a psql shell
docker compose exec postgres psql -U bh_user -d beyond_headlines
```

### Services in Docker Compose

| Container | Purpose | Port |
| :--- | :--- | :--- |
| `bh_postgres` | PostgreSQL 16 database | 5432 |
| `bh_redis` | Redis 7 (BullMQ + cache) | 6379 |
| `bh_api` | Express.js API + Swagger | 8000 |
| `bh_worker_scrape` | BullMQ scrape job | — |
| `bh_worker_cluster` | BullMQ cluster job | — |
| `bh_worker_research` | BullMQ research job | — |
| `bh_migrate` | One-shot Prisma migration | — |

### Production deployment

For production, use the `production` target in the Dockerfile:

```bash
# Build production images
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Or use PM2 directly on a bare VPS after SSH: see `npm run workers:*` scripts.

### Switch mock → real AI

All routes currently return mock data from `src/data/mockData.ts`. To wire up real AI, replace the mock return in each route with the matching `ai.service.ts` function. The service layer is already fully implemented — it is a one-line swap per route.

```typescript
// Mock (current):
return res.json({
  articleId,
  ...MOCK_OUTLINE,
  generatedAt: new Date().toISOString(),
});

// Real (swap to):
const outline = await generateOutline(angle, tone, sources);
return res.json({
  articleId,
  ...outline,
  generatedAt: new Date().toISOString(),
});
```

### package.json scripts

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "workers:scrape": "ts-node src/workers/scrape.worker.ts",
    "workers:cluster": "ts-node src/workers/cluster.worker.ts",
    "workers:research": "ts-node src/workers/research.worker.ts"
  }
}
```

### Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0",
    "swagger-jsdoc": "^6.0.0",
    "swagger-ui-express": "^5.0.0",
    "zod": "^3.22.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "@prisma/client": "^5.0.0",
    "bullmq": "^5.0.0",
    "ioredis": "^5.0.0",
    "playwright": "^1.40.0",
    "cheerio": "^1.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/swagger-jsdoc": "^6.0.0",
    "@types/swagger-ui-express": "^4.0.0",
    "@types/cors": "^2.8.0",
    "@types/node": "^20.0.0",
    "prisma": "^5.0.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

_Beyond Headlines — Notionhive Bangladesh Ltd. | All rights reserved._
