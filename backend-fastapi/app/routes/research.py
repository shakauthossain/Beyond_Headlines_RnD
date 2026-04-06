import asyncio
import uuid
from copy import deepcopy
from fastapi import APIRouter, HTTPException, Depends

from app.auth.utils import get_current_user
from app.models.research import TopicBriefRequest, ResearchGenerateRequest
from app.data import mock_data as db

router = APIRouter(prefix="/research", tags=["Research — Steps 2 & 3"])


@router.post("/topic-brief", summary="Generate an AI topic brief for a cluster (Step 2)")
async def generate_topic_brief(body: TopicBriefRequest, _=Depends(get_current_user)):
    """Sonnet-class task — simulates ~1s latency."""
    cluster = db.get_cluster_by_id(body.cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    await asyncio.sleep(1.0)
    brief = deepcopy(db.MOCK_TOPIC_BRIEF)
    brief["cluster_id"] = body.cluster_id
    brief["topic"] = cluster["topic"]
    brief["generated_at"] = db.now_iso()
    return brief


@router.post("/generate", summary="Generate a full research session for an article (Step 3)")
async def generate_research(body: ResearchGenerateRequest, current_user=Depends(get_current_user)):
    """Perplexity + synthesis — simulates 1.5s latency."""
    article = db.get_article_by_id(body.article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    await asyncio.sleep(1.5)

    # Check if a session already exists; if so, return a new one stamped now
    session = deepcopy(db.RESEARCH_SESSIONS[0])
    session["id"] = f"res_{uuid.uuid4().hex[:6]}"
    session["article_id"] = body.article_id
    session["angle"] = body.angle
    session["generated_at"] = db.now_iso()
    session["created_at"] = db.now_iso()
    db.RESEARCH_SESSIONS.append(session)
    return session


@router.get("/{article_id}", summary="Get all research sessions for an article")
async def get_research_for_article(article_id: str, _=Depends(get_current_user)):
    article = db.get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    sessions = db.get_research_by_article_id(article_id)
    return {"data": sessions, "total": len(sessions)}


@router.get("/session/{session_id}", summary="Get a single research session by ID")
async def get_research_session(session_id: str, _=Depends(get_current_user)):
    session = db.get_research_by_session_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Research session not found")
    return session
