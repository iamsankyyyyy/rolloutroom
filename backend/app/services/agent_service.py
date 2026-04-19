import json
from typing import Any, Dict

from sqlalchemy.orm import Session

from app.crud import agent_logs as agent_log_crud
from app.schemas.agent_log import AgentLogCreate
from app.services.agents import run_team_chat, run_single_agent
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.core.dependencies import get_current_user 


async def execute_agent_action(
    db: Session,
    agent_name: str,
    action: str,
    payload: str,
) -> Dict[str, Any]:
    """
    Bridge between the /agent/execute endpoint and your AI agents.
    Adds optional conversation history support when conversation_id is provided.
    """
    try:
        data = json.loads(payload) if isinstance(payload, str) else payload

        task_type = data.get("task_type", "")
        prompt = data.get("prompt", "")
        conversation_id = data.get("conversation_id")

        conversation = None
        history_messages = []

        if conversation_id is not None:
            conversation = (
                db.query(Conversation)
                .filter(Conversation.id == conversation_id)
                .first()
            )
            if conversation:
                history_messages = (
                    db.query(Message)
                    .filter(Message.conversation_id == conversation.id)
                    .order_by(Message.created_at.asc())
                    .all()
                )

        # For now we only pass the latest prompt into the LLM.
        # Later we can adapt run_single_agent/run_team_chat to accept history.
        if agent_name == "team" and action == "chat":
            result = await run_team_chat(task_type, prompt)
        elif agent_name in {"manager", "creative_director", "publicist"} and action == "chat":
            result = await run_single_agent(agent_name, prompt)
        else:
            result = {
                "error": f"Unsupported agent/action: {agent_name}/{action}",
            }

        # Persist messages if we have a conversation
        if conversation:
            # Save user message
            user_msg = Message(
                conversation_id=conversation.id,
                sender="user",
                content=prompt,
            )
            db.add(user_msg)

            # Save agent message(s)
            if agent_name == "team" and "messages" in result:
                for m in result["messages"]:
                    agent_msg = Message(
                        conversation_id=conversation.id,
                        sender=m.get("speaker", agent_name),
                        content=m.get("content", ""),
                    )
                    db.add(agent_msg)
            elif "reply" in result:
                agent_msg = Message(
                    conversation_id=conversation.id,
                    sender=agent_name,
                    content=result["reply"],
                )
                db.add(agent_msg)

            conversation.updated_at = conversation.updated_at  # just to touch it
            db.commit()

        log_entry = AgentLogCreate(
            agent_name=agent_name,
            action=action,
            input_payload=json.dumps(data),
            output_result=json.dumps(result),
        )
        agent_log_crud.create_agent_log(db, log_entry)

        return {
            "agent_name": agent_name,
            "action": action,
            "result": result,
        }

    except Exception as e:
        error_msg = f"Error: {str(e)}"
        log_entry = AgentLogCreate(
            agent_name=agent_name,
            action=action,
            input_payload=payload,
            output_result=error_msg,
        )
        agent_log_crud.create_agent_log(db, log_entry)
        return {"error": str(e)}
