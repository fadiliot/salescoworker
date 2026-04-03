from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.email import EmailDirection


class EmailResponse(BaseModel):
    id: UUID
    lead_id: Optional[UUID] = None
    from_address: Optional[str] = None
    to_address: Optional[str] = None
    subject: Optional[str] = None
    body_text: Optional[str] = None
    direction: EmailDirection
    is_read: bool
    outlook_message_id: Optional[str] = None
    received_at: Optional[datetime] = None
    ai_summary: Optional[str] = None
    ai_suggested_reply: Optional[str] = None
    sentiment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    lead_id: Optional[UUID] = None


class SuggestReplyRequest(BaseModel):
    email_id: UUID
    context: Optional[str] = None
