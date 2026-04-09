import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class ActivityType(str, enum.Enum):
    call = "call"
    email = "email"
    meeting = "meeting"
    note = "note"
    task = "task"


class Activity(Base):
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=True)
    activity_type = Column(Enum(ActivityType), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    outcome = Column(String(100), nullable=True)
    duration_seconds = Column(String(20), nullable=True)  # for calls

    # Yeastar PBX call tracking
    yeastar_call_id = Column(String(200), nullable=True)
    call_direction = Column(String(20), nullable=True)  # inbound/outbound
    caller_number = Column(String(50), nullable=True)
    callee_number = Column(String(50), nullable=True)
    recording_url = Column(String(500), nullable=True)
    zoho_id = Column(String(100), nullable=True)  # ID of synced Zoho Event/Task/Call

    occurred_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="activities")
