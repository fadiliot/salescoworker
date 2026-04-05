from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models.activity import Activity
from app.schemas.activity import ActivityCreate, ActivityResponse
from app.integrations.yeastar import YeastarClient

router = APIRouter(prefix="/api/activities", tags=["Activities"])

yeastar = YeastarClient()


@router.get("", response_model=List[ActivityResponse])
def list_activities(
    lead_id: Optional[UUID] = None,
    activity_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Activity)
    if lead_id:
        query = query.filter(Activity.lead_id == lead_id)
    if activity_type:
        query = query.filter(Activity.activity_type == activity_type)
    return query.order_by(Activity.occurred_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=ActivityResponse)
def create_activity(act_in: ActivityCreate, db: Session = Depends(get_db)):
    data = act_in.model_dump()
    if not data.get("occurred_at"):
        data["occurred_at"] = datetime.utcnow()
    activity = Activity(**data)
    db.add(activity)
    # Update lead last contacted
    if activity.lead_id:
        from app.models.lead import Lead
        lead = db.query(Lead).filter(Lead.id == activity.lead_id).first()
        if lead:
            lead.last_contacted_at = datetime.utcnow()
    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/{activity_id}")
def delete_activity(activity_id: UUID, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(activity)
    db.commit()
    return {"message": "Activity deleted"}


@router.get("/calls/recent")
async def get_recent_calls():
    """Fetch recent call logs from Yeastar PBX"""
    if not yeastar.is_configured():
        return {"calls": [], "message": "Yeastar PBX not configured"}
    calls = await yeastar.get_call_logs(limit=20)
    return {"calls": calls}


@router.get("/calls/active")
async def get_active_calls():
    """Get currently active calls from Yeastar PBX"""
    if not yeastar.is_configured():
        return {"active_calls": [], "message": "Yeastar PBX not configured"}
    calls = await yeastar.get_active_calls()
    return {"active_calls": calls}


@router.post("/calls/dial")
async def click_to_call(caller_ext: str, callee_number: str):
    """Initiate a call via Yeastar PBX click-to-dial"""
    if not yeastar.is_configured():
        raise HTTPException(status_code=503, detail="Yeastar PBX not configured")
    success = await yeastar.click_to_call(caller_ext, callee_number)
    if success:
        return {"message": f"Call initiated from {caller_ext} to {callee_number}"}
    raise HTTPException(status_code=500, detail="Failed to initiate call")


@router.post("/calls/analyze")
async def analyze_recent_calls(lead_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Fetch recent Yeastar CDRs, run Gemini analysis, and log Activity + Reminder rows"""
    if not yeastar.is_configured():
        return {"analyzed": 0, "message": "Yeastar PBX not configured"}
    from app.ai.call_analyzer import analyze_call
    cdrs = await yeastar.get_recent_cdrs(limit=5)
    results = []
    for cdr in cdrs:
        result = await analyze_call(db, cdr, lead_id=lead_id)
        results.append(result)
    return {"analyzed": len(results), "results": results}

