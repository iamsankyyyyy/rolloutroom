from sqlalchemy.orm import Session
from app.models.agent_log import AgentLog
from app.schemas.agent_log import AgentLogCreate

def create_agent_log(db: Session, log: AgentLogCreate):
    db_log = AgentLog(
        agent_name=log.agent_name,
        action=log.action,
        task_id=log.task_id
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_agent_logs(db: Session):
    return db.query(AgentLog).all()

def get_agent_log(db: Session, log_id: int):
    return db.query(AgentLog).filter(AgentLog.id == log_id).first()

def get_task_logs(db: Session, task_id: int):
    return db.query(AgentLog).filter(AgentLog.task_id == task_id).all()

def delete_agent_log(db: Session, log_id: int):
    log = get_agent_log(db, log_id)
    if log:
        db.delete(log)
        db.commit()
    return log