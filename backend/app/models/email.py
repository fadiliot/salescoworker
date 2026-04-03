import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class EmailDirection(str, enum.Enum):
    inbound = "inbound"
    outbound = "outbound"


class Email(Base):
    __tablename__ = "emails"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=True)

    # Message metadata
    from_address = Column(String(255), nullable=True)
    to_address = Column(Text, nullable=True)
    cc_address = Column(Text, nullable=True)
    subject = Column(String(500), nullable=True)
    body_text = Column(Text, nullable=True)
    body_html = Column(Text, nullable=True)
    direction = Column(Enum(EmailDirection), default=EmailDirection.inbound)
    is_read = Column(Boolean, default=False)

    # Outlook sync
    outlook_message_id = Column(String(500), nullable=True, unique=True)
    outlook_thread_id = Column(String(500), nullable=True)
    received_at = Column(DateTime, nullable=True)

    # AI analysis
    ai_summary = Column(Text, nullable=True)
    ai_suggested_reply = Column(Text, nullable=True)
    ai_extracted_lead = Column(Text, nullable=True)  # JSON string
    sentiment = Column(String(20), nullable=True)  # positive/neutral/negative

    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="emails")
