from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.agent import AgentLog, AgentConfig, ApprovalQueue
from app.agent.core import AgentCore
from app.integrations.outlook import OutlookClient

router = APIRouter(prefix="/api/agent", tags=["Agent"])

@router.get("/logs")
def get_agent_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Fetch the latest shadow activity logs"""
    return db.query(AgentLog).order_by(AgentLog.created_at.desc()).limit(limit).all()

@router.get("/config")
def get_agent_config(db: Session = Depends(get_db)):
    """Fetch current workflow configurations"""
    return db.query(AgentConfig).all()

@router.post("/config/{workflow_name}")
def toggle_workflow(workflow_name: str, enabled: bool, db: Session = Depends(get_db)):
    """Enable or disable a specific workflow"""
    config = db.query(AgentConfig).filter(AgentConfig.workflow_name == workflow_name).first()
    if not config:
        config = AgentConfig(workflow_name=workflow_name, is_enabled=enabled)
        db.add(config)
    else:
        config.is_enabled = enabled
    db.commit()
    return {"status": "success", "workflow": workflow_name, "enabled": enabled}

@router.get("/approval-queue")
def get_approval_queue(db: Session = Depends(get_db)):
    """Fetch pending AI drafts for review"""
    return db.query(ApprovalQueue).filter(ApprovalQueue.status == "pending").all()

@router.post("/approval-queue/{item_id}/approve")
async def approve_draft(item_id: str, db: Session = Depends(get_db)):
    """Approve a draft and send it via Outlook"""
    item = db.query(ApprovalQueue).filter(ApprovalQueue.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    # Trigger Outlook Send
    try:
        recipient = item.metadata_json.get("recipient")
        if recipient:
            outlook = OutlookClient(db)
            await outlook.send_email(
                to_address=recipient,
                subject=item.subject,
                body=item.content
            )
        
        item.status = "approved"
        db.commit()
        
        # Log success
        core = AgentCore(db)
        core.log_activity(f"Approved and sent: {item.subject}", workflow=item.source)
        
        return {"status": "success", "message": "Draft sent successfully"}
    except Exception as e:
        item.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger")
async def trigger_workflow(workflow_name: str, db: Session = Depends(get_db)):
    """Manually trigger a workflow for testing or demo"""
    core = AgentCore(db)
    if workflow_name == "daily_briefing":
        await core.run_daily_briefing()
    elif workflow_name == "lead_reactivation":
        await core.run_lead_reactivation()
    else:
        raise HTTPException(status_code=400, detail="Unknown workflow")
    
    return {"status": "success", "message": f"Workflow {workflow_name} triggered"}
