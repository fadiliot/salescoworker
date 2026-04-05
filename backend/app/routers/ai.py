"""
AI Router — Tear Sheet + existing pipeline insight endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.integrations.outlook import OutlookClient
from app.models.email import Email
from app.models.activity import Activity, ActivityType
from app.models.contact import Contact
from app.models.deal import Deal
import json

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.get("/upcoming-meetings")
async def get_upcoming_meetings(db: Session = Depends(get_db)):
    """Fetch upcoming Outlook calendar events for the Meetings widget"""
    client = OutlookClient(db)
    try:
        events = await client.get_upcoming_events(hours_ahead=48)
        return {"events": events}
    except Exception:
        return {"events": []}


@router.get("/tear-sheet/{event_id}")
async def get_tear_sheet(event_id: str, attendee_emails: str = "", db: Session = Depends(get_db)):
    """
    Generate a 4-bullet Gemini briefing for a meeting.
    attendee_emails: comma-separated list of attendee email addresses.
    """
    from app.config import get_settings
    import google.generativeai as genai

    settings = get_settings()
    emails_list = [e.strip() for e in attendee_emails.split(",") if e.strip()]

    # Gather context: emails, call activities, deals
    context_parts = []
    for email_addr in emails_list[:3]:  # cap at 3 attendees for token budget
        # Recent emails from/to this person
        recent_emails = db.query(Email).filter(
            (Email.from_address.ilike(f"%{email_addr}%")) |
            (Email.to_address.ilike(f"%{email_addr}%"))
        ).order_by(Email.received_at.desc()).limit(3).all()

        for e in recent_emails:
            context_parts.append(f"Email [{e.received_at}] {e.from_address}: {e.subject} — {(e.ai_summary or e.body_text or '')[:200]}")

        # Recent call activities linked to contacts with this email
        contact = db.query(Contact).filter(Contact.email.ilike(f"%{email_addr}%")).first()
        if contact and contact.lead_id:
            calls = db.query(Activity).filter(
                Activity.lead_id == contact.lead_id,
                Activity.activity_type == ActivityType.call
            ).order_by(Activity.occurred_at.desc()).limit(2).all()
            for c in calls:
                context_parts.append(f"Call [{c.occurred_at}] {c.title}: {c.description or ''} Sentiment: {c.outcome or 'unknown'}")

            # Open deals
            deals = db.query(Deal).filter(Deal.lead_id == contact.lead_id).limit(2).all()
            for d in deals:
                context_parts.append(f"Deal: {d.title} | Stage: {d.stage} | Value: AED {d.amount or 0:,}")

    if not context_parts:
        return {
            "event_id": event_id,
            "brief": [
                "No prior history found for attendees in this system.",
                "This appears to be a first-contact meeting.",
                "Research attendee company before joining.",
                "Prepare discovery questions around their key pain points.",
            ]
        }

    context_text = "\n".join(context_parts)
    prompt = (
        f"You are a sales intelligence assistant. Based on this history with the prospect:\n\n"
        f"{context_text}\n\n"
        f"Write EXACTLY 4 bullet-point insights for the sales agent to review 15 minutes before their meeting. "
        f"Each bullet must be specific, actionable, and under 20 words. "
        f"Format: return only a JSON array of 4 strings."
    )

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY or "")
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()
        if "```" in text:
            text = text.split("```")[1].replace("json", "").strip()
        bullets = json.loads(text)
        return {"event_id": event_id, "brief": bullets[:4]}
    except Exception:
        return {
            "event_id": event_id,
            "brief": [
                f"History found for {len(emails_list)} attendee(s) — review email threads.",
                "Check open deals and their current stage before joining.",
                "Last touchpoint and sentiment logged in Activities.",
                "Prepare relevant case studies and pricing flexibility.",
            ]
        }


@router.get("/pipeline-insights")
def pipeline_insights(db: Session = Depends(get_db)):
    from app.models.lead import Lead
    from app.models.deal import Deal
    from app.ai.insights import get_pipeline_insights
    from datetime import datetime

    leads = db.query(Lead).all()
    deals = db.query(Deal).all()
    stages = {}
    for d in deals:
        stage = str(d.stage)
        stages[stage] = stages.get(stage, 0) + 1

    hot = sum(1 for l in leads if str(l.is_hot).lower() == "true")
    contacted = [l for l in leads if l.last_contacted_at]
    avg_hours = 0.0
    if contacted:
        deltas = [(datetime.utcnow() - l.last_contacted_at).total_seconds() / 3600 for l in contacted]
        avg_hours = sum(deltas) / len(deltas)
    won = sum(1 for d in deals if str(d.stage) == "won")
    win_rate = won / len(deals) if deals else 0

    return get_pipeline_insights(len(leads), hot, stages, avg_hours, win_rate)


@router.post("/score-all-leads")
def score_all_leads(db: Session = Depends(get_db)):
    from app.models.lead import Lead
    from app.ai.lead_scorer import score_lead
    from datetime import datetime
    leads = db.query(Lead).all()
    updated = 0
    for lead in leads:
        data = {
            "name": f"{lead.first_name} {lead.last_name}",
            "email": lead.email, "company": lead.company,
            "status": str(lead.status), "source": str(lead.source),
            "activities_count": len(lead.activities),
            "emails_count": len(lead.emails),
            "days_since_contact": (datetime.utcnow() - lead.last_contacted_at).days if lead.last_contacted_at else 999,
        }
        result = score_lead(data)
        lead.score = result.get("score", lead.score)
        lead.is_hot = str(result.get("is_hot", False)).lower()
        updated += 1
    db.commit()
    return {"updated": updated}


@router.post("/generate-followup")
def generate_followup(data: dict, db: Session = Depends(get_db)):
    from app.ai.reply_generator import generate_reply
    return generate_reply(data)
