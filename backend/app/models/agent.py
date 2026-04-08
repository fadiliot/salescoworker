from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON
from app.database import Base
from datetime import datetime
import uuid

class AgentLog(Base):
    __tablename__ = "agent_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message = Column(String, nullable=False)
    workflow_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AgentConfig(Base):
    __tablename__ = "agent_configs"
    workflow_name = Column(String, primary_key=True)
    is_enabled = Column(Boolean, default=True)
    settings = Column(JSON, nullable=True) # For any workflow-specific tuning

class ApprovalQueue(Base):
    __tablename__ = "approval_queue"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String, nullable=False) # e.g. "Reactivation"
    subject = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String, default="pending") # pending, approved, rejected
    metadata_json = Column(JSON, nullable=True) # Store recipient email, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
