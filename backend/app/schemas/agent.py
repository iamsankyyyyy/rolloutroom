from pydantic import BaseModel
from datetime import datetime

class AgentLogBase(BaseModel):
    agent_name: str
    action: str
    task_id: int

class AgentLogCreate(AgentLogBase):
    pass

class AgentLogResponse(AgentLogBase):
    id: int
    timestamp: datetime

    model_config = {
    "from_attributes": True
}