from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.deal import Deal, DealStage
from app.models.activity import Activity, ActivityType
from datetime import datetime

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/summary")
def get_reports_summary(db: Session = Depends(get_db)):
    """Aggregated sales analytics for the Reports page"""

    leads = db.query(Lead).all()
    deals = db.query(Deal).all()
    activities = db.query(Activity).all()

    # Pipeline stages
    pipeline_stages: dict = {}
    for stage in ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]:
        stage_deals = [d for d in deals if str(d.stage).replace("DealStage.", "") == stage]
        try:
            total_value = sum(float(d.amount) for d in stage_deals if d.amount and str(d.amount).replace('.', '').isdigit())
        except Exception:
            total_value = 0
        pipeline_stages[stage] = {"count": len(stage_deals), "value": total_value}

    # Revenue forecast (qualified + proposal + negotiation)
    forecast_stages = ["qualified", "proposal", "negotiation"]
    total_revenue_forecast = sum(
        pipeline_stages.get(s, {}).get("value", 0) for s in forecast_stages
    )

    # Lead sources
    lead_sources: dict = {}
    for lead in leads:
        src = str(lead.source).replace("LeadSource.", "")
        lead_sources[src] = lead_sources.get(src, 0) + 1

    # Activity counts
    activity_counts: dict = {}
    for act in activities:
        atype = str(act.activity_type).replace("ActivityType.", "")
        activity_counts[atype] = activity_counts.get(atype, 0) + 1

    # Win rate
    total_deals = len(deals)
    won = sum(1 for d in deals if str(d.stage).replace("DealStage.", "") == "won")
    win_rate = round(won / total_deals * 100, 1) if total_deals > 0 else 0

    # Top leads
    sorted_leads = sorted(leads, key=lambda l: l.score or 0, reverse=True)[:5]
    top_leads = [
        {
            "name": f"{l.first_name} {l.last_name or ''}".strip(),
            "company": l.company or "",
            "score": l.score or 0,
            "status": str(l.status).replace("LeadStatus.", ""),
        }
        for l in sorted_leads
    ]

    return {
        "pipeline_stages": pipeline_stages,
        "lead_sources": lead_sources,
        "activity_counts": activity_counts,
        "total_leads": len(leads),
        "total_deals": total_deals,
        "total_revenue_forecast": total_revenue_forecast,
        "total_activities": len(activities),
        "top_leads": top_leads,
        "win_rate": win_rate,
    }
