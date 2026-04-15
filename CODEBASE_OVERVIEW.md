# Beyond Headlines — Complete Codebase Overview

**Status:** April 2026 | Notionhive Bangladesh Ltd.
**Stack:** Node.js + Express.js + TypeScript | Next.js | PostgreSQL | Redis | BullMQ | Claude AI (via OpenRouter)

---

## 🎯 Project Summary

**Beyond Headlines** is an **AI-assisted news editorial platform** designed for decision-makers, professionals, and political bodies. It combines:
- A **public-facing typography-first website** (Phase 3 — Not Started)
- An **internal AI-powered editorial dashboard** (Phase 2 — In Progress)
- A **REST API backend** (Phase 1 — Complete) with AI integration

The key principle: **AI is never reader-facing**. All AI output is reviewed and approved by human editors before publication.

---

## 🏗️ Architecture Overview

### Three-Tier Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND                                       │
│  Next.js (App Router) — Editorial Dashboard + Public Website     │
│  • Localhost:3000                                                │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                   API BACKEND                                    │
│  Express.js + TypeScript                                        │
│  • localhost:8000/api/v1 (REST endpoints)                       │
│  • JWT Auth + Zod Validation                                    │
│  • OpenRouter AI Gateway (Claude, Perplexity)                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
       ┌─────────┼─────────┬──────────┐
       │         │         │          │
    ┌──▼──┐  ┌──▼──┐  ┌───▼──┐  ┌──▼──┐
    │ DB  │  │Cache│  │Queue │  │Workers
    │ PG  │  │Redis│  │BullMQ│  │
    └─────┘  └─────┘  └──────┘  └────┐
                                      │
                            ┌─────────▼────────┐
                            │  Scraper Worker  │
                            │  Cluster Worker  │
                            │  Research Worker │
                            │ Discovery Worker │
                            └──────────────────┘
```

### Services Provided

| Component      | Tech              | Purpose                                           |
|---|---|---|
| **API Server** | Express.js        | REST API with 15+ route modules                  |
| **Database**   | PostgreSQL        | Persistent article, user, cluster, headline data |
| **Cache**      | Redis             | Session cache, job queue, metadata caching       |
| **Job Queue**  | BullMQ + Redis    | Async task scheduling (scrape, cluster, research)|
| **AI Gateway** | OpenRouter        | Unified API for Claude & Perplexity models      |
| **Frontend**   | Next.js + Tailwind| Editorial dashboard + public website design      |

---

## 📂 Project Structure

### Backend (`beyond-headlines-api/`)

```
src/
├── app.ts              # Express app setup (middleware, Swagger, routes)
├── server.ts           # Entry point (port 8000)
├── config.ts           # Environment variables & model mappings
├── db/
│   └── client.ts       # Prisma DB singleton
├── redis/
│   ├── client.ts       # Redis connection pool
│   └── cache.ts        # Cache helpers (makeKey, getCached, setCached)
├── middleware/
│   ├── auth.ts         # JWT verification, role checks (ADMIN/EDITOR)
│   ├── errorHandler.ts # Global error handling
│   └── validate.ts     # Zod schema validation
├── routes/             # API endpoints (15 modules)
│   ├── auth.routes.ts
│   ├── articles.routes.ts
│   ├── clusters.routes.ts
│   ├── ai.routes.ts
│   ├── research.routes.ts
│   ├── intelligence.routes.ts
│   ├── scrape.routes.ts
│   ├── search.routes.ts
│   ├── users.routes.ts
│   ├── categories.routes.ts
│   ├── tags.routes.ts
│   ├── media.routes.ts
│   ├── analytics.routes.ts
│   ├── publish.routes.ts
│   └── index.ts
├── services/
│   ├── ai.service.ts   # AI model calls (Claude Sonnet, Haiku, Perplexity)
│   ├── cache.service.ts
│   └── publish.service.ts
├── workers/            # BullMQ job handlers
│   ├── queue.ts        # Queue definitions & triggers
│   ├── cluster.worker.ts    # Headline clustering pipeline
│   ├── research.worker.ts   # Research synthesis
│   ├── discovery.worker.ts  # Intelligence discovery
│   └── scrape.worker.ts     # Web scraper
├── types/
│   ├── ai.types.ts     # AI response schemas (Zod)
│   ├── article.types.ts
│   ├── user.types.ts
│   └── index.ts
├── utils/
│   ├── jwt.ts          # Token sign/verify
│   ├── response.ts     # Standard API response wrappers
│   └── delay.ts
├── data/
│   └── mockData.ts     # Initial test data
└── scripts/
    └── fix-auth.ts
