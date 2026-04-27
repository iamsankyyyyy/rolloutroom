from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)

    artist_name = Column(String, nullable=True)
    tone_preference = Column(String, nullable=True, default="balanced", server_default="balanced")
    genre = Column(String, nullable=True)
    primary_platform = Column(String, nullable=True)
    bio = Column(String, nullable=True)

    tasks = relationship("Task", back_populates="owner")
    projects = relationship("Project", back_populates="owner")