from pydantic import BaseModel

class ProjectBase(BaseModel):
    name: str
    description: str | None = None

class ProjectCreate(ProjectBase):
    owner_id: int  # The user who owns this project

class ProjectResponse(ProjectBase):
    id: int
    owner_id: int

    model_config = {
    "from_attributes": True
}