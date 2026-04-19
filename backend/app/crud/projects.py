from sqlalchemy.orm import Session
from app.models.project import Project
from app.schemas.project import ProjectCreate

# Create a new project
def create_project(db: Session, project: ProjectCreate, owner_id: int):
    data = project.dict()
    data["owner_id"] = owner_id
    db_project = Project(**data)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

# Get all projects
def get_all_projects(db: Session):
    return db.query(Project).all()

# Get all projects for a specific user
def get_user_projects(db: Session, owner_id: int):
    return db.query(Project).filter(Project.owner_id == owner_id).all()

# Get single project by ID
def get_project_by_id(db: Session, project_id: int):
    return db.query(Project).filter(Project.id == project_id).first()

# Get single project by ID for a specific user
def get_user_project(db: Session, project_id: int, owner_id: int):
    return db.query(Project).filter(Project.id == project_id, Project.owner_id == owner_id).first()

# Update project
def update_project(db: Session, project: Project, project_data: ProjectCreate):
    for key, value in project_data.dict().items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project

# Delete project
def delete_project(db: Session, project_id: int):
    project = get_project_by_id(db, project_id)
    if project:
        db.delete(project)
        db.commit()
    return project