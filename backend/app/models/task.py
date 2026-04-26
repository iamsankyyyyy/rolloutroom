from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database.session import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)
    status = Column(String, nullable=False, default="pending", server_default="pending")
    due_date = Column(String, nullable=True)
    source = Column(String, nullable=True, default="manual", server_default="manual")
    category = Column(String, nullable=True, default="professional", server_default="professional")

    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    project = relationship("Project", back_populates="tasks")
    owner = relationship("User", back_populates="tasks")