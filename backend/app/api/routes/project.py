from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.crud import projects as project_crud
from app.crud import tasks as task_crud
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.services.agents import run_single_agent, run_team_chat

router = APIRouter(prefix="/projects", tags=["Projects"])

_VALID_CHANNELS = {"group", "manager", "creative_director", "publicist"}


class PlanResponse(BaseModel):
    conversation_id: int
    plan: str


class ChatMessageOut(BaseModel):
    id: int
    sender: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatHistoryResponse(BaseModel):
    conversation_id: int
    messages: List[ChatMessageOut]


class ChatRequest(BaseModel):
    message: str
    channel: str = "manager"


class ChatReplyResponse(BaseModel):
    messages: List[ChatMessageOut]


class TaskBody(BaseModel):
    title: str
    status: str = "pending"
    due_date: Optional[str] = None
    source: str = "manual"
    category: str = "professional"
    source_agent: Optional[str] = None


class TaskUpdateBody(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    category: Optional[str] = None
    source_agent: Optional[str] = None


def _get_or_create_conversation(
    db: Session, project_id: int, user_id: int, project_name: str, channel: str
) -> Conversation:
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.user_id == user_id,
            Conversation.project_id == project_id,
            Conversation.agent_name == channel,
        )
        .first()
    )
    if not conv:
        _labels = {
            "group": "Group Chat",
            "manager": "Manager",
            "creative_director": "Creative Director",
            "publicist": "Publicist",
        }
        conv = Conversation(
            user_id=user_id,
            project_id=project_id,
            agent_name=channel,
            display_name=f"{_labels.get(channel, channel)} — {project_name}",
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
    return conv


def _build_agent_context(
    db: Session,
    project,
    current_conv: Conversation,
    channel: str,
) -> str:
    lines: List[str] = []

    lines.append("=== PROJECT ===")
    lines.append(f"Title: {project.name}")
    lines.append(f"Type: {(project.project_type or 'song').upper()}")
    if project.description:
        lines.append(f"Description: {project.description}")
    if project.mood:
        lines.append(f"Mood / Theme: {project.mood}")
    if project.goal:
        lines.append(f"Primary Goal: {project.goal}")

    if channel != "group":
        group_conv = (
            db.query(Conversation)
            .filter(
                Conversation.user_id == current_conv.user_id,
                Conversation.project_id == project.id,
                Conversation.agent_name == "group",
            )
            .first()
        )
        if group_conv:
            group_msgs = (
                db.query(Message)
                .filter(Message.conversation_id == group_conv.id)
                .order_by(Message.created_at.desc())
                .limit(15)
                .all()
            )
            group_msgs.reverse()
            if group_msgs:
                lines.append("\n=== GROUP CHAT MEMORY (recent) ===")
                for m in group_msgs:
                    sender = "Artist" if m.sender == "user" else m.sender.replace("_", " ").title()
                    lines.append(f"{sender}: {m.content[:400]}")

    local_msgs = (
        db.query(Message)
        .filter(Message.conversation_id == current_conv.id)
        .order_by(Message.created_at.desc())
        .limit(10)
        .all()
    )
    local_msgs.reverse()
    if local_msgs:
        label = "GROUP CHAT HISTORY" if channel == "group" else "CONVERSATION HISTORY"
        lines.append(f"\n=== {label} ===")
        for m in local_msgs:
            sender = "Artist" if m.sender == "user" else m.sender.replace("_", " ").title()
            lines.append(f"{sender}: {m.content[:400]}")

    return "\n".join(lines)


def _build_rollout_prompt(project) -> str:
    parts = [f'The artist has a new {project.project_type or "song"} called "{project.name}".']
    if project.description:
        parts.append(f"About it: {project.description}")
    if project.mood:
        parts.append(f"Mood / theme: {project.mood}")
    if project.goal:
        parts.append(f"Primary goal: {project.goal}")
    parts.append(
        "\nPlease create a concise, actionable release rollout plan. Include:\n"
        "1. Pre-release checklist (2–4 weeks before release day)\n"
        "2. Release week actions (launch day and the days immediately after)\n"
        "3. Post-release follow-through (2–4 weeks after release)\n\n"
        "Format it clearly with numbered steps the artist can follow immediately."
    )
    return "\n".join(parts)


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project_endpoint(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return project_crud.create_project(db, project, current_user.id)


@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return project_crud.get_user_projects(db, current_user.id)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_endpoint(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = project_crud.get_user_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project_endpoint(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = project_crud.get_user_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project_crud.update_project(db, project, data)


@router.get("/{project_id}/tasks", response_model=List[TaskResponse])
def list_project_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = project_crud.get_user_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return task_crud.get_project_tasks(db, project_id)


@router.post("/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_project_task(
    project_id: int,
    body: TaskBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = project_crud.get_user_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    task_in = TaskCreate(
        title=body.title,
        status=body.status,
        due_date=body.due_date,
        project_id=project_id,
        source=body.source,
        category=body.category,
        source_agent=body.source_agent,
    )
    return task_crud.create_task(db, task_in, current_user.id)


@router.patch("/{project_id}/tasks/{task_id}", response_model=TaskResponse)
def update_project_task(
    project_id: int,
    task_id: int,
    body: TaskUpdateBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_crud.get_user_task(db, task_id, current_user.id)
    if not task or task.project_id != project_id:
        raise HTTPException(status_code=404, detail="Task not found")
    update_data = TaskUpdate(**body.model_dump(exclude_unset=True))
    return task_crud.update_task_partial(db, task, update_data)


@router.delete("/{project_id}/tasks/{task_id}", response_model=TaskResponse)
def delete_project_task(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = task_crud.get_user_task(db, task_id, current_user.id)
    if not task or task.project_id != project_id:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_crud.delete_task(db, task_id)


@router.get("/{project_id}/plan", response_model=PlanResponse)
def get_latest_plan(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = project_crud.get_user_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    latest_message = (
        db.query(Message)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(
            Conversation.user_id == current_user.id,
            Conversation.project_id == project_id,
            Conversation.agent_name == "group",
            Message.sender == "manager",
        )
        .order_by(Message.created_at.desc())
        .first()
    )
    if not latest_message:
        raise HTTPException(status_code=404, detail="No plan found for this project")

    return PlanResponse(
        conversation_id=latest_message.conversation_id,
        plan=latest_message.content,
    )


@router.post("/{project_id}/plan", response_model=PlanResponse)
async def plan_project_rollout(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = project_crud.get_user_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    conv = _get_or_create_conversation(db, project_id, current_user.id, project.name, "group")
    context_str = _build_agent_context(db, project, conv, "group")
    prompt = _build_rollout_prompt(project)
    result = await run_single_agent("manager", prompt, context_str)
    plan_text = result.get("reply", "No plan generated.")

    db.add(Message(conversation_id=conv.id, sender="user", content=prompt))
    db.add(Message(conversation_id=conv.id, sender="manager", content=plan_text))
    conv.updated_at = datetime.utcnow()
    db.commit()

    return PlanResponse(conversation_id=conv.id, plan=plan_text)


@router.get("/{project_id}/chat", response_model=ChatHistoryResponse)
def get_project_chat(
    project_id: int,
    channel: str = Query("manager"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if channel not in _VALID_CHANNELS:
        raise HTTPException(status_code=400, detail=f"Invalid channel: {channel}")

    project = project_crud.get_user_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    conv = _get_or_create_conversation(db, project_id, current_user.id, project.name, channel)
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return ChatHistoryResponse(conversation_id=conv.id, messages=messages)


@router.post("/{project_id}/chat", response_model=ChatReplyResponse)
async def send_project_chat(
    project_id: int,
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.channel not in _VALID_CHANNELS:
        raise HTTPException(status_code=400, detail=f"Invalid channel: {body.channel}")

    project = project_crud.get_user_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    conv = _get_or_create_conversation(db, project_id, current_user.id, project.name, body.channel)

    user_msg = Message(conversation_id=conv.id, sender="user", content=body.message)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    context_str = _build_agent_context(db, project, conv, body.channel)
    new_messages: List[Message] = [user_msg]

    if body.channel == "group":
        result = await run_team_chat(body.message, context_str)
        for m in result.get("messages", []):
            agent_msg = Message(
                conversation_id=conv.id,
                sender=m.get("speaker", "manager"),
                content=m.get("content", ""),
            )
            db.add(agent_msg)
            new_messages.append(agent_msg)
    else:
        result = await run_single_agent(body.channel, body.message, context_str)
        agent_msg = Message(
            conversation_id=conv.id,
            sender=body.channel,
            content=result.get("reply", "No response."),
        )
        db.add(agent_msg)
        new_messages.append(agent_msg)

    conv.updated_at = datetime.utcnow()
    db.commit()
    for msg in new_messages:
        db.refresh(msg)

    return ChatReplyResponse(messages=new_messages)


@router.delete("/{project_id}", response_model=ProjectResponse)
def delete_project_endpoint(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = project_crud.get_user_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project_crud.delete_project(db, project_id)