```

### Frontend (`beyond-headlines-web/`)

```
src/
├── app/
│   ├── layout.tsx          # Root layout (AuthProvider)
│   ├── page.tsx            # Public homepage
│   ├── login/              # Login page
│   ├── dashboard/          # Editorial dashboard (7-step workflow)
│   │   ├── briefs/         # Step 2: Brief generation
│   │   ├── clusters/       # Step 1: Cluster management
│   │   ├── editor/         # Step 4: Article editor
│   │   ├── packaging/      # Step 6: Social packaging
│   │   ├── research/       # Step 3: Research workspace
│   │   ├── sub-editing/    # Step 5: Sub-editing
│   │   └── publishing/     # Step 7: Publishing workflow
│   ├── articles/           # Public article detail
│   ├── category/           # Category pages
│   └── globals.css         # Tailwind +  design tokens
├── components/
│   ├── layout/             # Navigation, Layout wrappers
│   ├── public/             # Public site components (hero, grid)
│   └── dashboard/          # Dashboard UI components
├── context/
│   └── AuthContext.tsx     # User auth state + JWT management
├── hooks/                  # Custom React hooks
├── lib/
│   ├── api.ts              # Axios client + JWT interceptors
│   └── render.ts           # Text rendering utilities
├── types/
│   └── index.ts            # Shared TypeScript types
└── public/                 # Static assets
```

### Database (`beyond-headlines-api/prisma/`)

```
schema.prisma contains:
├── User              # role: ADMIN | EDITOR
├── Category          # Hierarchical categories
├── Tag               # Article tags
├── Article           # Main content (with Revision history)
├── Revision          # Article version snapshots
├── ScrapedHeadline   # Raw headlines (from scrapers)
├── Cluster           # Grouped headline topics
├── ResearchSession   # Research notes & sources
├── Media             # Uploaded images/assets
└── SelectorConfig    # CSS selectors for each news source
```

---

## 🔄 Core Workflows

### Workflow #1: 7-Step Editorial Workflow (Dashboard)

The editorial dashboard guides journalists through a structured process:

| Step | Task | AI Model | Input | Output | User Action |
|---|---|---|---|---|---|
| **1** | News Intelligence | Rule-based | Scraped headlines | Clusters, emerging flags | Review clusters |
| **2** | Brief Generation | Claude Sonnet | Cluster + angle | Topic brief with framing | Accept/Edit/Reject |
| **3** | Research Synthesis | Claude Haiku + Perplexity | Query + web search | Sources, timeline, data points | Add/remove sources |
| **4** | Article Drafting | Claude Sonnet | Outline + angle + tone | Full article draft | Write/edit inline |
| **5** | Sub-editing | Claude Sonnet | Draft | Clarity analysis + headline scores | Refine & approve |
| **6** | Packaging | Claude Haiku | Article + images | SEO metadata, social captions | Review & edit |
| **7** | Publishing | None (CMS) | Finalized article | Published article | Checklist + publish button |

### Workflow #2: Intelligence Discovery (Background Jobs)

1. **User triggers search** (e.g., "Election protests in Dhaka")
2. **Discovery Worker**:
   - Categorizes query (Politics, National, etc.)
   - Triggers scraping for relevant sources
3. **Scrape Worker**:
   - Fetches from 6 primary Bangladeshi sources
   - Stores raw headlines in `ScrapedHeadline` table
4. **Cluster Worker**:
   - Groups headlines by topic using Claude Haiku
   - Marks clusters as "emerging" if recent spike
5. **Deep Extraction** (optional):
   - Fetches full article content for top 3 headlines
   - Uses Cheerio to parse HTML selectors
6. **Result**: Editor sees clusters ready for angle selection

### Workflow #3: Background Scraping

**Sources:** Prothom Alo, Daily Star, BDNews24, Jugantor, Dhaka Tribune, Ittefaq

**Process:**
- **Time**: Configurable interval (default: 30 mins)
- **Fetching**: HTTP GET + Cheerio CSS selectors
- **Parsing**: Extract headline, URL, category
- **Storage**: PostgreSQL `ScrapedHeadline` table
- **Cache**: Headlines indexed via PostgreSQL full-text search (TSVector)

---

## 🤖 AI Service Layer

### Models & Cost Strategy

**Goal:** Use expensive models only where output quality affects published content.

| Model | Purpose | Cost | Access | Used In |
|---|---|---|---|---|
| **Claude Sonnet 4.5** | Quality-critical writing | High (~$3 per 1M tokens) | OpenRouter | Drafting, sub-editing, counterpoints |
| **Claude Haiku 4.5** | Fast structured outputs | Low (~$0.20 per 1M tokens) | OpenRouter | Clustering, categorization, SEO |
| **Perplexity Sonar** | Live web search | Medium | OpenRouter | Research synthesis with grounding |

### Key AI Functions (`ai.service.ts`)

```typescript
// Clustering & Discovery
categorizeQuery(query)           // → Politics, Sports, etc.
clusterHeadlines(headlines)      // → [{ topic, summary, sentiment, is_emerging }]
selectTop3Articles(query)        // → [indices] for deep scraping

