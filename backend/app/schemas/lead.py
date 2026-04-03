from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.lead import LeadStatus, LeadSource


class LeadBase(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    status: LeadStatus = LeadStatus.new
    source: LeadSource = LeadSource.manual
    notes: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    status: Optional[LeadStatus] = None
    source: Optional[LeadSource] = None
    score: Optional[int] = None
    notes: Optional[str] = None
    ai_next_action: Optional[str] = None


class LeadResponse(LeadBase):
    id: UUID
    score: int
    ai_summary: Optional[str] = None
    ai_next_action: Optional[str] = None
    is_hot: Optional[str] = "false"
    zoho_lead_id: Optional[str] = None
    last_contacted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
