import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from pydantic import BaseModel
from app.auth.utils import get_current_user
from app.data import mock_data as db

router = APIRouter(prefix="/media", tags=["Media"])


class MediaUpdate(BaseModel):
    alt_text: Optional[str] = None
    article_id: Optional[str] = None


@router.get("", summary="List all media assets")
async def list_media(
    article_id: Optional[str] = None,
    _=Depends(get_current_user),
):
    items = list(db.MEDIA)
    if article_id:
        items = [m for m in items if m.get("article_id") == article_id]
    return {"data": items, "total": len(items)}


@router.get("/{media_id}", summary="Get a media asset by ID")
async def get_media(media_id: str, _=Depends(get_current_user)):
    media = next((m for m in db.MEDIA if m["id"] == media_id), None)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return media


@router.post("/upload", status_code=status.HTTP_201_CREATED, summary="Upload a media file (simulated)")
async def upload_media(
    file: UploadFile = File(...),
    article_id: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(None),
    current_user=Depends(get_current_user),
):
    """Simulated upload — reads file metadata but does not persist the file to disk."""
    content = await file.read()
    media = {
        "id": f"med_{uuid.uuid4().hex[:6]}",
        "filename": file.filename,
        "url": f"https://cdn.beyondheadlines.bd/media/{uuid.uuid4().hex}.{file.filename.split('.')[-1]}",
        "mime_type": file.content_type or "application/octet-stream",
        "size_bytes": len(content),
        "alt_text": alt_text or file.filename,
        "uploaded_by": current_user["id"],
        "uploaded_at": db.now_iso(),
        "article_id": article_id,
    }
    db.MEDIA.append(media)
    return media


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a media record with a URL")
async def create_media(body: dict, current_user=Depends(get_current_user)):
    media = {
        "id": f"med_{uuid.uuid4().hex[:6]}",
        **body,
        "uploaded_by": current_user["id"],
        "uploaded_at": db.now_iso(),
    }
    db.MEDIA.append(media)
    return media


@router.patch("/{media_id}", summary="Update media alt text or article association")
async def update_media(media_id: str, body: MediaUpdate, _=Depends(get_current_user)):
    media = next((m for m in db.MEDIA if m["id"] == media_id), None)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    updates = body.model_dump(exclude_none=True)
    media.update(updates)
    return media


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a media asset")
async def delete_media(media_id: str, _=Depends(get_current_user)):
    media = next((m for m in db.MEDIA if m["id"] == media_id), None)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    db.MEDIA.remove(media)