// Editorial Support
generateTopicBrief(angle, cluster)       // → Framing, tone guide
generateOutline(angle, tone, sources)    // → Section outline
inlineAssist(paragraph, tone)            // → Improved sentence
generateCounterpoint(paragraph)          // → Opposing viewpoint
subEditArticle(body)             // → {clarity, headlines, issues}
scoreHeadlines(headlines)        // → {scores, rationale}

// Packaging
generateSEOMetadata(title, body) // → {metaTitle, metaDescription}
generatePackaging(article)       // → {captions, socialMessages}

// Research
searchPerplexity(query)          // → Web search results
synthesizeResearch(sources)      // → Structured timeline & data points
```

### Error Handling Strategy

**Principle:** "Fail gracefully — AI never blocks workflow"

```typescript
try {
  return await callModel(prompt)    // 45s timeout
} catch {
  // Retry once with stricter instruction
  return await _call(prompt + "\n\nRespond with valid JSON only.")
}
// On final failure: return graceful fallback (empty array, template)
```

---

## 🎫 Authentication & Authorization

### JWT-Based Auth

**Login Flow:**
1. User POSTs `{ email, password }` to `/auth/login`
2. Server verifies bcrypt hash, generates JWT token
3. Token stored in localStorage (frontend)
4. Axios interceptor adds `Authorization: Bearer {token}` to all requests

**Roles:**
- **ADMIN**: Full system access
- **EDITOR**: Can draft, edit, publish articles (Phase 1 scope)

**Protected Routes:**
- All `/api/v1/*` routes except `/auth/login`, `/auth/register`
- Frontend routes redirect unauthenticated users to `/login`

**Tokens:**
- **Issued by:** `signToken(email)` in `utils/jwt.ts`
- **Verified by:** `authenticate` middleware
- **Stored:** `localStorage.bh_token` (frontend)

---

## 💾 Database Schema (Prisma)

### Core Models

**User**
```prisma
id, email (unique), name, role (ADMIN|EDITOR), password (bcrypt), avatar, createdAt
```

**Article**
```prisma
id, title, slug, body (JSON), excerpt, status (DRAFT|PENDING|PUBLISHED|ARCHIVED)
angle, tone (ANALYTICAL|CRITICAL|EXPLANATORY), metaTitle, metaDescription
bannerImage, tags[], publishedAt, createdAt, authorId (FK), categoryId (FK)
```

**Category** (Hierarchical)
```prisma
id, name, slug, parentId (self-join), children relation
```

**ScrapedHeadline**
```prisma
id, source, headline, url (unique), category, scrapedAt
content (full HTML), clusterId (FK), headline_tsv (PostgreSQL TSVector for full-text search)
```

**Cluster** (Grouped headlines)
```prisma
id, topic, summary, category, sentiment, articleCount, isEmerging, createdAt
headlines (relation to ScrapedHeadline[])
```

**ResearchSession**
```prisma
id, angle, sources (JSON), timeline (JSON), dataPoints (JSON), gaps (JSON)
createdAt, articleId (FK)
```

**Revision** (History tracking)
```prisma
id, body (JSON), title, savedAt, articleId (FK), authorId (FK)
```

### Indexes
- Full-text search on `ScrapedHeadline.headline_tsv` (GIN index)
- Unique constraints on slugs, emails, URLs

---

## 🔗 Key API Routes

### Authentication
- `POST /auth/login` → {token, user}
- `POST /auth/register` → {token, user}

### Intelligence & Clustering
- `GET /intelligence` → {query, results, clusters, jobStatus}
- `GET /clusters` → [{topic, summary, sentiment, isEmerging}]
- `GET /clusters/:id` → {cluster, headlines}
- `POST /clusters/trigger` → {jobId} (scrape/cluster async)

### Articles & Editorial
- `GET /articles` → [{title, slug, status, author}]
- `POST /articles` → {id, title, slug, ...} (create draft)
- `PUT /articles/:id` → {updated article}
- `GET /articles/:id/revisions` → [{body, title, savedAt}]

### AI Services
- `POST /ai/outline` → {sections, summary}
- `POST /ai/inline-assist` → {improved_text, suggestions}
- `POST /ai/sub-edit` → {clarity, headlines, issues}
- `POST /ai/packaging` → {seoMetadata, socialCaptions}

### Publishing
- `POST /publish/:articleId` → {status: PUBLISHED, publishedAt}
- `GET /analytics/:slug` → {views, clicks, timeOnPage}

### Media & Assets
- `POST /media/upload` → {id, url, mimeType}
- `GET /media` → [{filename, url, size}]

---

## 🏃 Background Workers (BullMQ + Redis)

### Queue: `scrape`
**Triggered:** Manual via `/scrape/trigger` or scheduled (Phase 5)
**Job:** Fetch headlines from 6 sources, parse with Cheerio, store in DB
**Retry:** 3 attempts with exponential backoff
**Output:** Populates `ScrapedHeadline` table

### Queue: `cluster`
**Triggered:** After scrape completes or manual trigger
**Job:** Group headlines by topic using Claude Haiku
**Details:**
- Reads unclustered headlines from DB
- Optionally filters by query (e.g., "election")
- Groups semantically similar headlines
- Detects "emerging" topics (recent spike)
**Output:** Creates `Cluster` records, updates `ScrapedHeadline.clusterId`

### Queue: `research`
**Triggered:** When user selects cluster angle
**Job:** Synthesize research from Perplexity + structured format
**Details:**
- Web search via Perplexity Sonar Pro
- Extract timeline, data points, gaps
- Format as JSON structure
**Output:** `ResearchSession` record with sources & timeline

### Queue: `discovery`
**Triggered:** User searches for intelligence (e.g., "Election protests")
**Job:** Chain scrape → cluster → research in one flow
**Coordinator:** Orchestrates scrape → cluster → research job sequence

---

## 🐳 Docker Compose Infrastructure

**Services:**
1. **postgres** (v16) — Database
   - Port: 5432
   - Volume: `postgres_data`
   - Health Check: `pg_isready`

2. **redis** (v7) — Cache + Queue
   - Port: 6379
   - Volume: `redis_data`
   - Health Check: `redis-cli ping`

3. **api** (Express.js)
   - Port: 8000
   - Depends on: postgres, redis (healthy)
   - Hot reload: src/ volumes

4. **worker-scrape** (BullMQ)
   - Polls scrape queue
   - Depends on: postgres, redis

5. **worker-cluster** (BullMQ)
   - Polls cluster queue
   - Depends on: postgres, redis

6. **worker-research** (BullMQ)
   - Polls research queue
   - Depends on: postgres, redis

7. **worker-discovery** (BullMQ)
   - Polls discovery queue
   - Orchestrates job chains

**Start:** `docker-compose up --build`

---

## 📊 Frontend Components & Pages

### Public Pages (Phase 3 — Not Started)
- `/` — Homepage + hero + category feeds
- `/articles/:slug` — Article detail with comments & analytics
- `/category/:slug` — Category page with filtered articles

### Login & Auth
- `/login` — JWT login form (email + password)
- `/register` — Editor registration (Phase 1: Admins only)

### Dashboard Pages (Phase 2 — In Progress)
- `/dashboard` — Main dashboard hub (7 steps visible)
- `/dashboard/clusters` — **Step 1:** Manage clusters, select angles
- `/dashboard/briefs` — **Step 2:** Generate topic briefs
- `/dashboard/research` — **Step 3:** Research workspace
- `/dashboard/editor` — **Step 4:** Article drafting with Tiptap
- `/dashboard/sub-editing` — **Step 5:** Clarity analysis + headlines
- `/dashboard/packaging` — **Step 6:** SEO + social captions
- `/dashboard/publishing` — **Step 7:** Final checklist & publish

### Key Components
- **AuthContext** — Global user state + JWT storage
- **PublicNav** — Navigation for public site
- **FeaturedArticle** — Hero article display
- **ArticleGrid** — Responsive article cards
- **Editor** — Tiptap editor integration (Phase 2)

---

## 🔐 Security & Best Practices

| Aspect | Implementation |
|---|---|
| **Password Hashing** | bcrypt (10 salt rounds) |
| **JWT Tokens** | HS256 with `jwtSecret` from `.env` |
| **Rate Limiting** | 1000 req/15min per IP (`express-rate-limit`) |
| **CORS** | Enabled (all origins in dev) |
| **Helmet** | Security headers (CSP, X-Frame-Options, etc.) |
| **Validation** | Zod schemas on all inputs |
| **Error Handling** | No stack traces in production responses |
| **Database** | Parameterized queries (Prisma ORM) |

---

## 📋 Environment Variables

**Backend (.env)**
```
PORT=8000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/beyond_headlines

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-secret-key-here

# OpenRouter (AI Gateway)
OPENROUTER_API_KEY=your-openrouter-key
CLAUDE_SONNET_MODEL=anthropic/claude-sonnet-4-5
CLAUDE_HAIKU_MODEL=anthropic/claude-haiku-4-5
PERPLEXITY_SONAR_MODEL=perplexity/sonar

# Worker Intervals
SCRAPE_INTERVAL_MS=1800000    # 30 minutes
CLUSTER_CACHE_TTL=1800         # 30 minutes
RESEARCH_CACHE_TTL=7200        # 2 hours
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 🚀 Getting Started

### Backend Setup
```bash
cd beyond-headlines-api
npm install
cp .env.example .env  # Edit with your values
npm run db:migrate
npm run db:seed
npm run dev  # Starts on :8000
```

### Frontend Setup
```bash
cd beyond-headlines-web
npm install
npm run dev  # Starts on :3000
```

### Docker (Full Stack)
```bash
docker-compose up --build
# API: localhost:8000/docs
# Frontend: localhost:3000
```

### Running Individual Workers
```bash
# Terminal 1
npm run workers:cluster

# Terminal 2
npm run workers:research

# Terminal 3
npm run workers:scrape

# Terminal 4
npm run workers:discovery
```

---

## 📈 Project Status (April 2026)

| Phase | Component | Status | Notes |
|---|---|---|---|
| **Phase 0** | Infrastructure | ✅ Complete | Docker, Postgres, Redis, Prisma |
| **Phase 1** | Backend API | ✅ Complete | 15 route modules, AI services, workers |
| **Phase 2** | Dashboard | 🚧 In Progress | Step 1 done, Steps 2–7 in design |
| **Phase 3** | Public Website | ❌ Not Started | Typography-first design |
| **Phase 4** | Testing & QA | ❌ Not Started | Unit, integration, E2E tests |

---

## 🎨 Design Principles

1. **Structured Output, Not Chat** — AI responses are formatted reports, not conversational.
2. **Always Assistive, Never Autonomous** — Humans approve all AI suggestions before publication.
3. **Fail Gracefully** — If AI times out, journalists can still work manually.
4. **Cost-Aware AI Selection** — Expensive models (Sonnet) only for published content.
5. **Full Editorial Control** — Every step has accept/reject/edit controls.

---

## 📚 Key Files Reference

| File | Purpose |
|---|---|
| `project-document.md` | Full product spec & AI model map |
| `implementation_plan.md` | Phase-wise project roadmap |
| `beyond-headlines-api/README.md` | API quick start |
| `beyond-headlines-api/src/services/ai.service.ts` | All AI calls & schemas |
| `beyond-headlines-api/prisma/schema.prisma` | Complete database schema |
| `beyond-headlines-web/src/context/AuthContext.tsx` | Frontend auth state |
| `docker-compose.yml` | Full infrastructure config |

---

## 💡 Next Steps (Phase 2–3)

1. **Complete Dashboard Steps 2–7** (Briefs, Research, Drafting, Sub-Editing, Packaging, Publishing)
2. **Build Public Website** (HomePage, ArticleDetail, CategoryPages)
3. **Integrate Comments** (Facebook Comments Plugin)
4. **Analytics Tracking** (Google Analytics + slug-wise)
5. **Ads Integration** (Google Ad Manager)
6. **Testing & CI/CD** (Jest, E2E with Playwright)
7. **Production Deployment** (Vercel for frontend, AWS/Railway for backend)

---

**End of Overview** | Questions? Check `project-document.md` for deep dive.
