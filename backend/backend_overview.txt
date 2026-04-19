# Sonic AI Backend Overview

This document explains the main pieces of the Sonic AI backend: how requests flow through the system, the core data models, and the important API routes and configuration for the multi‑agent workflow.

---

## 1. High-level architecture

- **Stack**: FastAPI + SQLAlchemy + relational DB.
- **Auth**: Requests are made by an authenticated user (`current_user`), resolved via `get_current_user`.
- **Core domain**:
  - **Conversations & messages** for multi-agent chat.
  - **Projects & tasks** for planning and tracking work.
  - **Agent logs** to record what each AI agent did and when.
- **LLM**: Groq model exposed via OpenAI-compatible API, configured through a shared `llm_config`.

---

## 2. LLM configuration (Groq)

The backend uses a shared `config_list` and `llm_config` for all agents:

```python
config_list = [
    {
        "model": "llama-3.3-70b-versatile",
        "api_type": "openai",
        "base_url": "https://api.groq.com/openai/v1",
        "api_key": GROQ_API_KEY,
        "request_timeout": 60,  # seconds
    }
]

llm_config = {
    "config_list": config_list,
    "temperature": 0.7,
    "timeout": 60,  # agent-level timeout in seconds
}
```

Every agent (manager, creative_director, publicist, team, artist_workflow) is created with this `llm_config`, so they all share the same model, temperature, and timeout behaviour.[web:741]

---

## 3. Data models

### 3.1 Conversation & Message

- **Conversation**
  - `id`: primary key.
  - `user_id`: owner of the conversation.
  - `agent_name`: stable agent identifier (e.g. `"manager"`, `"creative_director"`, `"publicist"`, `"team"`).
  - `display_name`: user-facing label, can be changed at any time (e.g. `"Manager Kelly"` → `"Kanye"`).
  - `created_at`, `updated_at`.

- **Message**
  - `id`, `conversation_id`, `sender` (`"user"` or agent name), `content`, `created_at`.

Conversations group messages between the user and a specific agent. Changing `display_name` does not affect the backend routing; the backend always uses `agent_name` as the stable key.

### 3.2 Project & Task

- **Project**
  - `id`, `name`, `description`, `owner_id`.

- **Task**
  - `id`, `title`, `description`.
  - `is_completed` (boolean), `status` (string, default `"pending"`).
  - `project_id` (optional link to a project).
  - `user_id` (owner of the task).

Projects group higher-level initiatives (e.g. “Debut EP Rollout”), while tasks represent specific actions (e.g. “Shoot cover art”).

### 3.3 AgentLog

- **AgentLog**
  - `id`, `agent_name`, `action` (e.g. `"run"`, `"chat"`).
  - `input_payload`: text/json of what was sent to the agent.
  - `output_result`: text/json of what the agent returned.
  - `timestamp`: when the run happened.
  - `task_id` (nullable): optional link to a `Task`.

This allows you to see all activity by agent, and (in future) filter logs for a specific task.

---

## 4. API routes

### 4.1 Conversations & messages

Prefix: `/conversations`

- **POST `/conversations/`**  
  Create a new conversation for the current user and a given agent.

  Request body:

  ```json
  {
    "agent_name": "manager",
    "display_name": "Manager Kelly"
  }
  ```

  Response (example):

  ```json
  {
    "id": 1,
    "user_id": 1,
    "agent_name": "manager",
    "display_name": "Manager Kelly",
    "created_at": "2026-04-12T19:04:37.000000",
    "updated_at": "2026-04-12T19:04:37.000000"
  }
  ```

