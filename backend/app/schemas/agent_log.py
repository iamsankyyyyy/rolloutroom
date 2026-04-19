from datetime import datetime
from pydantic import BaseModel


class AgentLogBase(BaseModel):
    agent_name: str
    action: str
    input_payload: str
    output_result: str
    task_id: int | None = None  # optional


class AgentLogCreate(AgentLogBase):
    pass


class AgentLogResponse(AgentLogBase):
    id: int
    timestamp: datetime

    class Config:
        orm_mode = True