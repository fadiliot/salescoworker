from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.activity import ActivityType


class ActivityBase(BaseModel):
    activity_type: ActivityType
    title: str
    description: Optional[str] = None
    outcome: Optional[str] = None
    duration_seconds: Optional[str] = None
    lead_id: Optional[UUID] = None
    occurred_at: Optional[datetime] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityResponse(ActivityBase):
    id: UUID
    yeastar_call_id: Optional[str] = None
    call_direction: Optional[str] = None
    caller_number: Optional[str] = None
    callee_number: Optional[str] = None
    recording_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
