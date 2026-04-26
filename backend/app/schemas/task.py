from typing import Optional
from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str
    status: str = "pending"
    due_date: Optional[str] = None
    project_id: int
    source: str = "manual"
    category: str = "professional"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    category: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    status: Optional[str] = "pending"
    due_date: Optional[str] = None
    project_id: int
    user_id: int
    source: Optional[str] = "manual"
    category: Optional[str] = "professional"

    model_config = {"from_attributes": True}