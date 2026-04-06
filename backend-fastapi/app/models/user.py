from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    EDITOR = "EDITOR"


class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.EDITOR
    avatar: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: str
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
