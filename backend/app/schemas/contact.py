from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class ContactBase(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    notes: Optional[str] = None
    lead_id: Optional[UUID] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    notes: Optional[str] = None


class ContactResponse(ContactBase):
    id: UUID
    zoho_contact_id: Optional[str] = None
    role_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
