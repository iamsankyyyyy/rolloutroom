from sqlalchemy.orm import Session

from app.models.agent_log import AgentLog
from app.schemas.agent_log import AgentLogCreate


def create_agent_log(db: Session, log_in: AgentLogCreate):
    db_log = AgentLog(
        agent_name=log_in.agent_name,
        action=log_in.action,
        input_payload=log_in.input_payload,
        output_result=log_in.output_result,
        task_id=log_in.task_id,  # can be None
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log