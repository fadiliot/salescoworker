from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class ReminderCreate(BaseModel):
    lead_id: Optional[UUID] = None
    title: str
    message: Optional[str] = None
    due_at: datetime


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    due_at: Optional[datetime] = None
    is_completed: Optional[bool] = None
    is_snoozed: Optional[bool] = None


class ReminderResponse(ReminderCreate):
    id: UUID
    is_completed: bool
    is_snoozed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
