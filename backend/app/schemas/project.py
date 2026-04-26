from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class ProjectBase(BaseModel):
    name: str
    project_type: str = "song"  # "song" | "ep" | "album"
    description: Optional[str] = None
    mood: Optional[str] = None
    goal: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass  # owner_id is inferred from the JWT


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    project_type: Optional[str] = None
    description: Optional[str] = None
    mood: Optional[str] = None
    goal: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
