# app/api/routes/agent_log.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.schemas.agent_log import AgentLogCreate, AgentLogResponse
from app.crud import agent_logs as agent_log_crud
from app.database.session import get_db

# ✅ Router MUST be defined at the top
router = APIRouter(prefix="/logs", tags=["AgentLogs"])

# Create a new log
@router.post("/", response_model=AgentLogResponse)
def create_log(log: AgentLogCreate, db: Session = Depends(get_db)):
    return agent_log_crud.create_agent_log(db, log)

# Get all logs
@router.get("/", response_model=List[AgentLogResponse])
def read_logs(db: Session = Depends(get_db)):
    return agent_log_crud.get_agent_logs(db)

# Get log by ID
@router.get("/{log_id}", response_model=AgentLogResponse)
def read_log(log_id: int, db: Session = Depends(get_db)):
    log = agent_log_crud.get_agent_log(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log

# Get logs by task ID
@router.get("/task/{task_id}", response_model=List[AgentLogResponse])
def read_task_logs(task_id: int, db: Session = Depends(get_db)):
    return agent_log_crud.get_task_logs(db, task_id)

# Delete log by ID
@router.delete("/{log_id}")
def remove_log(log_id: int, db: Session = Depends(get_db)):
    log = agent_log_crud.delete_agent_log(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Log deleted"}