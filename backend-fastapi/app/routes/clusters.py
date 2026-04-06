from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.auth.utils import get_current_user
from app.data import mock_data as db

router = APIRouter(prefix="/clusters", tags=["Clusters — Step 1"])


@router.get("", summary="List topic clusters, optionally filter emerging ones")
async def list_clusters(
    emerging: Optional[bool] = Query(None, description="Filter clusters marked as emerging"),
    _=Depends(get_current_user),
):
    items = list(db.CLUSTERS)
    if emerging is not None:
        items = [c for c in items if c["is_emerging"] == emerging]
    return {"data": items, "total": len(items)}


@router.get("/headlines/raw", summary="Raw scraped headlines — filter by source")
async def raw_headlines(
    source: Optional[str] = Query(None, description="Filter by Source enum value"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _=Depends(get_current_user),
):
    items = list(db.SCRAPED_HEADLINES)
    if source:
        items = [h for h in items if h["source"] == source.upper()]
    total = len(items)
    start = (page - 1) * limit
    return {"data": items[start: start + limit], "total": total}


@router.get("/{cluster_id}", summary="Get a cluster with its associated headlines")
async def get_cluster(cluster_id: str, _=Depends(get_current_user)):
    cluster = db.get_cluster_by_id(cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    headlines = [h for h in db.SCRAPED_HEADLINES if h.get("cluster_id") == cluster_id]
    return {**cluster, "headlines": headlines}
