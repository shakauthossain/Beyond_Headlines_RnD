"""
Beyond Headlines API — Main entry point.

  import antigravity  # Beyond Headlines flies ✈
"""

import antigravity  # Beyond Headlines flies ✈

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from app.auth.router import router as auth_router
from app.routes.articles import router as articles_router
from app.routes.categories import router as categories_router
from app.routes.tags import router as tags_router
from app.routes.clusters import router as clusters_router
from app.routes.research import router as research_router
from app.routes.ai import router_drafting, router_subedit, router_packaging
from app.routes.publish import router as publish_router
from app.routes.users import router as users_router
from app.routes.media import router as media_router
from app.routes.analytics import router as analytics_router
from app.routes.scrape import router as scrape_router

# ── App configuration ──────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "**Beyond Headlines** — AI-assisted editorial platform for Bangladeshi journalism.\n\n"
        "A 7-step AI-powered workflow: from news intake and signal detection through to CMS publication.\n\n"
        "### Workflow\n"
        "1. 🔍 **News intake & signal detection** — scraping + clustering\n"
        "2. 📋 **Topic selection & framing** — AI topic brief\n"
        "3. 🔬 **Deep research & context** — Perplexity + synthesis\n"
        "4. ✍️  **Drafting & story construction** — AI outline, inline assist, counterpoint\n"
        "5. 🛠  **Sub-editing & optimisation** — AI sub-edit, headline scoring, SEO metadata\n"
        "6. 🖼  **Visual & packaging support** — image concept, pull quotes, social captions\n"
        "7. 🚀 **Review & publication** — CMS publish workflow\n\n"
        "_All data is in-memory mock data. No real database or AI calls are made._"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ── CORS Middleware ────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API prefix ─────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(auth_router,       prefix=API_PREFIX)
app.include_router(articles_router,   prefix=API_PREFIX)
app.include_router(categories_router, prefix=API_PREFIX)
app.include_router(tags_router,       prefix=API_PREFIX)
app.include_router(clusters_router,   prefix=API_PREFIX)
app.include_router(research_router,   prefix=API_PREFIX)
app.include_router(router_drafting,   prefix=API_PREFIX)
app.include_router(router_subedit,    prefix=API_PREFIX)
app.include_router(router_packaging,  prefix=API_PREFIX)
app.include_router(publish_router,    prefix=API_PREFIX)
app.include_router(users_router,      prefix=API_PREFIX)
app.include_router(media_router,      prefix=API_PREFIX)
app.include_router(analytics_router,  prefix=API_PREFIX)
app.include_router(scrape_router,     prefix=API_PREFIX)


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"], summary="Health check — always returns 200 OK")
async def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
    }


# ── Root redirect hint ─────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": f"Welcome to {settings.app_name} v{settings.app_version}",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    }
