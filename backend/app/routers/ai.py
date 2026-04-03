from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from app.database import get_db
from app.models.lead import Lead
from app.models.email import Email
from app.models.deal import Deal
from app.ai.email_analyzer import analyze_email
from app.ai.reply_generator import generate_reply, generate_followup
from app.ai.lead_scorer import score_lead, batch_score_leads
from app.ai.insights import get_pipeline_insights, suggest_next_actions
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/ai", tags=["AI"])


class AnalyzeEmailRequest(BaseModel):
    subject: str
    body: str
    from_address: str


class GenerateReplyRequest(BaseModel):
    subject: str
    body: str
    from_address: str
    context: Optional[str] = None
    agent_name: Optional[str] = "Sales Team"


class GenerateFollowupRequest(BaseModel):
    lead_name: str
    last_activity: str
    deal_stage: Optional[str] = "new"
    agent_name: Optional[str] = "Sales Team"


@router.post("/analyze-email")
def analyze_email_endpoint(req: AnalyzeEmailRequest):
    """Analyze an email and return summary, sentiment, extracted lead"""
    result = analyze_email(req.subject, req.body, req.from_address)
    return result


@router.post("/generate-reply")
def generate_reply_endpoint(req: GenerateReplyRequest):
    """Generate an AI reply for a given email"""
    reply = generate_reply(
        subject=req.subject,
        body=req.body,
        from_address=req.from_address,
        agent_name=req.agent_name or "Sales Team",
        context=req.context,
    )
    return {"reply": reply}


@router.post("/generate-followup")
def generate_followup_endpoint(req: GenerateFollowupRequest):
    """Generate an AI follow-up email"""
    followup = generate_followup(
        lead_name=req.lead_name,
        last_activity=req.last_activity,
        deal_stage=req.deal_stage or "new",
        agent_name=req.agent_name or "Sales Team",
    )
    return {"followup": followup}


@router.post("/score-lead/{lead_id}")
def score_lead_endpoint(lead_id: UUID, db: Session = Depends(get_db)):
    """Score a specific lead using AI"""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    days_since = 0
    if lead.last_contacted_at:
        days_since = (datetime.utcnow() - lead.last_contacted_at).days
    deal_stage = str(lead.deals[0].stage) if lead.deals else None
    deal_amount = lead.deals[0].amount if lead.deals else None
    score_data = score_lead({
        "name": f"{lead.first_name} {lead.last_name}",
        "email": lead.email,
        "company": lead.company,
        "status": str(lead.status),
        "source": str(lead.source),
        "activities_count": len(lead.activities),
        "emails_count": len(lead.emails),
        "days_since_contact": days_since,
        "deal_stage": deal_stage,
        "deal_amount": deal_amount,
    })
    lead.score = score_data.get("score", lead.score)
    lead.is_hot = str(score_data.get("is_hot", False)).lower()
    lead.ai_next_action = score_data.get("next_action")
    db.commit()
    return score_data


@router.post("/score-all-leads")
def score_all_leads(db: Session = Depends(get_db)):
    """Batch score all leads"""
    leads = db.query(Lead).all()
    for lead in leads:
        days_since = 0
        if lead.last_contacted_at:
            days_since = (datetime.utcnow() - lead.last_contacted_at).days
        score_data = score_lead({
            "name": f"{lead.first_name} {lead.last_name}",
            "email": lead.email,
            "company": lead.company,
            "status": str(lead.status),
            "source": str(lead.source),
            "activities_count": len(lead.activities),
            "emails_count": len(lead.emails),
            "days_since_contact": days_since,
        })
        lead.score = score_data.get("score", 0)
        lead.is_hot = str(score_data.get("is_hot", False)).lower()
        lead.ai_next_action = score_data.get("next_action")
    db.commit()
    return {"scored": len(leads), "message": "All leads scored"}


@router.get("/pipeline-insights")
def pipeline_insights_endpoint(db: Session = Depends(get_db)):
    """Get AI-powered pipeline insights"""
    total_leads = db.query(Lead).count()
    hot_leads = db.query(Lead).filter(Lead.is_hot == "true").count()
    deals = db.query(Deal).all()
    stages: dict = {}
    for deal in deals:
        s = str(deal.stage)
        stages[s] = stages.get(s, 0) + 1
    won = stages.get("won", 0)
    total_closed = won + stages.get("lost", 0)
    win_rate = won / total_closed if total_closed > 0 else 0
    insights = get_pipeline_insights(
        total_leads=total_leads,
        hot_leads=hot_leads,
        deals_by_stage=stages,
        avg_response_time_hours=8.0,  # TODO: calculate from activities
        win_rate=win_rate,
    )
    return insights
