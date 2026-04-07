from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:Sabreens14!@localhost:5432/salescoworker"

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Zoho
    ZOHO_CLIENT_ID: Optional[str] = None
    ZOHO_CLIENT_SECRET: Optional[str] = None
    ZOHO_REDIRECT_URI: str = "http://localhost:8000/api/auth/callback/zoho"
    ZOHO_ACCOUNTS_URL: str = "https://accounts.zoho.com"
    ZOHO_CRM_API_URL: str = "https://www.zohoapis.com/crm/v3"
    ZOHO_BOOKS_API_URL: str = "https://www.zohoapis.com/books/v3"
    ZOHO_ORGANIZATION_ID: Optional[str] = None

    # Microsoft
    MS_CLIENT_ID: Optional[str] = None
    MS_CLIENT_SECRET: Optional[str] = None
    MS_TENANT_ID: str = "common"
    MS_REDIRECT_URI: str = "http://localhost:8000/api/auth/callback/microsoft"
    MS_GRAPH_URL: str = "https://graph.microsoft.com/v1.0"
    MS_SCOPES: str = "Mail.ReadWrite Mail.Send Calendars.Read User.Read offline_access"

    # Gemini AI
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Yeastar PBX
    YEASTAR_HOST: Optional[str] = None
    YEASTAR_USERNAME: Optional[str] = None
    YEASTAR_PASSWORD: Optional[str] = None

    # Google
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "https://sales-coworker-api.onrender.com/api/auth/callback/google"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
