from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.crud import projects as project_crud
from app.schemas.project import ProjectCreate, ProjectResponse
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

# ✅ Router MUST be defined first
router = APIRouter(prefix="/projects", tags=["Projects"])


# ✅ CREATE PROJECT (authenticated)
@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project_endpoint(
    project: ProjectCreate,
    owner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return project_crud.create_project(db, project, owner_id)


# ✅ LIST PROJECTS
@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return project_crud.get_all_projects(db)


# ✅ GET SINGLE PROJECT
@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_endpoint(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = project_crud.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ✅ DELETE PROJECT
@router.delete("/{project_id}", response_model=ProjectResponse)
def delete_project_endpoint(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = project_crud.delete_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project