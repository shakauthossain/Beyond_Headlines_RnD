import asyncio
import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.auth.utils import get_current_user, require_admin
from app.data import mock_data as db

router = APIRouter(prefix="/scrape", tags=["Scrape"])


class ScrapeRequest(BaseModel):
    sources: list[str] = ["PROTHOM_ALO", "DAILY_STAR", "BDNEWS24", "JUGANTOR", "DHAKA_TRIBUNE"]


@router.post("/trigger", summary="Trigger a new scrape job (admin only)")
async def trigger_scrape(body: ScrapeRequest, _=Depends(require_admin)):
    """Simulates a scrape trigger — returns a job ID immediately. Scraping is async."""
    job_id = f"job_{uuid.uuid4().hex[:6]}"
    job = {
        "job_id": job_id,
        "status": "running",
        "sources_scraped": body.sources,
        "headlines_found": 0,
        "clusters_updated": 0,
        "new_clusters": 0,
        "started_at": db.now_iso(),
        "completed_at": None,
        "error": None,
    }
    db.SCRAPE_JOBS.append(job)

    # Simulate async completion after a short delay (background coroutine)
    async def _complete():
        await asyncio.sleep(3)
        job["status"] = "completed"
        job["headlines_found"] = len(db.SCRAPED_HEADLINES)
        job["clusters_updated"] = len(db.CLUSTERS)
        job["new_clusters"] = 0
        job["completed_at"] = db.now_iso()

    asyncio.create_task(_complete())

    return {"job_id": job_id, "status": "running", "message": "Scrape job triggered successfully"}


@router.get("/status/{job_id}", summary="Get scrape job status by ID")
async def scrape_status(job_id: str, _=Depends(get_current_user)):
    job = next((j for j in db.SCRAPE_JOBS if j["job_id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Scrape job not found")
    return job


@router.get("/last-run", summary="Get details of the last completed scrape run")
async def last_scrape_run(_=Depends(get_current_user)):
    return db.LAST_SCRAPE_RUN