- **GET `/conversations/`**  
  List all conversations for the current user, newest first.

  Example response:

  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "agent_name": "manager",
      "display_name": "Manager Kelly",
      "created_at": "2026-04-12T19:04:37.000000",
      "updated_at": "2026-04-12T21:48:29.000000"
    },
    {
      "id": 2,
      "user_id": 1,
      "agent_name": "creative_director",
      "display_name": "Creative Director",
      "created_at": "2026-04-12T19:06:07.000000",
      "updated_at": "2026-04-13T10:37:20.000000"
    }
  ]
  ```

- **GET `/conversations/{conversation_id}`**  
  Get a single conversation plus all messages in chronological order.

  Example:

  ```json
  {
    "id": 1,
    "user_id": 1,
    "agent_name": "manager",
    "display_name": "Manager Kelly",
    "created_at": "2026-04-12T19:04:37.000000",
    "updated_at": "2026-04-12T21:48:29.000000",
    "messages": [
      {
        "id": 1,
        "conversation_id": 1,
        "sender": "user",
        "content": "Help me plan my debut EP rollout.",
        "created_at": "2026-04-12T19:04:37.000000"
      },
      {
        "id": 2,
        "conversation_id": 1,
        "sender": "manager",
        "content": "Great, tell me your release date, budget, and target platforms.",
        "created_at": "2026-04-12T19:04:38.000000"
      }
    ]
  }
  ```

- **GET `/conversations/{conversation_id}/messages`**  
  List messages only, for a specific conversation.

- **PATCH `/conversations/{conversation_id}`**  
  Update mutable fields on a conversation (currently `display_name`).

  Request:

  ```json
  {
    "display_name": "Kanye"
  }
  ```

  Response:

  ```json
  {
    "id": 1,
    "user_id": 1,
    "agent_name": "manager",
    "display_name": "Kanye",
    "created_at": "2026-04-12T19:04:37.000000",
    "updated_at": "2026-04-14T11:10:00.000000"
  }
  ```

This lets the frontend freely rename the visible label for an agent in a conversation without breaking the underlying `agent_name` logic.

---

### 4.2 Projects

Prefix: `/projects`

- **POST `/projects/?owner_id={user_id}`**  
  Create a project for the given owner.

  Request body:

  ```json
  {
    "name": "Debut EP Rollout",
    "description": "Planning content and strategy for my first EP.",
    "status": "in_progress"
  }
  ```

  Example response:

  ```json
  {
    "name": "Debut EP Rollout",
    "description": "Planning content and strategy for my first EP.",
    "id": 1,
    "owner_id": 1
  }
  ```

- **GET `/projects/`**  
  List projects for the current user.

  ```json
  [
    {
      "name": "Debut EP Rollout",
      "description": "Planning content and strategy for my first EP.",
      "id": 1,
      "owner_id": 1
    }
  ]
  ```

- **GET `/projects/{project_id}`**

  ```json
  {
    "name": "Debut EP Rollout",
    "description": "Planning content and strategy for my first EP.",
    "id": 1,
    "owner_id": 1
  }
  ```

---

### 4.3 Tasks

Prefix: `/tasks`

- **POST `/tasks/`**  
  Create a task, optionally linked to a project.

  Request:

  ```json
  {
    "title": "Shoot cover art",
    "description": "Book photographer and shoot EP cover.",
    "is_completed": false,
    "project_id": 1
  }
  ```

  Response:

  ```json
  {
    "title": "Shoot cover art",
    "description": "Book photographer and shoot EP cover.",
    "is_completed": false,
    "id": 1,
    "project_id": 1,
    "user_id": 1
  }
  ```

- **GET `/tasks/`**

  ```json
  [
    {
      "title": "Shoot cover art",
      "description": "Book photographer and shoot EP cover.",
      "is_completed": false,
      "id": 1,
      "project_id": 1,
      "user_id": 1
    }
  ]
  ```

- **GET `/tasks/{task_id}`**

  ```json
  {
    "title": "Shoot cover art",
    "description": "Book photographer and shoot EP cover.",
    "is_completed": false,
    "id": 1,
    "project_id": 1,
    "user_id": 1
  }
  ```

---

### 4.4 Agent logs

Prefix: `/logs`

- **POST `/logs/`**  
  (Utility route) Create an `AgentLog` from the outside, mainly for testing.

- **GET `/logs`**  
  List all logs.

  Example (truncated):

  ```json
  [
    {
      "id": 1,
      "agent_name": "artist_workflow",
      "action": "run",
      "timestamp": "2026-04-06T20:13:23.863960"
    },
    {
      "id": 8,
      "agent_name": "manager",
      "action": "chat",
      "timestamp": "2026-04-12T19:04:37.245878"
    }
  ]
  ```

- **GET `/logs/{log_id}`**

  ```json
  {
    "id": 1,
    "agent_name": "artist_workflow",
    "action": "run",
    "timestamp": "2026-04-06T20:13:23.863960"
  }
  ```

- **GET `/logs/task/{task_id}`**  
  List logs for a given task. For now this may return an empty array until runs are explicitly tied to tasks.

  ```json
  []
  ```

- **DELETE `/logs/{log_id}`**  
  Delete a log by id.

---

## 5. Multi-agent execution flow (conceptual)

The typical flow when the user chats with an agent looks like:

1. **User selects an agent** (e.g. manager) and a conversation.
2. **Frontend sends** a message to the backend through an agent execution endpoint (e.g. `POST /agent/execute` with `conversation_id`, `agent_name`, and `message`).
3. **Backend resolves the agent** using `agent_name` and the shared `llm_config`, which in turn uses the Groq/OpenAI-compatible API.
4. The LLM **returns** a response, which the backend:
   - Saves as a new `Message` row in the same `Conversation`.
   - Optionally creates an `AgentLog` with `input_payload` and `output_result` (and later, `task_id` when runs are tied to tasks).
5. **Frontend refreshes**:
   - Conversation view (messages from `GET /conversations/{id}`).
   - Any related project/task/insights UI.

The same pattern is reused for different agents (`manager`, `creative_director`, `publicist`, `team`), with each agent using its own system prompt but the same underlying `llm_config`.

---

## 6. How to use this doc with other tools

- **GitHub**: `backend_overview.md` renders nicely for future collaborators.
- **LLMs / Lovable**: you can upload this file plus `sample_responses.json` so another model has:
  - A clear picture of your data model and routes.
  - Concrete example payloads for each important endpoint.

This should be enough context for any agent or scaffold tool to safely extend the backend or build a frontend on top of it.