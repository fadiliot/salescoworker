"""
Agent Core Module
Handles the logical execution of autonomous sales workflows.
"""
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json

from app.models.agent import AgentLog, AgentConfig, ApprovalQueue
from app.models.lead import Lead, LeadStatus
from app.models.deal import Deal
from app.models.email import Email
from app.models.activity import Activity, ActivityType
from app.integrations.google_client import GoogleClient
from app.integrations.outlook import OutlookClient
from app.integrations.zoho_crm import ZohoCRMClient

class AgentCore:
    def __init__(self, db: Session):
        self.db = db

    def log_activity(self, message: str, workflow: str = None):
        """Log an action to the Shadow Activity Feed"""
        log = AgentLog(message=message, workflow_name=workflow)
        self.db.add(log)
        self.db.commit()

    def add_to_approval(self, source: str, subject: str, content: str, recipient: str = None):
        """Add a drafted item to the Human-in-the-Loop Approval Queue"""
        item = ApprovalQueue(
            source=source,
            subject=subject,
            content=content,
            metadata_json={"recipient": recipient} if recipient else {}
        )
        self.db.add(item)
        self.db.commit()
        self.log_activity(f"Generated draft: {subject}", workflow=source)

    def is_enabled(self, workflow_name: str) -> bool:
        """Check if a specific workflow is enabled in the config"""
        config = self.db.query(AgentConfig).filter(AgentConfig.workflow_name == workflow_name).first()
        if not config:
            # Default to enabled if not set
            new_config = AgentConfig(workflow_name=workflow_name, is_enabled=True)
            self.db.add(new_config)
            self.db.commit()
            return True
        return config.is_enabled

    # --- Workflow 1: Daily Briefing ---
    async def run_daily_briefing(self):
        if not self.is_enabled("daily_briefing"): return
        
        self.log_activity("Starting Daily Briefing scan", workflow="daily_briefing")
        google = GoogleClient(self.db)
        meetings = await google.get_upcoming_meetings(hours_ahead=12) # Just for today
        
        if not meetings:
            self.log_activity("No meetings today. No briefing needed.", workflow="daily_briefing")
            return

        briefing_items = []
        for meeting in meetings:
            subject = meeting.get("summary") or meeting.get("subject")
            attendees = meeting.get("attendees", [])
            
            # Simple logic: pick the first attendee to look up in Zoho
            lead_info = "New Prospect"
            if attendees:
                email = attendees[0] if isinstance(attendees[0], str) else attendees[0].get("email")
                lead = self.db.query(Lead).filter(Lead.email == email).first()
                if lead:
                    deal = self.db.query(Deal).filter(Deal.lead_id == lead.id).first()
                    lead_info = f"Lead: {lead.first_name} {lead.last_name} ({lead.company}). Deal: {deal.title if deal else 'No active deal'}"

            briefing_items.append(f"- {subject}: {lead_info}")

        battle_plan = "### Today's Battle Plan\n\n" + "\n".join(briefing_items)
        self.add_to_approval("Daily Briefing", f"Daily Briefing: {datetime.now().strftime('%Y-%m-%d')}", battle_plan)

    # --- Workflow 2: Lead Reactivation ---
    async def run_lead_reactivation(self):
        if not self.is_enabled("lead_reactivation"): return
        
        self.log_activity("Scanning for inactive leads (5+ days)", workflow="lead_reactivation")
        five_days_ago = datetime.utcnow() - timedelta(days=5)
        
        # Find leads with no recent activity
        inactive_leads = self.db.query(Lead).filter(
            Lead.updated_at < five_days_ago,
            Lead.status != LeadStatus.won,
            Lead.status != LeadStatus.lost
        ).all()
        
        for lead in inactive_leads:
            self.log_activity(f"Detected inactive lead: {lead.first_name} {lead.last_name}", workflow="lead_reactivation")
            nudge_content = f"Hi {lead.first_name},\n\nHope you're having a great week at {lead.company}. I wanted to check in and see if you have any updates regarding our last discussion."
            self.add_to_approval("Lead Reactivation", f"Checking in - {lead.company}", nudge_content, recipient=lead.email)

    # --- Workflow 3: Autonomous Scheduler ---
    async def run_autonomous_scheduler(self):
        if not self.is_enabled("autonomous_scheduler"): return
        
        self.log_activity("Scanning inbox for meeting requests", workflow="autonomous_scheduler")
        outlook = OutlookClient(self.db)
        emails = await outlook.get_messages(limit=10) # Get recent messages
        
        for email in emails:
            # Simple keyword detection for "meet", "schedule", "available"
            body = (email.get("bodyContent", "") or "").lower()
            if "meet" in body or "schedule" in body or "available" in body:
                sender = email.get("fromAddress")
                subject = email.get("subject")
                self.log_activity(f"Detected meeting request from {sender}", workflow="autonomous_scheduler")
                
                content = f"Hi,\n\nI'd be happy to schedule a meeting. Here are a few slots where I'm available next week:\n- Monday 10:00 AM\n- Wednesday 2:00 PM\n- Thursday 11:00 AM\n\nLet me know which works for you!"
                self.add_to_approval("Autonomous Scheduler", f"Re: {subject}", content, recipient=sender)

    # --- Workflow 4: Post-Meeting Cleanup ---
    async def run_post_meeting_cleanup(self):
        if not self.is_enabled("post_meeting_cleanup"): return
        
        self.log_activity("Checking for recently ended meetings requiring updates", workflow="post_meeting_cleanup")
        google = GoogleClient(self.db)
        # Fetch meetings that ended in the last 24 hours
        now = datetime.utcnow()
        yesterday = now - timedelta(days=1)
        meetings = await google.get_upcoming_meetings(hours_back=24) # We need to update google_client to support hours_back
        
        for meeting in meetings:
            # Check if this meeting already has a corresponding Activity in Zoho (lead_id + date)
            # For demo, just draft a reminder to summarize
            subject = meeting.get("summary") or "Meeting"
            self.log_activity(f"Drafting cleanup for: {subject}", workflow="post_meeting_cleanup")
            content = f"Agent Suggestion: You recently finished a meeting '{subject}'. \n\nShould I update the Deal stage to 'Negotiation' and set a follow-up reminder for tomorrow?"
            self.add_to_approval("Post-Meeting Cleanup", f"Post-Meeting Summary: {subject}", content)
