import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class IntegrationToken(Base):
    __tablename__ = "integration_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service = Column(String(50), nullable=False)  # zoho_crm, zoho_books, microsoft
    user_identifier = Column(String(255), nullable=True)  # email or user id

    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_type = Column(String(50), default="Bearer")
    scope = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    # Extra metadata
    extra_data = Column(Text, nullable=True)  # JSON string for service-specific data

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
