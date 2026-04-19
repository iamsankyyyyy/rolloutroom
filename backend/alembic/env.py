import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

load_dotenv()

from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.agent_log import AgentLog

from app.database.session import Base

config = context.config
fileConfig(config.config_file_name)

target_metadata = Base.metadata

db_url = os.getenv("DATABASE_URL")
config.set_main_option(
    "sqlalchemy.url",
    db_url.replace("%", "%%")
)

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

run_migrations_online()