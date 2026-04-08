from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.integrations.zoho_crm import ZohoCRMClient
from app.integrations.zoho_books import ZohoBooksClient
from app.integrations.outlook import OutlookClient
from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.deal import Deal, DealStage
from app.models.contact import Contact
from app.utils.seeder import seed_database
from datetime import datetime

router = APIRouter(prefix="/api/integrations", tags=["Integrations"])


async def _sync_zoho_leads(db: Session):
    client = ZohoCRMClient(db)
    if not client.is_connected():
        return
    zoho_leads = await client.get_leads()
    for zl in zoho_leads:
        zoho_id = zl.get("id")
        if not zoho_id:
            continue
        existing = db.query(Lead).filter(Lead.zoho_lead_id == zoho_id).first()
        if existing:
            # Update status
            existing.updated_at = datetime.utcnow()
        else:
            lead = Lead(
                first_name=zl.get("First_Name", ""),
                last_name=zl.get("Last_Name", ""),
                email=zl.get("Email"),
                phone=zl.get("Phone"),
                company=zl.get("Company"),
                title=zl.get("Title"),
                source=LeadSource.zoho,
                zoho_lead_id=zoho_id,
            )
            db.add(lead)
    db.commit()


async def _sync_zoho_deals(db: Session):
    client = ZohoCRMClient(db)
    if not client.is_connected():
        return
    zoho_deals = await client.get_deals()
    stage_map = {
        "Qualification": DealStage.contacted,
        "Value Proposition": DealStage.proposal,
        "Needs Analysis": DealStage.contacted,
        "Identify Decision Makers": DealStage.contacted,
        "Perception Analysis": DealStage.proposal,
        "Proposal/Price Quote": DealStage.proposal,
        "Negotiation/Review": DealStage.negotiation,
        "Closed Won": DealStage.won,
        "Closed Lost": DealStage.lost,
    }
    for zd in zoho_deals:
        zoho_id = zd.get("id")
        if not zoho_id:
            continue
        existing = db.query(Deal).filter(Deal.zoho_deal_id == zoho_id).first()
        if not existing:
            stage = stage_map.get(zd.get("Stage", ""), DealStage.new)
            deal = Deal(
                title=zd.get("Deal_Name", "Untitled Deal"),
                stage=stage,
                amount=str(zd.get("Amount", "")),
                zoho_deal_id=zoho_id,
            )
            db.add(deal)
    db.commit()


def _sync_all_background(db: Session):
    import asyncio
    loop = asyncio.new_event_loop()
    loop.run_until_complete(_sync_zoho_leads(db))
    loop.run_until_complete(_sync_zoho_deals(db))
    loop.close()


@router.post("/sync")
def sync_integrations(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger full sync from Zoho CRM"""
    background_tasks.add_task(_sync_all_background, db)
    return {"message": "Sync started in background"}


@router.get("/zoho/invoices")
async def get_zoho_invoices(customer_name: Optional[str] = None, db: Session = Depends(get_db)):
    client = ZohoBooksClient(db)
    if not client.is_connected():
        return {"invoices": [], "message": "Zoho Books not connected"}
    invoices = await client.get_invoices(customer_name=customer_name)
    return {"invoices": invoices}


@router.get("/zoho/customers")
async def get_zoho_customers(db: Session = Depends(get_db)):
    client = ZohoBooksClient(db)
    if not client.is_connected():
        return {"customers": [], "message": "Zoho Books not connected"}
    customers = await client.get_customers()
    return {"customers": customers}


@router.post("/seed")
def seed_app_data(db: Session = Depends(get_db)):
    """Seed the database with sample data"""
    return seed_database(db)
