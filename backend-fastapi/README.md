# Beyond Headlines API

A complete mock REST API for **Beyond Headlines** — an AI-assisted news platform for Bangladeshi journalism — built with **FastAPI**, **Pydantic v2**, and **Uvicorn**.

---

## ✨ Features

- **7-step editorial workflow** modelled as distinct API route groups
- JWT authentication with role-based access (Admin / Editor)
- Simulated AI latency with `asyncio.sleep()` — Haiku (0.4–0.6s), Sonnet (0.8–1.2s), Research (1.5s)
- Realistic Bangladeshi news platform mock data (English + Bangla headlines)
- Pydantic v2 models with full validation
- Paginated list endpoints with `{"data": [...], "total": N}` envelope
- Full Swagger UI and ReDoc documentation

---

## 🚀 Quick Start

### 1. Clone and install dependencies

```bash
cd backend-fastapi
pip install -r requirements.txt
```

### 2. Copy environment file (optional)

```bash
cp .env.example .env
```

### 3. Run the development server

```bash
uvicorn main:app --reload --port 8000
```

---

## 📚 API Documentation

| Interface | URL |
|-----------|-----|
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| OpenAPI JSON | http://localhost:8000/openapi.json |
| Health check | http://localhost:8000/health |

---

## 🔐 Authentication

All routes (except `/health`) require a Bearer JWT token.

### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@beyondheadlines.bd", "password": "any-password"}'
```

**Any password works in mock mode.** Two built-in users:

| Role | Email |
|------|-------|
| Admin | `admin@beyondheadlines.bd` |
| Editor | `editor@beyondheadlines.bd` |

Use the returned `access_token` in the `Authorization: Bearer <token>` header for subsequent requests.

---

## 📂 Project Structure

```
beyond-headlines-api/
├── main.py                  # FastAPI app factory, router registration, CORS
├── config.py                # Pydantic settings (reads .env)
├── requirements.txt
├── .env.example
├── README.md
└── app/
    ├── auth/
    │   ├── router.py        # POST /auth/login, GET /auth/me
    │   └── utils.py         # JWT encode/decode, Depends helpers
    ├── routes/
    │   ├── articles.py      # Full CRUD + revisions + autosave
    │   ├── categories.py    # Category list/get
    │   ├── tags.py          # Tag list/get
    │   ├── clusters.py      # Step 1 — cluster detection
    │   ├── research.py      # Steps 2 & 3 — topic brief + research sessions
    │   ├── ai.py            # Steps 4–6 — outline, inline assist, sub-edit, SEO, packaging
    │   ├── publish.py       # Step 7 — queue, checklist, publish, approve, reject
    │   ├── users.py         # User CRUD
    │   ├── media.py         # Media CRUD + simulated upload
    │   ├── analytics.py     # Overview, top articles, traffic, per-article
    │   └── scrape.py        # Trigger, status, last-run
    ├── models/
    │   ├── article.py       # ArticleStatus, Tone, Article schemas
    │   ├── cluster.py       # Source, Cluster, ScrapedHeadline schemas
    │   ├── research.py      # ResearchSession, TopicBrief schemas
    │   ├── ai_responses.py  # All AI input/output schemas
    │   └── user.py          # UserRole, User schemas, LoginRequest
    └── data/
        └── mock_data.py     # All in-memory data + mock AI outputs
```

---

## 🗺️ API Route Map

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login — returns JWT |
| GET | `/api/v1/auth/me` | Current user from JWT |

### Articles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/articles` | List (filter: status, category_id, author_id) |
| GET | `/api/v1/articles/{id}` | Get by ID or slug |
| POST | `/api/v1/articles` | Create |
| PATCH | `/api/v1/articles/{id}` | Update |
| DELETE | `/api/v1/articles/{id}` | Delete (204) |
| GET | `/api/v1/articles/{id}/revisions` | Revision history |
| POST | `/api/v1/articles/{id}/autosave` | Autosave revision |

### Step 1 — Clusters
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/clusters` | List (filter: emerging=true) |
| GET | `/api/v1/clusters/{id}` | Cluster + headlines |
| GET | `/api/v1/clusters/headlines/raw` | Raw scraped headlines |

### Steps 2 & 3 — Research
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/research/topic-brief` | AI topic brief for cluster |
| POST | `/api/v1/research/generate` | Full research session |
| GET | `/api/v1/research/{article_id}` | Sessions for article |
| GET | `/api/v1/research/session/{id}` | Single session |

### Steps 4–6 — AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/outline` | Article outline |
| POST | `/api/v1/ai/inline-assist` | Paragraph improvement |
| POST | `/api/v1/ai/counterpoint` | Counterpoint generation |
| POST | `/api/v1/ai/sub-edit` | Sub-editing issues |
| POST | `/api/v1/ai/seo-metadata` | SEO metadata |
| POST | `/api/v1/ai/score-headlines` | Score up to 3 headlines |
| POST | `/api/v1/ai/packaging` | Image + pull quotes + captions |
| POST | `/api/v1/ai/image-concept` | Image concept brief |
| POST | `/api/v1/ai/social-captions` | Social captions |
| POST | `/api/v1/ai/pull-quotes` | Pull quotes |

### Step 7 — Publish
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/publish/{id}` | Direct publish (admin) |
| POST | `/api/v1/publish/{id}/submit-review` | Submit for review |
| POST | `/api/v1/publish/{id}/approve` | Approve (admin) |
| POST | `/api/v1/publish/{id}/reject` | Reject to DRAFT (admin) |
| GET | `/api/v1/publish/queue` | Pending review queue |
| GET | `/api/v1/publish/checklist/{id}` | Pre-publish checklist |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PATCH/DELETE | `/api/v1/users` | User management |
| GET/POST/PATCH/DELETE | `/api/v1/media` | Media management |
| POST | `/api/v1/media/upload` | File upload (simulated) |
| GET | `/api/v1/analytics/overview` | Platform overview |
| GET | `/api/v1/analytics/top-articles` | Top articles |
| GET | `/api/v1/analytics/traffic` | Daily traffic |
| GET | `/api/v1/analytics/article/{slug}` | Per-article analytics |
| POST | `/api/v1/scrape/trigger` | Trigger scrape job |
| GET | `/api/v1/scrape/status/{job_id}` | Job status |
| GET | `/api/v1/scrape/last-run` | Last scrape details |
| GET | `/health` | Health check |

---

## 🏗️ Design Notes

- **No database required** — all state lives in Python lists in `app/data/mock_data.py`
- **Simulated AI latency** — `asyncio.sleep()` models real inference time per model class
- **JWT auth** — `python-jose` with HS256; any password works for known emails
- **CORS** — `allow_origins=["*"]` for development convenience
- **Error format** — `{"error": "message"}` for 404s, `{"error": "...", "missing": [...]}` for failed checklists

---

## 🛠 Development Tips

```bash
# Run with auto-reload on file changes
uvicorn main:app --reload --port 8000

# Run with verbose logging
uvicorn main:app --reload --port 8000 --log-level debug

# Generate a production SECRET_KEY
python -c "import secrets; print(secrets.token_hex(64))"
```

---

*Beyond Headlines — AI-assisted journalism for Bangladesh.* ✈
