"""Settings for the whole backend, read from backend/.env (SI-4: keys stay on the server)."""

from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py -> parents[2] is the backend/ folder.
# Building the path from this file means it works no matter where you run the command.
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",  # unknown lines in .env are skipped, not errors
    )

    # Cloud model keys. Empty by default so the app starts without a .env file.
    groq_api_key: SecretStr = SecretStr("")
    openrouter_api_key: SecretStr = SecretStr("")

    # Model names used only by the key check. Set them in .env.
    groq_test_model: str = ""
    openrouter_test_model: str = ""

    # Local defaults for the services Docker will run later.
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/synoras"
    redis_url: str = "redis://localhost:6379/0"

    # Not enforced yet. The Login step will require a real secret.
    jwt_secret: SecretStr = SecretStr("")


@lru_cache
def get_settings() -> Settings:
    """Read .env once and reuse the same Settings object afterwards."""
    return Settings()
