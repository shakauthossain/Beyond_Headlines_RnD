import asyncio
from copy import deepcopy
from fastapi import APIRouter, HTTPException, Depends

from app.auth.utils import get_current_user
from app.models.ai_responses import (
    OutlineRequest, InlineAssistRequest, CounterpointRequest,
    SubEditRequest, SEOMetadataRequest, HeadlineScoringRequest,
    PackagingRequest, ImageConceptRequest, SocialCaptionsRequest, PullQuotesRequest,
)
from app.data import mock_data as db

router_drafting = APIRouter(prefix="/ai", tags=["AI — Step 4 Drafting"])
router_subedit = APIRouter(prefix="/ai", tags=["AI — Step 5 Sub-editing"])
router_packaging = APIRouter(prefix="/ai", tags=["AI — Step 6 Packaging"])


# ── Step 4: Drafting ──────────────────────────────────────────────────────────

@router_drafting.post("/outline", summary="Generate a structured article outline (Step 4)")
async def generate_outline(body: OutlineRequest, _=Depends(get_current_user)):
    """Sonnet-class task — ~1s latency."""
    article = db.get_article_by_id(body.article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    await asyncio.sleep(1.0)
    outline = deepcopy(db.MOCK_OUTLINE)
    outline["article_id"] = body.article_id
    outline["angle"] = body.angle
    outline["tone"] = body.tone
    outline["generated_at"] = db.now_iso()
    return outline


@router_drafting.post("/inline-assist", summary="AI inline paragraph improvement (Step 4)")
async def inline_assist(body: InlineAssistRequest, _=Depends(get_current_user)):
    """Sonnet-class task — ~1s latency."""
    article = db.get_article_by_id(body.article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    await asyncio.sleep(1.0)
    result = deepcopy(db.MOCK_INLINE_ASSIST)
    result["article_id"] = body.article_id
    result["original_paragraph"] = body.paragraph
    result["tone_applied"] = body.tone or "ANALYTICAL"
    result["generated_at"] = db.now_iso()
    return result


@router_drafting.post("/counterpoint", summary="Generate a counterpoint to a claim (Step 4)")
async def counterpoint(body: CounterpointRequest, _=Depends(get_current_user)):
    """Sonnet-class task — ~1.2s latency."""
    article = db.get_article_by_id(body.article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    await asyncio.sleep(1.2)
    result = deepcopy(db.MOCK_COUNTERPOINT)
    result["article_id"] = body.article_id
    result["original_claim"] = body.paragraph
    result["generated_at"] = db.now_iso()
    return result


# ── Step 5: Sub-editing ───────────────────────────────────────────────────────

@router_subedit.post("/sub-edit", summary="Run AI sub-editor on the article (Step 5)")
async def sub_edit(body: SubEditRequest, _=Depends(get_current_user)):
    """Sonnet-class task — ~1.1s latency."""
    article = db.get_article_by_id(body.article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    await asyncio.sleep(1.1)
    issues = deepcopy(db.MOCK_SUB_EDIT_ISSUES)
    return {
        "article_id": body.article_id,
        "issues_found": len(issues),
        "issues": issues,
        "overall_score": 74.5,
        "summary": (
            "The article is factually strong and well-sourced but has a structural issue "
            "(IMF angle arrives too late) and one factual inaccuracy (Article IV vs Programme Review). "
            "Addressing the two high-severity issues should bring the score above 85."
        ),
        "generated_at": db.now_iso(),
    }


@router_subedit.post("/seo-metadata", summary="Generate SEO metadata for the article (Step 5)")
async def seo_metadata(body: SEOMetadataRequest, _=Depends(get_current_user)):
    """Haiku-class task — ~0.5s latency."""
    article = db.get_article_by_id(body.article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    await asyncio.sleep(0.5)
    result = deepcopy(db.MOCK_SEO_METADATA)
    result["article_id"] = body.article_id
    result["generated_at"] = db.now_iso()
    return result


@router_subedit.post("/score-headlines", summary="Score up to 3 candidate headlines (Step 5)")
async def score_headlines(body: HeadlineScoringRequest, _=Depends(get_current_user)):
    """Haiku-class task — ~0.5s latency."""
    if len(body.headlines) > 3:
        raise HTTPException(status_code=422, detail="Maximum 3 headlines allowed per request")
    await asyncio.sleep(0.5)
    scored = []
    for i, headline in enumerate(body.headlines):
        base = deepcopy(db.MOCK_HEADLINE_SCORES[i % len(db.MOCK_HEADLINE_SCORES)])
        base["headline"] = headline
        scored.append(base)
    best = max(scored, key=lambda h: h["score"])
    return {
        "scored_headlines": scored,
        "recommended": best["headline"],
        "generated_at": db.now_iso(),
    }


# ── Step 6: Packaging ─────────────────────────────────────────────────────────

@router_packaging.post("/packaging", summary="Generate full packaging bundle (Step 6)")
async def packaging(body: PackagingRequest, _=Depends(get_current_user)):
    """Sonnet-class task — ~1.2s latency — returns image concept + pull quotes + captions."""
    article = db.get_article_by_id(body.article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    await asyncio.sleep(1.2)
    result = deepcopy(db.MOCK_PACKAGING)
    result["article_id"] = body.article_id
    result["generated_at"] = db.now_iso()
    return result


@router_packaging.post("/image-concept", summary="Generate an image concept brief (Step 6)")
async def image_concept(body: ImageConceptRequest, _=Depends(get_current_user)):
    """Haiku-class task — ~0.5s latency."""
    article = db.get_article_by_id(body.article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    await asyncio.sleep(0.5)
    return {
        "article_id": body.article_id,
        "image_concept": db.MOCK_PACKAGING["image_concept"],
        "generated_at": db.now_iso(),
    }


@router_packaging.post("/social-captions", summary="Generate social media captions (Step 6)")
async def social_captions(body: SocialCaptionsRequest, _=Depends(get_current_user)):
    """Haiku-class task — ~0.4s latency."""
    article = db.get_article_by_id(body.article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    await asyncio.sleep(0.4)
    return {
        "article_id": body.article_id,
        "social_captions": db.MOCK_PACKAGING["social_captions"],
        "generated_at": db.now_iso(),
    }


@router_packaging.post("/pull-quotes", summary="Extract pull quotes from the article (Step 6)")
async def pull_quotes(body: PullQuotesRequest, _=Depends(get_current_user)):
    """Haiku-class task — ~0.5s latency."""
    article = db.get_article_by_id(body.article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    await asyncio.sleep(0.5)
    return {
        "article_id": body.article_id,
        "pull_quotes": db.MOCK_PACKAGING["pull_quotes"],
        "generated_at": db.now_iso(),
    }
