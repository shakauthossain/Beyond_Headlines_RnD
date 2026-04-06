from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from app.auth.utils import get_current_user
from app.data import mock_data as db

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", summary="Platform-wide analytics overview")
async def analytics_overview(_=Depends(get_current_user)):
    return db.ANALYTICS_OVERVIEW


@router.get("/top-articles", summary="Top articles by view count")
async def top_articles(limit: int = 10, _=Depends(get_current_user)):
    items = sorted(db.ANALYTICS_TOP_ARTICLES, key=lambda a: a["views"], reverse=True)
    return {"data": items[:limit], "total": len(items)}


@router.get("/traffic", summary="Daily traffic data for the last 7 days")
async def traffic(_=Depends(get_current_user)):
    return {"data": db.ANALYTICS_TRAFFIC, "total": len(db.ANALYTICS_TRAFFIC)}


@router.get("/article/{slug}", summary="Per-article analytics by slug")
async def article_analytics(slug: str, _=Depends(get_current_user)):
    article = db.get_article_by_slug(slug)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    analytics_entry = next(
        (a for a in db.ANALYTICS_TOP_ARTICLES if a["slug"] == slug), None
    )
    if not analytics_entry:
        # Return a minimal analytics stub for articles not in the top list
        return {
            "article_id": article["id"],
            "slug": slug,
            "views": article.get("view_count", 0),
            "avg_read_time_seconds": 0,
            "share_count": 0,
            "category": article.get("category_id"),
        }
    return analytics_entry
