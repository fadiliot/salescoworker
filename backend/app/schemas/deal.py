from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.deal import DealStage


class DealBase(BaseModel):
    title: str
    stage: DealStage = DealStage.new
    amount: Optional[str] = None
    currency: str = "USD"
    close_date: Optional[datetime] = None
    probability: Optional[str] = None
    notes: Optional[str] = None
    lead_id: Optional[UUID] = None


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    title: Optional[str] = None
    stage: Optional[DealStage] = None
    amount: Optional[str] = None
    currency: Optional[str] = None
    close_date: Optional[datetime] = None
    probability: Optional[str] = None
    notes: Optional[str] = None


class DealResponse(DealBase):
    id: UUID
    zoho_deal_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
