from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


def create_task(db: Session, task: TaskCreate, user_id: int) -> Task:
    db_task = Task(
        title=task.title,
        status=task.status,
        due_date=task.due_date,
        project_id=task.project_id,
        user_id=user_id,
        source=task.source,
        category=task.category,
        source_agent=task.source_agent,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def get_all_tasks(db: Session):
    return db.query(Task).all()


def get_user_tasks(db: Session, user_id: int):
    return db.query(Task).filter(Task.user_id == user_id).all()


def get_user_tasks_filtered(
    db: Session,
    user_id: int,
    project_id: Optional[int] = None,
    status: Optional[str] = None,
) -> List[Task]:
    query = db.query(Task).filter(Task.user_id == user_id)
    if project_id is not None:
        query = query.filter(Task.project_id == project_id)
    if status is not None:
        query = query.filter(Task.status == status)
    return query.order_by(Task.project_id.asc(), Task.id.asc()).all()


def get_task_by_id(db: Session, task_id: int):
    return db.query(Task).filter(Task.id == task_id).first()


def get_user_task(db: Session, task_id: int, user_id: int):
    return db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()


def update_task_partial(db: Session, task: Task, data: TaskUpdate) -> Task:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int):
    task = get_task_by_id(db, task_id)
    if task:
        db.delete(task)
        db.commit()
    return task


def get_project_tasks(db: Session, project_id: int):
    return db.query(Task).filter(Task.project_id == project_id).order_by(Task.id.asc()).all()