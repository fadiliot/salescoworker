import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class StakeholderRole(str, enum.Enum):
    champion = "Champion"
    gatekeeper = "Gatekeeper"
    economic_buyer = "Economic Buyer"
    evaluator = "Evaluator"
    legal = "Legal"
    unknown = "Unknown"


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    title = Column(String(150), nullable=True)
    role_type = Column(Enum(StakeholderRole), default=StakeholderRole.unknown, nullable=True)
    notes = Column(Text, nullable=True)

    # Zoho sync
    zoho_contact_id = Column(String(100), nullable=True, unique=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    lead = relationship("Lead", back_populates="contacts")
