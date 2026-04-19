from app.database.session import engine
from app.database.base import Base
from app.models import user, project, task, agent

print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("✅ All tables created successfully!")