import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query

from app.auth.utils import get_current_user
from app.models.article import (
    ArticleCreate, ArticleUpdate, ArticleResponse,
    RevisionResponse, AutosaveRequest,
    CategoryResponse, TagResponse,
)
from app.data import mock_data as db

router = APIRouter(prefix="/articles", tags=["Articles"])


# ── List articles ──────────────────────────────────────────────────────────────

@router.get("", summary="List articles with optional filters")
async def list_articles(
    status: Optional[str] = Query(None, description="Filter by ArticleStatus"),
    category_id: Optional[str] = Query(None),
    author_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    _=Depends(get_current_user),
):
    items = list(db.ARTICLES)
    if status:
        items = [a for a in items if a["status"] == status.upper()]
    if category_id:
        items = [a for a in items if a.get("category_id") == category_id]
    if author_id:
        items = [a for a in items if a.get("author_id") == author_id]
    total = len(items)
    start = (page - 1) * limit
    return {"data": items[start: start + limit], "total": total, "page": page, "limit": limit}


# ── Get single article ─────────────────────────────────────────────────────────

@router.get("/{article_id}", summary="Get an article by ID or slug")
async def get_article(article_id: str, _=Depends(get_current_user)):
    article = db.get_article_by_id(article_id) or db.get_article_by_slug(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


# ── Create article ─────────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a new article")
async def create_article(body: ArticleCreate, current_user=Depends(get_current_user)):
    slug = body.slug or body.title.lower().replace(" ", "-").replace(",", "")[:80]
    article = {
        "id": f"art_{uuid.uuid4().hex[:6]}",
        **body.model_dump(),
        "slug": slug,
        "author_id": body.author_id or current_user["id"],
        "created_at": db.now_iso(),
        "updated_at": db.now_iso(),
        "published_at": None,
        "view_count": 0,
        "revision_count": 0,
    }
    db.ARTICLES.append(article)
    return article


# ── Update article ─────────────────────────────────────────────────────────────

@router.patch("/{article_id}", summary="Partially update an article")
async def update_article(article_id: str, body: ArticleUpdate, _=Depends(get_current_user)):
    article = db.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    updates = body.model_dump(exclude_none=True)
    article.update(updates)
    article["updated_at"] = db.now_iso()
    if updates.get("status") == "PUBLISHED" and not article.get("published_at"):
        article["published_at"] = db.now_iso()
    return article


# ── Delete article ─────────────────────────────────────────────────────────────

@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an article")
async def delete_article(article_id: str, _=Depends(get_current_user)):
    article = db.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    db.ARTICLES.remove(article)


# ── Revisions ──────────────────────────────────────────────────────────────────

@router.get("/{article_id}/revisions", summary="Get revision history for an article")
async def get_revisions(article_id: str, _=Depends(get_current_user)):
    article = db.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    revisions = [r for r in db.REVISIONS if r["article_id"] == article_id]
    return {"data": revisions, "total": len(revisions)}


@router.post("/{article_id}/autosave", status_code=status.HTTP_201_CREATED, summary="Autosave — creates a revision record")
async def autosave_article(article_id: str, body: AutosaveRequest, current_user=Depends(get_current_user)):
    article = db.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    revision = {
        "id": f"rev_{uuid.uuid4().hex[:6]}",
        "article_id": article_id,
        "body_snapshot": body.body,
        "title_snapshot": body.title,
        "saved_by": current_user["id"],
        "saved_at": db.now_iso(),
        "revision_type": "autosave",
    }
    db.REVISIONS.append(revision)
    article["revision_count"] = article.get("revision_count", 0) + 1
    article["updated_at"] = db.now_iso()
    return revision
