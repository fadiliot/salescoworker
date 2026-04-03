"""
Seed script — populates the database with realistic dummy data
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal, engine
from app.models import Lead, Deal, Contact, Email, Activity, Reminder
from app.models.lead import LeadStatus, LeadSource
from app.models.deal import DealStage
from app.models.email import EmailDirection
from app.models.activity import ActivityType
from datetime import datetime, timedelta
import random

db = SessionLocal()

print("Seeding database...")

# Leads
leads_data = [
    {"first_name": "Sarah", "last_name": "Chen", "email": "sarah.chen@techcorp.io", "phone": "+1-555-0101", "company": "TechCorp Inc", "title": "VP of Operations", "status": LeadStatus.qualified, "source": LeadSource.email, "score": 85, "is_hot": "true"},
    {"first_name": "Marcus", "last_name": "Williams", "email": "m.williams@finova.com", "phone": "+1-555-0102", "company": "Finova Capital", "title": "CFO", "status": LeadStatus.proposal, "source": LeadSource.referral, "score": 72, "is_hot": "true"},
    {"first_name": "Priya", "last_name": "Patel", "email": "priya@growthlab.co", "phone": "+1-555-0103", "company": "GrowthLab", "title": "CEO", "status": LeadStatus.contacted, "source": LeadSource.website, "score": 61, "is_hot": "false"},
    {"first_name": "James", "last_name": "O'Brien", "email": "jobrien@retailmax.com", "phone": "+1-555-0104", "company": "RetailMax", "title": "Procurement Manager", "status": LeadStatus.new, "source": LeadSource.linkedin, "score": 45, "is_hot": "false"},
    {"first_name": "Aisha", "last_name": "Diallo", "email": "aisha.d@scalex.ai", "phone": "+1-555-0105", "company": "ScaleX AI", "title": "CTO", "status": LeadStatus.negotiation, "source": LeadSource.email, "score": 91, "is_hot": "true"},
    {"first_name": "Tom", "last_name": "Hanks", "email": "tom.hanks@movieprod.net", "phone": "+1-555-0106", "company": "Movie Productions", "title": "Director", "status": LeadStatus.won, "source": LeadSource.referral, "score": 98, "is_hot": "false"},
    {"first_name": "Lena", "last_name": "Müller", "email": "lena.muller@autohaus.de", "phone": "+49-555-0107", "company": "AutoHaus GmbH", "title": "General Manager", "status": LeadStatus.contacted, "source": LeadSource.phone, "score": 55, "is_hot": "false"},
    {"first_name": "Carlos", "last_name": "Rivera", "email": "carlos@logipro.mx", "phone": "+52-555-0108", "company": "LogiPro", "title": "Logistics Director", "status": LeadStatus.qualified, "source": LeadSource.website, "score": 68, "is_hot": "false"},
    {"first_name": "Emily", "last_name": "Johnson", "email": "emily.j@healthplus.org", "phone": "+1-555-0109", "company": "HealthPlus", "title": "Procurement Lead", "status": LeadStatus.new, "source": LeadSource.email, "score": 38, "is_hot": "false"},
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
    {"title": "GrowthLab Starter Package", "stage": DealStage.contacted, "amount": "8500", "probability": "40"},
    {"title": "ScaleX AI Platform Deal", "stage": DealStage.negotiation, "amount": "95000", "probability": "90"},
    {"title": "Movie Productions Media Suite", "stage": DealStage.won, "amount": "22000", "probability": "100"},
    {"title": "AutoHaus CRM Deal", "stage": DealStage.new, "amount": "18000", "probability": "20"},
    {"title": "NexaCloud Annual Contract", "stage": DealStage.proposal, "amount": "62000", "probability": "65"},
    {"title": "RetailMax POS Integration", "stage": DealStage.contacted, "amount": "15000", "probability": "35"},
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
    {"from_address": "sarah.chen@techcorp.io", "subject": "Re: Enterprise License Pricing", "body_text": "Hi, I reviewed the proposal. The pricing looks good but I need to discuss the implementation timeline with my team. Can we schedule a call this week?", "ai_summary": "Sarah wants to discuss implementation timeline before committing. Interested in the enterprise package.", "sentiment": "positive", "is_read": False},
    {"from_address": "m.williams@finova.com", "subject": "Urgent: Contract Terms Review", "body_text": "We've reviewed your contract terms. There are a few clauses regarding data privacy and SLA that our legal team has flagged. Can you clarify sections 4.2 and 7.1?", "ai_summary": "Legal team flagged contract clauses 4.2 and 7.1 regarding data privacy and SLA. Needs urgent clarification.", "sentiment": "neutral", "is_read": False},
    {"from_address": "noreply@linkedin.com", "subject": "You have a new connection request", "body_text": "Someone wants to connect with you on LinkedIn.", "ai_summary": "LinkedIn notification about a connection request. Not a sales lead.", "sentiment": "neutral", "is_read": True},
    {"from_address": "dkim@nexacloud.com", "subject": "Interested in your platform", "body_text": "Hello, I came across your platform and I'm very interested. We're a cloud startup looking for a CRM solution. Could you send me pricing info?", "ai_summary": "David Kim from NexaCloud is interested in CRM pricing. Strong lead — startup CEO.", "sentiment": "positive", "is_read": False},
    {"from_address": "aisha.d@scalex.ai", "subject": "Final approval pending board sign-off", "body_text": "Great news! The board loved the demo. We're at the final approval stage. Expecting sign-off by Friday. Please prepare the final contract.", "ai_summary": "Board approved the deal! ScaleX AI is at final approval. Contract needs to be prepared urgently.", "sentiment": "positive", "is_read": False},
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

# Activities
for i, lead in enumerate(created_leads):
    if i >= 6:
        break
    activity = Activity(
        lead_id=lead.id,
        activity_type=random.choice([ActivityType.call, ActivityType.email, ActivityType.meeting]),
        title=f"Follow-up with {lead.first_name}",
        description="Discussed product features and pricing",
        outcome="Positive — moving to next stage",
        occurred_at=datetime.utcnow() - timedelta(days=random.randint(0, 10)),
    )
    db.add(activity)

# Reminders
reminders_data = [
    {"title": "Call Sarah Chen re: timeline", "message": "Follow up on implementation timeline discussion", "due_at": datetime.utcnow() + timedelta(hours=2)},
    {"title": "Send revised contract to Finova", "message": "Address sections 4.2 and 7.1 raised by legal", "due_at": datetime.utcnow() + timedelta(hours=5)},
    {"title": "Demo prep for NexaCloud", "message": "Prepare personalized demo for David Kim", "due_at": datetime.utcnow() + timedelta(days=1)},
    {"title": "Contract prep for ScaleX AI", "message": "Finalize contract terms for ScaleX board approval", "due_at": datetime.utcnow() + timedelta(hours=1)},
    {"title": "Check in with Carlos Rivera", "message": "Follow up on logistics integration requirements", "due_at": datetime.utcnow() + timedelta(days=2)},
]

for i, rd in enumerate(reminders_data):
    reminder = Reminder(
        lead_id=created_leads[i].id,
        **rd,
    )
    db.add(reminder)

db.commit()
print(f"Seeded: {len(leads_data)} leads, {len(deals_data)} deals, {len(emails_data)} emails, 6 activities, {len(reminders_data)} reminders")
db.close()
