from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models.email import Email, EmailDirection
from app.models.lead import Lead
from app.schemas.email import EmailResponse, SendEmailRequest, SuggestReplyRequest
from app.integrations.outlook import OutlookClient
from app.ai.email_analyzer import analyze_email, extract_lead_from_email
from app.ai.reply_generator import generate_reply

router = APIRouter(prefix="/api/emails", tags=["Emails"])


def _sync_outlook_emails(db: Session):
    """Background task: fetch Outlook inbox and save new emails to DB"""
    client = OutlookClient(db)
    import asyncio
    loop = asyncio.new_event_loop()
    messages = loop.run_until_complete(client.get_messages(top=30))
    loop.close()
    for msg in messages:
        msg_id = msg.get("id")
        if not msg_id:
            continue
        exists = db.query(Email).filter(Email.outlook_message_id == msg_id).first()
        if exists:
            continue
        from_addr = msg.get("from", {}).get("emailAddress", {}).get("address", "")
        subject = msg.get("subject", "")
        body_text = msg.get("body", {}).get("content", "")
        body_text_stripped = body_text[:5000]
        analysis = analyze_email(subject, body_text_stripped, from_addr)
        email = Email(
            from_address=from_addr,
            to_address=str(msg.get("toRecipients", [])),
            subject=subject,
            body_text=body_text_stripped,
            direction=EmailDirection.inbound,
            is_read=msg.get("isRead", False),
            outlook_message_id=msg_id,
            outlook_thread_id=msg.get("conversationId"),
            received_at=datetime.fromisoformat(msg["receivedDateTime"].replace("Z", "+00:00"))
            if msg.get("receivedDateTime") else None,
            ai_summary=analysis.get("summary"),
            sentiment=analysis.get("sentiment"),
        )
        db.add(email)
    db.commit()


@router.get("", response_model=List[EmailResponse])
def list_emails(
    lead_id: Optional[UUID] = None,
    direction: Optional[str] = None,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Email)
    if lead_id:
        query = query.filter(Email.lead_id == lead_id)
    if direction:
        query = query.filter(Email.direction == direction)
    if unread_only:
        query = query.filter(Email.is_read == False)
    return query.order_by(Email.received_at.desc(), Email.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{email_id}", response_model=EmailResponse)
def get_email(email_id: UUID, db: Session = Depends(get_db)):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    return email


@router.post("/sync")
def sync_emails(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger Outlook inbox sync in background"""
    background_tasks.add_task(_sync_outlook_emails, db)
    return {"message": "Email sync started"}


@router.post("/{email_id}/suggest-reply")
def suggest_reply(email_id: UUID, db: Session = Depends(get_db)):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    reply = generate_reply(
        subject=email.subject or "",
        body=email.body_text or "",
        from_address=email.from_address or "",
    )
    email.ai_suggested_reply = reply
    db.commit()
    return {"suggested_reply": reply}


@router.post("/{email_id}/send-reply")
async def send_reply(email_id: UUID, body: str, db: Session = Depends(get_db)):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    client = OutlookClient(db)
    success = await client.send_email(
        to=email.from_address,
        subject=f"Re: {email.subject}",
        body=body,
        reply_to_id=email.outlook_message_id,
    )
    if success:
        out_email = Email(
            lead_id=email.lead_id,
            from_address="me",
            to_address=email.from_address,
            subject=f"Re: {email.subject}",
            body_text=body,
            direction=EmailDirection.outbound,
            is_read=True,
        )
        db.add(out_email)
        db.commit()
        return {"message": "Reply sent"}
    raise HTTPException(status_code=500, detail="Failed to send email via Outlook")


@router.post("/send")
async def send_email(req: SendEmailRequest, db: Session = Depends(get_db)):
    client = OutlookClient(db)
    success = await client.send_email(to=req.to, subject=req.subject, body=req.body)
    if success:
        email = Email(
            lead_id=req.lead_id,
            to_address=req.to,
            subject=req.subject,
            body_text=req.body,
            direction=EmailDirection.outbound,
            is_read=True,
        )
        db.add(email)
        db.commit()
        return {"message": "Email sent"}
    raise HTTPException(status_code=500, detail="Failed to send email")


@router.post("/{email_id}/extract-lead")
def extract_lead(email_id: UUID, db: Session = Depends(get_db)):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    lead_data = extract_lead_from_email(
        subject=email.subject or "",
        body=email.body_text or "",
        from_address=email.from_address or "",
    )
    if lead_data:
        return {"extracted": True, "lead": lead_data}
    return {"extracted": False}
