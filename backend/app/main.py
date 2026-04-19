from fastapi import FastAPI

from app.database.session import Base, engine
from app.models import *  # noqa
from app.models import user, project, task  # ensure models are registered

from app.api.routes.user import router as user_router
from app.api.routes.project import router as project_router
from app.api.routes.task import router as task_router
from app.api.routes.agent import router as agent_router
from app.api.routes.agent_log import router as agent_log_router
from app.api.routes.auth import router as auth_router
from app.api.routes.conversation import router as conversation_router


app = FastAPI(
    title="AI Multi-Agent Assistant Backend",
    version="1.0.0",
)

# Create tables at startup
Base.metadata.create_all(bind=engine)


app.include_router(auth_router)
app.include_router(user_router)
app.include_router(project_router)
app.include_router(task_router)
app.include_router(agent_router)
app.include_router(agent_log_router)
app.include_router(conversation_router)


@app.get("/")
def root():
    return {"message": "Backend is running successfully"}