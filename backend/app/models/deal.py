import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class DealStage(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    proposal = "proposal"
    negotiation = "negotiation"
    won = "won"
    lost = "lost"


class Deal(Base):
    __tablename__ = "deals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=True)
    title = Column(String(255), nullable=False)
    stage = Column(Enum(DealStage), default=DealStage.new, nullable=False)
    amount = Column(String(50), nullable=True)
    currency = Column(String(10), default="USD")
    close_date = Column(DateTime, nullable=True)
    probability = Column(String(10), nullable=True)  # percentage
    notes = Column(Text, nullable=True)

    # Zoho sync
    zoho_deal_id = Column(String(100), nullable=True, unique=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    lead = relationship("Lead", back_populates="deals")
