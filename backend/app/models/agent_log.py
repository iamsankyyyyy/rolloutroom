from datetime import datetime

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship

from app.database.session import Base
from app.models.task import Task


class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    agent_name = Column(String, nullable=False)
    action = Column(String, nullable=False)

    input_payload = Column(Text, nullable=False)
    output_result = Column(Text, nullable=False)

    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Link to a task (optional)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)

    task = relationship("Task", backref="logs")