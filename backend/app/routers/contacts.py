from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models.contact import Contact, StakeholderRole
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse

router = APIRouter(prefix="/api/contacts", tags=["Contacts"])


@router.get("", response_model=List[ContactResponse])
def list_contacts(lead_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    query = db.query(Contact)
    if lead_id:
        query = query.filter(Contact.lead_id == lead_id)
    return query.all()


@router.post("", response_model=ContactResponse)
def create_contact(contact_in: ContactCreate, db: Session = Depends(get_db)):
    contact = Contact(**contact_in.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(contact_id: UUID, db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.put("/{contact_id}", response_model=ContactResponse)
def update_contact(contact_id: UUID, contact_in: ContactUpdate, db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for field, value in contact_in.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    db.commit()
    db.refresh(contact)
    return contact


@router.patch("/{contact_id}/role")
def update_contact_role(contact_id: UUID, role: str, db: Session = Depends(get_db)):
    """Update the stakeholder role of a contact (for Stakeholder Map)"""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    try:
        contact.role_type = StakeholderRole(role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {[r.value for r in StakeholderRole]}")
    db.commit()
    return {"id": str(contact.id), "role_type": contact.role_type}


@router.post("/{contact_id}/analyze")
async def analyze_contact_role(contact_id: UUID, db: Session = Depends(get_db)):
    """Use AI to predict the stakeholder role based on title and metadata"""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    from app.ai.stakeholder_analyzer import categorize_contact
    role = await categorize_contact(
        first_name=contact.first_name,
        last_name=contact.last_name or "",
        title=contact.title or "",
        company=contact.company or "",
        notes=contact.notes
    )
    
    contact.role_type = role
    db.commit()
    return {"id": str(contact.id), "role_type": contact.role_type, "title": contact.title}


@router.delete("/{contact_id}")
def delete_contact(contact_id: UUID, db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"message": "Contact deleted"}
