from fastapi import APIRouter, HTTPException, Depends
from app.auth.utils import get_current_user
from app.data import mock_data as db

router = APIRouter(prefix="/tags", tags=["Articles"])


@router.get("", summary="List all tags")
async def list_tags(_=Depends(get_current_user)):
    return {"data": db.TAGS, "total": len(db.TAGS)}


@router.get("/{tag_id}", summary="Get a tag by ID")
async def get_tag(tag_id: str, _=Depends(get_current_user)):
    tag = next((t for t in db.TAGS if t["id"] == tag_id), None)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag
