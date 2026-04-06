from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from app.auth.utils import get_current_user, require_admin
from app.data import mock_data as db

router = APIRouter(prefix="/publish", tags=["Publish — Step 7"])


class RejectRequest(BaseModel):
    notes: str


def _checklist(article: dict) -> list[str]:
    missing = []
    if not article.get("title"):
        missing.append("title")
    if not article.get("body"):
        missing.append("body")
    if not article.get("excerpt"):
        missing.append("excerpt")
    if not article.get("category_id"):
        missing.append("category_id")
    if not article.get("seo_title"):
        missing.append("seo_title")
    if not article.get("seo_description"):
        missing.append("seo_description")
    if not article.get("cover_image"):
        missing.append("cover_image")
    return missing


@router.get("/queue", summary="Get the pending review queue (Step 7)")
async def review_queue(_=Depends(require_admin)):
    queue = [a for a in db.ARTICLES if a["status"] == "PENDING_REVIEW"]
    return {"data": queue, "total": len(queue)}


@router.get("/checklist/{article_id}", summary="Pre-publish checklist for an article (Step 7)")
async def get_checklist(article_id: str, _=Depends(get_current_user)):
    article = db.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    missing = _checklist(article)
    passed = len(missing) == 0
    return {
        "article_id": article_id,
        "passed": passed,
        "missing": missing,
        "checks_passed": 7 - len(missing),
        "checks_total": 7,
    }


@router.post("/{article_id}", summary="Directly publish an article (admin only, Step 7)")
async def publish_article(article_id: str, admin=Depends(require_admin)):
    article = db.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    missing = _checklist(article)
    if missing:
        raise HTTPException(
            status_code=422,
            detail={"error": "Pre-publish checklist failed", "missing": missing},
        )
    article["status"] = "PUBLISHED"
    article["published_at"] = db.now_iso()
    article["updated_at"] = db.now_iso()
    # Remove from queue if present
    db.PUBLISH_QUEUE[:] = [q for q in db.PUBLISH_QUEUE if q.get("article_id") != article_id]
    return article


@router.post("/{article_id}/submit-review", summary="Submit an article for editorial review (Step 7)")
async def submit_for_review(article_id: str, current_user=Depends(get_current_user)):
    article = db.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    article["status"] = "PENDING_REVIEW"
    article["updated_at"] = db.now_iso()
    queue_entry = {
        "article_id": article_id,
        "submitted_by": current_user["id"],
        "submitted_at": db.now_iso(),
    }
    # Avoid duplicate queue entries
    existing = next((q for q in db.PUBLISH_QUEUE if q["article_id"] == article_id), None)
    if not existing:
        db.PUBLISH_QUEUE.append(queue_entry)
    return {"message": "Article submitted for review", "article": article}


@router.post("/{article_id}/approve", summary="Approve and publish a reviewed article (admin only, Step 7)")
async def approve_article(article_id: str, admin=Depends(require_admin)):
    article = db.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if article["status"] != "PENDING_REVIEW":
        raise HTTPException(status_code=422, detail="Article is not in PENDING_REVIEW status")
    missing = _checklist(article)
    if missing:
        raise HTTPException(
            status_code=422,
            detail={"error": "Pre-publish checklist failed", "missing": missing},
        )
    article["status"] = "PUBLISHED"
    article["published_at"] = db.now_iso()
    article["updated_at"] = db.now_iso()
    db.PUBLISH_QUEUE[:] = [q for q in db.PUBLISH_QUEUE if q.get("article_id") != article_id]
    return {"message": "Article approved and published", "article": article}


@router.post("/{article_id}/reject", summary="Reject a reviewed article back to DRAFT (admin only, Step 7)")
async def reject_article(article_id: str, body: RejectRequest, admin=Depends(require_admin)):
    article = db.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    article["status"] = "DRAFT"
    article["updated_at"] = db.now_iso()
    article["rejection_notes"] = body.notes
    db.PUBLISH_QUEUE[:] = [q for q in db.PUBLISH_QUEUE if q.get("article_id") != article_id]
    return {"message": "Article rejected and returned to DRAFT", "notes": body.notes, "article": article}
