import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Integer, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class LeadStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    proposal = "proposal"
    negotiation = "negotiation"
    won = "won"
    lost = "lost"


class LeadSource(str, enum.Enum):
    website = "website"
    email = "email"
    phone = "phone"
    referral = "referral"
    zoho = "zoho"
    manual = "manual"
    linkedin = "linkedin"
    other = "other"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    title = Column(String(150), nullable=True)
    status = Column(Enum(LeadStatus), default=LeadStatus.new, nullable=False)
    source = Column(Enum(LeadSource), default=LeadSource.manual, nullable=False)
    score = Column(Integer, default=0)  # 0-100
    notes = Column(Text, nullable=True)

    # Zoho sync
    zoho_lead_id = Column(String(100), nullable=True, unique=True)
    zoho_contact_id = Column(String(100), nullable=True)

    # AI fields
    ai_summary = Column(Text, nullable=True)
    ai_next_action = Column(Text, nullable=True)
    is_hot = Column(String(10), default="false")

    # Tracking
    last_contacted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    activities = relationship("Activity", back_populates="lead", cascade="all, delete-orphan")
    deals = relationship("Deal", back_populates="lead", cascade="all, delete-orphan")
    emails = relationship("Email", back_populates="lead")
    reminders = relationship("Reminder", back_populates="lead", cascade="all, delete-orphan")
    contacts = relationship("Contact", back_populates="lead", cascade="all, delete-orphan")
