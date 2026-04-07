# Beyond Headlines — Phase-Wise Project Plan

> **Notionhive Bangladesh Ltd.** | April 2026
> Stack: Next.js · Express.js · TypeScript · PostgreSQL · BullMQ · Redis · Claude · Perplexity

---

## Project Status Snapshot

| Component | Status |
| :--- | :--- |
| Mock REST API (Express.js) | ✅ Complete & Aligned |
| Infrastructure (Docker) | ✅ Live (Postgres, Redis, API, Workers) |
| Database (Prisma) | ✅ Schema Migrated & Seeded |
| AI Gateway (OpenRouter) | ✅ Service Layer Fully Implemented |
| Background Workers | ✅ Architecture Active |
| Next.js Dashboard | [/] Phase 2 (In Progress - Shell & Step 1 Done) |
| Public Website | ❌ Phase 3 (Not Started) |

---

## Phase 0 — Foundation & Environment Setup
**Goal: Get the real infrastructure running locally.**

### 0.1 Docker Compose Infrastructure
- [x] Create `docker-compose.yml` and `Dockerfile`
- [x] Configure Postgres (v16) for persistent data
- [x] Configure Redis (v7) for BullMQ and Caching
- [x] Verify container health and networking
- [x] Initial Prisma migration and Database seeding

### 0.2 Repository & Tooling
- [x] Setup `.env` with OpenRouter and DB secrets
- [x] Initialize Prisma Client generation
- [ ] Configure ESLint + Prettier for multi-repo consistency
- [ ] Establish Git Flow (main / develop / feature branches)

### 0.3 AI Gateway Configuration
- [x] Register OpenRouter API access
- [x] Configure Model Identifiers (Sonnet 4.5, Haiku, Sonar Pro)
- [x] Implement error handling and Zod validation wrapper

---

## Phase 1 — Backend: Production Logic
**Goal: Replace mocks with real editorial intelligence and persistence.**

### 1.1 Database Layer (Prisma)
- [x] Integrate `db.article`, `db.cluster`, and `db.user` into routes
- [x] Implement Revision history logic
- [x] Implement Category/Tag filtering via Prisma
- [x] Auth Hardening: Implement bcrypt password hashing

### 1.2 Real AI Service Integration
- [x] `generateTopicBrief()` (Claude Sonnet)
- [x] `generateOutline()` & `inlineAssist()` (Claude Sonnet)
- [x] `searchPerplexity()` (Sonar Pro) & `synthesiseResearch()` (Haiku)
- [x] `subEditArticle()` & `scoreHeadlines()` (Claude Sonnet)
- [x] `generatePackaging()` & `generateSEOMetadata()` (Claude Haiku)

### 1.3 BullMQ & Redis Integration
- [x] Real `ioredis` connection pool implementation
- [x] Implement persistent clustering worker pipeline
- [x] Implement research synthesis worker pipeline
- [x] Scraper Worker: Finalize selectors for 5 primary sources

---

## Phase 2 — Frontend: Next.js Editorial Dashboard
**Goal: Build the internal CMS dashboard in Next.js.**

### 2.1 Project Setup
- [x] Scaffold Next.js App Router project
- [x] Setup Tailwind CSS + Design Tokens (The Economist aesthetic)
- [x] Configure Auth context + JWT handling
- [ ] Protected route middleware (refining `middleware.ts`)

### 2.3 Dashboard Features
- [x] **Step 1: News Intelligence Feed** (Cluster management)
- [ ] **Step 2: Topic Brief** (Angle generation)
- [ ] **Step 3: Research Workspace** (Sources, Timeline, Data Points)
- [ ] **Step 4: Tiptap Editor** (AI Drafting & Counterpoints)
- [ ] **Step 5: Sub-editing** (Clarity & Headline scoring)
- [ ] **Step 6: Packaging** (Social captions & Image concepts)
- [ ] **Step 7: Publishing** (Workflow checklist & review)

---

## Phase 3 — Public-Facing Website
**Goal: Build the typography-first reader experience.**

- [ ] Homepage Hero & Category feeds
- [ ] Long-form Article detail pages
- [ ] SEO: Dynamic OG tags & JSON-LD
- [ ] Integrations: Facebook Comments & Google Analytics

---

## Phase 4 — Testing & Quality Assurance
**Goal: Ensure stability and cost efficiency.**

- [ ] End-to-end editorial workflow testing
- [ ] Zod schema validation rigor testing
- [ ] Load testing the BullMQ concurrency
- [ ] Cost analysis: Token usage audit (Sonnet vs Haiku)

---

## Phase 5 — Deployment & Production
**Goal: Deploy to VPS via Docker Compose.**

### 5.1 Server Provisioning
- [ ] Provision 2vCPU/4GB VPS (DigitalOcean/Vultr)
- [ ] Install Docker + Docker Compose
- [ ] Configure UFW Firewall & Security

### 5.2 Production Launch
- [ ] Setup SSL via Let's Encrypt (Nginx reverse proxy)
- [ ] Deploy production Docker image build
- [ ] Automated PostgreSQL backups (pg_dump + cron)
- [ ] Uptime monitoring & alerting

---

*Beyond Headlines — Notionhive Bangladesh Ltd.*
