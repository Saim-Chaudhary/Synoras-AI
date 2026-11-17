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

    # Which model runs each tier (see decisions A10). Names live in .env so they can
    # be changed without touching code: free models on OpenRouter come and go.
    groq_model: str = ""  # smaller cloud tier (Medium)
    openrouter_model: str = ""  # stronger cloud tier (High)
    ollama_model: str = ""  # local tier (Low); empty until Ollama is installed
    ollama_base_url: str = "http://localhost:11434"

    # Local defaults for the services Docker will run later.
    # Docker maps the container's 5432 to port 5433 on your PC (a Windows PostgreSQL uses 5432).
    # 127.0.0.1, not "localhost": "localhost" tries IPv6 first, and Docker only listens on IPv4.
    database_url: str = "postgresql+psycopg://synoras:synoras_password@127.0.0.1:5433/synoras"
    redis_url: str = "redis://127.0.0.1:6379/0"

    # Login tokens (decisions A16). The secret signs every token, so it must be long and private.
    # Empty by default so the app and tests start without a .env; login then answers 503
    # with a clear message instead of issuing weak tokens.
    jwt_secret: SecretStr = SecretStr("")
    access_token_expire_minutes: int = 60


@lru_cache
def get_settings() -> Settings:
    """Read .env once and reuse the same Settings object afterwards."""
    return Settings()
