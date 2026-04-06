from fastapi import APIRouter, Depends
from app.auth.utils import get_current_user
from app.data import mock_data as db

router = APIRouter(prefix="/categories", tags=["Articles"])


@router.get("", summary="List all categories")
async def list_categories(_=Depends(get_current_user)):
    return {"data": db.CATEGORIES, "total": len(db.CATEGORIES)}


@router.get("/{category_id}", summary="Get a category by ID")
async def get_category(category_id: str, _=Depends(get_current_user)):
    cat = next((c for c in db.CATEGORIES if c["id"] == category_id), None)
    if not cat:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Category not found")
    return cat
