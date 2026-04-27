from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str


class UserUpdate(BaseModel):
    artist_name: Optional[str] = None
    tone_preference: Optional[str] = None
    genre: Optional[str] = None
    primary_platform: Optional[str] = None
    bio: Optional[str] = None


class UserRead(BaseModel):
    id: int
    email: EmailStr
    username: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    is_active: bool
    is_superuser: bool
    artist_name: Optional[str] = None
    tone_preference: Optional[str] = None
    genre: Optional[str] = None
    primary_platform: Optional[str] = None
    bio: Optional[str] = None

    model_config = {"from_attributes": True}