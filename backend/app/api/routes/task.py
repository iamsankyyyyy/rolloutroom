from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.crud import tasks as task_crud
from app.schemas.task import TaskCreate, TaskResponse
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

# ✅ Router MUST come first
router = APIRouter(prefix="/tasks", tags=["Tasks"])


# ✅ CREATE TASK
@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task_endpoint(
    task: TaskCreate,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return task_crud.create_task(db, task, user_id)


# ✅ LIST TASKS
@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return task_crud.get_all_tasks(db)


# ✅ GET TASK
@router.get("/{task_id}", response_model=TaskResponse)
def get_task_endpoint(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_crud.get_task_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# ✅ DELETE TASK
@router.delete("/{task_id}", response_model=TaskResponse)
def delete_task_endpoint(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_crud.delete_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task