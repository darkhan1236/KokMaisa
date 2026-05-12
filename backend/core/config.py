# backend/core/config.py
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True)

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        weak_values = {"secret", "changeme", "change-me", "admin123", "password", "jwt_secret"}
        if len(value) < 32 or value.lower() in weak_values:
            raise ValueError("JWT_SECRET_KEY must be a strong random value with at least 32 characters")
        return value

    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", 
                                  "http://127.0.0.1:5173",
                                  "http://localhost:3000",]  # Frontend URL

    EMAIL_HOST: str
    EMAIL_PORT: int
    EMAIL_USERNAME: str
    EMAIL_PASSWORD: str
    EMAIL_FROM: str
    EMAIL_FROM_NAME: str
    
    FRONTEND_URL: str = "http://localhost:5173" 
    openai_api_key: str = Field("", alias="OPENAI_API_KEY")
    openai_model: str = Field("meta-llama/llama-3.1-8b-instruct", alias="OPENAI_MODEL")
    openai_base_url: str = Field("https://openrouter.ai/api/v1", alias="OPENAI_BASE_URL")

    MODEL_PATH: Optional[str] = None          # ← добавь эту строку
    BACKBONE_NAME: str = "vit_large_patch16_dinov3_qkvb.lvd1689m"
    MODEL_HIDDEN: int = 512
    MODEL_DROPOUT: float = 0.4



settings = Settings()
