from sqlalchemy.orm import Session
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


def create_project(db: Session, project: ProjectCreate, owner_id: int):
    data = project.model_dump()
    data["owner_id"] = owner_id
    db_project = Project(**data)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


def get_all_projects(db: Session):
    return db.query(Project).all()


def get_user_projects(db: Session, owner_id: int):
    return db.query(Project).filter(Project.owner_id == owner_id).all()


def get_project_by_id(db: Session, project_id: int):
    return db.query(Project).filter(Project.id == project_id).first()


def get_user_project(db: Session, project_id: int, owner_id: int):
    return db.query(Project).filter(
        Project.id == project_id, Project.owner_id == owner_id
    ).first()


def update_project(db: Session, project: Project, project_data: ProjectUpdate):
    for key, value in project_data.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int):
    project = get_project_by_id(db, project_id)
    if project:
        db.delete(project)
        db.commit()
    return project
