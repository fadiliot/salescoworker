"""
Database Seeder Utility
Refactored from seed.py to be callable via API
"""
from sqlalchemy.orm import Session
from app.models import Lead, Deal, Contact, Email, Activity, Reminder
from app.models.lead import LeadStatus, LeadSource
from app.models.deal import DealStage
from app.models.email import EmailDirection
from app.models.activity import ActivityType
from datetime import datetime, timedelta
import random

def seed_database(db: Session):
    # Clear existing data safely
    db.query(Reminder).delete()
    db.query(Activity).delete()
    db.query(Email).delete()
    db.query(Deal).delete()
    db.query(Lead).delete()
    db.commit()

    # Leads
    leads_data = [
        {"first_name": "Sarah", "last_name": "Chen", "email": "sarah.chen@techcorp.io", "phone": "+1-555-0101", "company": "TechCorp Inc", "title": "VP of Operations", "status": LeadStatus.qualified, "source": LeadSource.email, "score": 85, "is_hot": "true"},
        {"first_name": "Marcus", "last_name": "Williams", "email": "m.williams@finova.com", "phone": "+1-555-0102", "company": "Finova Capital", "title": "CFO", "status": LeadStatus.proposal, "source": LeadSource.referral, "score": 72, "is_hot": "true"},
        {"first_name": "Priya", "last_name": "Patel", "email": "priya@growthlab.co", "phone": "+1-555-0103", "company": "GrowthLab", "title": "CEO", "status": LeadStatus.contacted, "source": LeadSource.website, "score": 61, "is_hot": "false"},
        {"first_name": "James", "last_name": "O'Brien", "email": "jobrien@retailmax.com", "phone": "+1-555-0104", "company": "RetailMax", "title": "Procurement Manager", "status": LeadStatus.new, "source": LeadSource.linkedin, "score": 45, "is_hot": "false"},
        {"first_name": "Aisha", "last_name": "Diallo", "email": "aisha.d@scalex.ai", "phone": "+1-555-0105", "company": "ScaleX AI", "title": "CTO", "status": LeadStatus.negotiation, "source": LeadSource.email, "score": 91, "is_hot": "true"},
        {"first_name": "David", "last_name": "Kim", "email": "dkim@nexacloud.com", "phone": "+1-555-0110", "company": "NexaCloud", "title": "Founder & CEO", "status": LeadStatus.proposal, "source": LeadSource.linkedin, "score": 79, "is_hot": "true"},
    ]

    created_leads = []
    for ld in leads_data:
        lead = Lead(
            **ld,
            notes="Auto-generated seed data",
            last_contacted_at=datetime.utcnow() - timedelta(days=random.randint(0, 14)),
            ai_next_action="Schedule a discovery call to understand their requirements.",
        )
        db.add(lead)
        created_leads.append(lead)
    db.flush()

    # Deals
    deals_data = [
        {"title": "TechCorp Enterprise License", "stage": DealStage.proposal, "amount": "45000", "probability": "70"},
        {"title": "Finova Capital Integration Suite", "stage": DealStage.negotiation, "amount": "120000", "probability": "85"},
        {"title": "ScaleX AI Platform Deal", "stage": DealStage.negotiation, "amount": "95000", "probability": "90"},
        {"title": "NexaCloud Annual Contract", "stage": DealStage.proposal, "amount": "62000", "probability": "65"},
    ]

    for i, dd in enumerate(deals_data):
        deal = Deal(
            **dd,
            lead_id=created_leads[i % len(created_leads)].id,
            close_date=datetime.utcnow() + timedelta(days=random.randint(10, 60)),
            currency="USD",
        )
        db.add(deal)

    # Emails
    emails_data = [
        {"from_address": "sarah.chen@techcorp.io", "subject": "Re: Enterprise License Pricing", "body_text": "Hi, I reviewed the proposal. Can we schedule a call?", "ai_summary": "Sarah wants to discuss implementation timeline.", "sentiment": "positive", "is_read": False},
        {"from_address": "m.williams@finova.com", "subject": "Urgent: Contract Terms Review", "body_text": "Legal team flagged contract clauses 4.2 and 7.1.", "ai_summary": "Legal team needs clarification on clauses 4.2 and 7.1.", "sentiment": "neutral", "is_read": False},
        {"from_address": "dkim@nexacloud.com", "subject": "Interested in your platform", "body_text": "We're a cloud startup looking for a CRM solution.", "ai_summary": "David Kim from NexaCloud is interested in CRM pricing.", "sentiment": "positive", "is_read": False},
    ]

    for i, ed in enumerate(emails_data):
        email = Email(
            lead_id=created_leads[i % len(created_leads)].id,
            to_address="sales@company.com",
            direction=EmailDirection.inbound,
            received_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72)),
            **ed,
        )
        db.add(email)

    # Reminders
    reminders_data = [
        {"title": "Call Sarah Chen re: timeline", "message": "Follow up on implementation timeline discussion", "due_at": datetime.utcnow() + timedelta(hours=2)},
        {"title": "Send revised contract to Finova", "message": "Address sections 4.2 and 7.1 raised by legal", "due_at": datetime.utcnow() + timedelta(hours=5)},
    ]

    for i, rd in enumerate(reminders_data):
        reminder = Reminder(
            lead_id=created_leads[i % len(created_leads)].id,
            **rd,
        )
        db.add(reminder)

    db.commit()
    return {"status": "success", "message": f"Seeded {len(leads_data)} leads, {len(deals_data)} deals, and more."}
