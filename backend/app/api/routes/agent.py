import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.agent_log import AgentLogCreate, AgentLogResponse
from app.crud import agent_logs as agent_log_crud
from app.database.session import get_db
from app.services.agent_service import execute_agent_action
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/agent", tags=["Agent"])


@router.post("/logs", response_model=AgentLogResponse)
def create_log(
    log: AgentLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return agent_log_crud.create_agent_log(db, log)


@router.get("/logs", response_model=list[AgentLogResponse])
def read_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return agent_log_crud.get_agent_logs(db)


@router.get("/logs/{log_id}", response_model=AgentLogResponse)
def read_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = agent_log_crud.get_agent_log(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log


@router.get("/logs/task/{task_id}", response_model=list[AgentLogResponse])
def read_task_logs(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return agent_log_crud.get_task_logs(db, task_id)


@router.post("/execute")
async def execute_agent(
    agent_name: str,
    action: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Convert dict payload to JSON string before passing to the service
    payload_str = json.dumps(payload)
    return await execute_agent_action(db, agent_name, action, payload_str)


@router.delete("/logs/{log_id}")
def remove_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = agent_log_crud.delete_agent_log(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Log deleted"}
