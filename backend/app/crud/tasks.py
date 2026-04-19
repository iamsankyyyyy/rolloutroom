from sqlalchemy.orm import Session
from app.models.task import Task
from app.schemas.task import TaskCreate

# Create a new task
def create_task(db: Session, task: TaskCreate, user_id: int):
    db_task = Task(**task.dict(), user_id=user_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

# Get all tasks
def get_all_tasks(db: Session):
    return db.query(Task).all()

# Get all tasks for a specific user
def get_user_tasks(db: Session, user_id: int):
    return db.query(Task).filter(Task.user_id == user_id).all()

# Get a specific task by id
def get_task_by_id(db: Session, task_id: int):
    return db.query(Task).filter(Task.id == task_id).first()

# Get a specific task for a specific user
def get_user_task(db: Session, task_id: int, user_id: int):
    return db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()

# Update a task
def update_task(db: Session, task: Task, task_data: TaskCreate):
    for key, value in task_data.dict().items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task

# Delete a task
def delete_task(db: Session, task_id: int):
    task = get_task_by_id(db, task_id)
    if task:
        db.delete(task)
        db.commit()
    return task

# Get all tasks for a specific project
def get_project_tasks(db: Session, project_id: int):
    return db.query(Task).filter(Task.project_id == project_id).all()