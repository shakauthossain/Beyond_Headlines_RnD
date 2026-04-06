from fastapi import APIRouter, HTTPException, status, Depends

from app.models.user import LoginRequest, TokenResponse, UserResponse
from app.data.mock_data import get_user_by_email
from app.auth.utils import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and receive a JWT token",
)
async def login(body: LoginRequest):
    """
    Accepts any password for any known email (mock behaviour).
    Returns a signed JWT and the user object.
    """
    user = get_user_by_email(body.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with that email address",
        )
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the currently authenticated user",
)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the user extracted from the Bearer JWT."""
    return current_user
