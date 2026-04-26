from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str  # required

    OPENAI_API_KEY: Optional[str] = None  # unused; optional so teammates don't need it
    XAI_API_KEY: Optional[str] = None    # unused; optional so teammates don't need it

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
