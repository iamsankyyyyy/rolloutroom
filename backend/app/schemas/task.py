from pydantic import BaseModel

class TaskBase(BaseModel):
    title: str
    description: str | None = None
    is_completed: bool | None = False

class TaskCreate(TaskBase):
    title: str
    description: str | None = None
    project_id: int

class TaskResponse(TaskBase):
    id: int
    title: str
    description: str | None
    project_id: int
    user_id: int

    model_config = {
    "from_attributes": True
}