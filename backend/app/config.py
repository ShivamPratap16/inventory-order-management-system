"""Application configuration loaded from environment variables.

All settings come from the environment (or a local .env file in development).
Nothing is hardcoded so the same image runs in dev, CI and production just by
changing env vars - which is exactly what the Docker / deployment setup needs.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str

    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    low_stock_threshold: int = 10

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
