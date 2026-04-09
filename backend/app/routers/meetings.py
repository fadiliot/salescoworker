from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app.integrations.zoho_crm import ZohoCRMClient
from app.integrations.outlook import OutlookClient
import os

router = APIRouter(prefix="/api/meetings", tags=["Meetings"])


class GoogleEventCreate(BaseModel):
    subject: str
    start: str
    end: str
    attendees: List[str] = []
    description: Optional[str] = None


class ZohoEventCreate(BaseModel):
    subject: str
    start: str
    end: str
    type: str = "meeting"  # meeting | call | task
    attendees: List[str] = []
    description: Optional[str] = None
    lead_id: Optional[str] = None


@router.get("")
async def get_all_meetings(db: Session = Depends(get_db)):
    """Get merged events from Google Calendar + Microsoft Outlook"""
    events = []

    # Try Outlook calendar
    try:
        outlook = OutlookClient(db)
        if outlook.is_connected():
            ms_events = await outlook.get_calendar_events()
            for ev in (ms_events or []):
                events.append({
                    "id": ev.get("id", ""),
                    "subject": ev.get("subject", "No Title"),
                    "start": ev.get("start", {}).get("dateTime", ""),
                    "end": ev.get("end", {}).get("dateTime", ""),
                    "source": "microsoft",
                    "type": "meeting",
                    "attendees": [a.get("emailAddress", {}).get("address") for a in ev.get("attendees", []) if a.get("emailAddress")],
                    "link": ev.get("onlineMeeting", {}).get("joinUrl"),
                })
    except Exception:
        pass

    # Try Google Calendar
    try:
        from app.integrations.google_client import GoogleClient
        google = GoogleClient(db)
        if google.is_connected():
            g_events = await google.get_calendar_events()
            for ev in (g_events or []):
                events.append({
                    "id": ev.get("id", ""),
                    "subject": ev.get("summary", "No Title"),
                    "start": ev.get("start", {}).get("dateTime", ev.get("start", {}).get("date", "")),
                    "end": ev.get("end", {}).get("dateTime", ev.get("end", {}).get("date", "")),
                    "source": "google",
                    "type": "meeting",
                    "attendees": [a.get("email") for a in ev.get("attendees", []) if a.get("email")],
                    "link": ev.get("hangoutLink") or ev.get("conferenceData", {}).get("entryPoints", [{}])[0].get("uri"),
                })
    except Exception:
        pass

    return {"events": events, "total": len(events)}


@router.post("/google")
async def create_google_event(payload: GoogleEventCreate, db: Session = Depends(get_db)):
    """Create a Google Calendar event with Google Meet link"""
    try:
        from app.integrations.google_client import GoogleClient
        google = GoogleClient(db)
        if not google.is_connected():
            raise HTTPException(status_code=503, detail="Google not connected. Please authenticate via Settings.")
        result = await google.create_calendar_event(
            subject=payload.subject,
            start=payload.start,
            end=payload.end,
            attendees=payload.attendees,
            description=payload.description,
        )
        return {"success": True, "event": result, "link": result.get("hangoutLink")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/zoho")
async def create_zoho_event(payload: ZohoEventCreate, db: Session = Depends(get_db)):
    """Create a Zoho CRM event, task, or call record"""
    try:
        zoho = ZohoCRMClient(db)
        if not zoho.is_connected():
            raise HTTPException(status_code=503, detail="Zoho CRM not connected. Please authenticate via Settings.")

        if payload.type == "call":
            result = await zoho.create_call({
                "Subject": payload.subject,
                "Call_Start_Time": payload.start,
                "Duration": "60",
                "Description": payload.description or "",
                "Who_Id": payload.lead_id,
            })
        elif payload.type == "task":
            result = await zoho.create_task({
                "Subject": payload.subject,
                "Due_Date": payload.start.split("T")[0] if "T" in payload.start else payload.start,
                "Description": payload.description or "",
                "Who_Id": payload.lead_id,
            })
        else:
            # Meeting / Event
            result = await zoho.create_event({
                "Event_Title": payload.subject,
                "Start_DateTime": payload.start,
                "End_DateTime": payload.end,
                "Description": payload.description or "",
                "Who_Id": payload.lead_id,
            })

        return {"success": True, "type": payload.type, "record": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
