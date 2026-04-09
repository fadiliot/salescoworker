from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db, engine, Base
from app.models import Lead, Contact, Deal, Email, Activity, IntegrationToken, Reminder, User
from app.routers import leads, deals, emails, activities, reminders, auth, ai, integrations, contacts, agent, meetings, reports, books
from app.config import get_settings
from datetime import datetime

settings = get_settings()

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sales Co-worker API",
    description="AI-powered sales assistant with Zoho CRM, Outlook, and Yeastar PBX integrations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_origin_regex="https://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(leads.router)
app.include_router(deals.router)
app.include_router(emails.router)
app.include_router(activities.router)
app.include_router(reminders.router)
app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(integrations.router)
app.include_router(contacts.router)
app.include_router(agent.router)
app.include_router(meetings.router)
app.include_router(reports.router)
app.include_router(books.router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Sales Co-worker API v1.0",
    }


@app.get("/api/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    """Aggregated stats for the dashboard"""
    from app.models.lead import LeadStatus
    from app.models.deal import DealStage
    from sqlalchemy import func

    total_leads = db.query(Lead).count()
    hot_leads = db.query(Lead).filter(Lead.is_hot == "true").count()
    new_leads_count = db.query(Lead).filter(Lead.status == LeadStatus.new).count()
    total_deals = db.query(Deal).count()
    won_deals = db.query(Deal).filter(Deal.stage == DealStage.won).count()
    total_emails = db.query(Email).count()
    unread_emails = db.query(Email).filter(Email.is_read == False).count()
    pending_reminders = db.query(Reminder).filter(
        Reminder.is_completed == False,
        Reminder.due_at >= datetime.utcnow()
    ).count()
    overdue_reminders = db.query(Reminder).filter(
        Reminder.is_completed == False,
        Reminder.due_at < datetime.utcnow()
    ).count()

    # Recent leads
    recent_leads = db.query(Lead).order_by(Lead.created_at.desc()).limit(5).all()
    # Recent emails
    recent_emails = db.query(Email).order_by(Email.created_at.desc()).limit(5).all()
    # Deal stages
    deal_stages = {}
    for stage in ["new", "contacted", "proposal", "negotiation", "won", "lost"]:
        deal_stages[stage] = db.query(Deal).filter(Deal.stage == stage).count()

    return {
        "summary": {
            "total_leads": total_leads,
            "hot_leads": hot_leads,
            "new_leads": new_leads_count,
            "total_deals": total_deals,
            "won_deals": won_deals,
            "win_rate": round(won_deals / total_deals * 100, 1) if total_deals > 0 else 0,
            "total_emails": total_emails,
            "unread_emails": unread_emails,
            "pending_reminders": pending_reminders,
            "overdue_reminders": overdue_reminders,
        },
        "deal_stages": deal_stages,
        "recent_leads": [
            {
                "id": str(l.id),
                "name": f"{l.first_name} {l.last_name or ''}".strip(),
                "company": l.company,
                "email": l.email,
                "score": l.score,
                "status": str(l.status),
                "is_hot": l.is_hot,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in recent_leads
        ],
        "recent_emails": [
            {
                "id": str(e.id),
                "from": e.from_address,
                "subject": e.subject,
                "summary": e.ai_summary,
                "is_read": e.is_read,
                "received_at": e.received_at.isoformat() if e.received_at else None,
            }
            for e in recent_emails
        ],
    }
