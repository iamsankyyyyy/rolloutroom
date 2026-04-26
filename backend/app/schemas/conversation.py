from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List


class ConversationBase(BaseModel):
    agent_name: str  # "manager" | "creative_director" | "publicist" | "team"
    display_name: Optional[str] = None


class ConversationCreate(ConversationBase):
    project_id: Optional[int] = None


class ConversationResponse(ConversationBase):
    id: int
    user_id: int
    project_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationWithMessages(ConversationResponse):
    messages: List[MessageResponse] = []
