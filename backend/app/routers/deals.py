from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models.deal import Deal
from app.schemas.deal import DealCreate, DealUpdate, DealResponse

router = APIRouter(prefix="/api/deals", tags=["Deals"])


@router.get("", response_model=List[DealResponse])
def list_deals(stage: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Deal)
    if stage:
        query = query.filter(Deal.stage == stage)
    return query.order_by(Deal.created_at.desc()).all()


@router.get("/{deal_id}", response_model=DealResponse)
def get_deal(deal_id: UUID, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal


@router.post("", response_model=DealResponse)
def create_deal(deal_in: DealCreate, db: Session = Depends(get_db)):
    deal = Deal(**deal_in.model_dump())
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return deal


@router.put("/{deal_id}", response_model=DealResponse)
def update_deal(deal_id: UUID, deal_in: DealUpdate, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    for field, value in deal_in.model_dump(exclude_unset=True).items():
        setattr(deal, field, value)
    deal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(deal)
    return deal


@router.patch("/{deal_id}/stage")
def update_deal_stage(deal_id: UUID, stage: str, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    deal.stage = stage
    deal.updated_at = datetime.utcnow()
    db.commit()
    return {"id": str(deal.id), "stage": stage}


@router.delete("/{deal_id}")
def delete_deal(deal_id: UUID, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()
    return {"message": "Deal deleted"}


@router.get("/stats/pipeline")
def get_pipeline_stats(db: Session = Depends(get_db)):
    deals = db.query(Deal).all()
    stages = {}
    for deal in deals:
        stage = str(deal.stage)
        if stage not in stages:
            stages[stage] = {"count": 0, "total_amount": 0}
        stages[stage]["count"] += 1
        try:
            stages[stage]["total_amount"] += float(deal.amount or 0)
        except (ValueError, TypeError):
            pass
    return {"stages": stages, "total_deals": len(deals)}
