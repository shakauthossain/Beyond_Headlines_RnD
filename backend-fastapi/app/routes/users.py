import uuid
from fastapi import APIRouter, HTTPException, Depends, status
from app.auth.utils import get_current_user, require_admin
from app.models.user import UserCreate, UserUpdate
from app.data import mock_data as db

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", summary="List all users (admin only)")
async def list_users(_=Depends(require_admin)):
    return {"data": db.USERS, "total": len(db.USERS)}


@router.get("/{user_id}", summary="Get a user by ID")
async def get_user(user_id: str, _=Depends(get_current_user)):
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a new user (admin only)")
async def create_user(body: UserCreate, _=Depends(require_admin)):
    if db.get_user_by_email(body.email):
        raise HTTPException(status_code=409, detail="Email already in use")
    user = {
        "id": f"usr_{uuid.uuid4().hex[:6]}",
        **body.model_dump(exclude={"password"}),
        "created_at": db.now_iso(),
        "updated_at": db.now_iso(),
    }
    db.USERS.append(user)
    return user


@router.patch("/{user_id}", summary="Update a user")
async def update_user(user_id: str, body: UserUpdate, current_user=Depends(get_current_user)):
    if current_user["role"] != "ADMIN" and current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="You can only edit your own profile")
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    updates = body.model_dump(exclude_none=True, exclude={"password"})
    user.update(updates)
    user["updated_at"] = db.now_iso()
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a user (admin only)")
async def delete_user(user_id: str, current_user=Depends(require_admin)):
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    db.USERS.remove(user)
