from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])


@router.get("", response_model=List[ReminderResponse])
def list_reminders(
    lead_id: Optional[UUID] = None,
    upcoming_only: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(Reminder).filter(Reminder.is_completed == False)
    if lead_id:
        query = query.filter(Reminder.lead_id == lead_id)
    if upcoming_only:
        query = query.filter(Reminder.due_at >= datetime.utcnow())
    return query.order_by(Reminder.due_at.asc()).all()


@router.post("", response_model=ReminderResponse)
def create_reminder(rem_in: ReminderCreate, db: Session = Depends(get_db)):
    reminder = Reminder(**rem_in.model_dump())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(reminder_id: UUID, rem_in: ReminderUpdate, db: Session = Depends(get_db)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    for field, value in rem_in.model_dump(exclude_unset=True).items():
        setattr(reminder, field, value)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.patch("/{reminder_id}/complete")
def complete_reminder(reminder_id: UUID, db: Session = Depends(get_db)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    reminder.is_completed = True
    db.commit()
    return {"message": "Reminder completed"}


@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: UUID, db: Session = Depends(get_db)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(reminder)
    db.commit()
    return {"message": "Reminder deleted"}
