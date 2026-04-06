from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadUpdate, LeadResponse
from app.ai.lead_scorer import score_lead
from app.ai.insights import suggest_next_actions
from datetime import datetime

router = APIRouter(prefix="/api/leads", tags=["Leads"])


@router.get("", response_model=List[LeadResponse])
def list_leads(
    status: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Lead)
    if status:
        query = query.filter(Lead.status == status)
    if source:
        query = query.filter(Lead.source == source)
    if search:
        query = query.filter(
            Lead.first_name.ilike(f"%{search}%") |
            Lead.last_name.ilike(f"%{search}%") |
            Lead.email.ilike(f"%{search}%") |
            Lead.company.ilike(f"%{search}%")
        )
    return query.order_by(Lead.created_at.desc(), Lead.score.desc()).offset(skip).limit(limit).all()


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: UUID, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


from sqlalchemy.exc import IntegrityError

@router.post("", response_model=LeadResponse)
def create_lead(lead_in: LeadCreate, db: Session = Depends(get_db)):
    try:
        lead = Lead(**lead_in.model_dump())
        db.add(lead)
        db.commit()
        db.refresh(lead)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Lead with this email already exists")
    
    # Auto-score new lead
    try:
        score_data = score_lead({
            "name": f"{lead.first_name} {lead.last_name}",
            "email": lead.email,
            "company": lead.company,
            "status": lead.status,
            "source": str(lead.source),
            "activities_count": 0,
            "emails_count": 0,
            "days_since_contact": 0,
        })
        lead.score = score_data.get("score", 0)
        lead.is_hot = str(score_data.get("is_hot", False)).lower()
        lead.ai_next_action = score_data.get("next_action")
        db.commit()
        db.refresh(lead)
    except Exception:
        # If scoring fails, we still have the lead saved from the first commit
        pass
        
    return lead


@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: UUID, lead_in: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    for field, value in lead_in.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)
    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}")
def delete_lead(lead_id: UUID, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted"}


@router.post("/{lead_id}/rescore")
def rescore_lead(lead_id: UUID, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    activities_count = len(lead.activities)
    emails_count = len(lead.emails)
    days_since = 0
    if lead.last_contacted_at:
        days_since = (datetime.utcnow() - lead.last_contacted_at).days
    deal_stage = lead.deals[0].stage if lead.deals else None
    deal_amount = lead.deals[0].amount if lead.deals else None
    score_data = score_lead({
        "name": f"{lead.first_name} {lead.last_name}",
        "email": lead.email,
        "company": lead.company,
        "status": str(lead.status),
        "source": str(lead.source),
        "activities_count": activities_count,
        "emails_count": emails_count,
        "days_since_contact": days_since,
        "deal_stage": str(deal_stage) if deal_stage else None,
        "deal_amount": deal_amount,
    })
    lead.score = score_data.get("score", lead.score)
    lead.is_hot = str(score_data.get("is_hot", False)).lower()
    lead.ai_next_action = score_data.get("next_action")
    db.commit()
    return {"score": lead.score, "is_hot": lead.is_hot, "next_action": lead.ai_next_action}


@router.get("/{lead_id}/next-actions")
def get_next_actions(lead_id: UUID, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    actions = suggest_next_actions({
        "name": f"{lead.first_name} {lead.last_name}",
        "status": str(lead.status),
        "days_since_contact": (datetime.utcnow() - lead.last_contacted_at).days if lead.last_contacted_at else 999,
        "score": lead.score,
    })
    return {"actions": actions}
