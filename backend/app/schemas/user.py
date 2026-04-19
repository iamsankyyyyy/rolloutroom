from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_superuser: bool

    model_config = {
    "from_attributes": True
}