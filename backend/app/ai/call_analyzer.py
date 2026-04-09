"""
PBX Call Analyzer - Gemini 1.5 Flash
Transcribes Yeastar call recordings, extracts summaries and action items,
and logs them as Activity + Reminder rows in the database.
"""
import httpx
import base64
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.config import get_settings
from app.models.activity import Activity, ActivityType
from app.models.reminder import Reminder
import google.generativeai as genai
import uuid

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY or "")


async def analyze_call(db: Session, cdr: Dict[str, Any], lead_id: Optional[str] = None) -> Dict:
    """
    Given a Yeastar CDR record with a recording_url, download the audio,
    send to Gemini, extract summary + action items, and persist to DB.
    """
    recording_url = cdr.get("recording_url") or cdr.get("recording")
    call_id = cdr.get("call_id") or cdr.get("id", str(uuid.uuid4()))
    caller = cdr.get("caller") or cdr.get("src", "Unknown")
    callee = cdr.get("callee") or cdr.get("dst", "Unknown")
    duration = str(cdr.get("duration", 0))
    direction = cdr.get("direction", "inbound")

    summary = "Call summary unavailable"
    sentiment = "neutral"
    action_items: List[str] = []

    # Try Gemini transcription if recording url exists
    if recording_url and settings.GEMINI_API_KEY:
        try:
            async with httpx.AsyncClient(verify=False, timeout=30) as client:
                resp = await client.get(recording_url)
                if resp.status_code == 200:
                    audio_b64 = base64.b64encode(resp.content).decode()
                    model = genai.GenerativeModel(settings.GEMINI_MODEL)
                    prompt = (
                        "You are a sales call analyst. Analyze this call recording and return:\n"
                        "1. SUMMARY: 2 sentences max\n"
                        "2. SENTIMENT: positive / neutral / negative\n"
                        "3. ACTION_ITEMS: up to 3 bullet points (start each with '- ')\n"
                        "Format strictly as:\nSUMMARY: ...\nSENTIMENT: ...\nACTION_ITEMS:\n- ...\n- ..."
                    )
                    response = model.generate_content([
                        prompt,
                        {"mime_type": "audio/wav", "data": audio_b64}
                    ])
                    text = response.text
                    for line in text.splitlines():
                        if line.startswith("SUMMARY:"):
                            summary = line.replace("SUMMARY:", "").strip()
                        elif line.startswith("SENTIMENT:"):
                            sentiment = line.replace("SENTIMENT:", "").strip().lower()
                        elif line.startswith("- "):
                            action_items.append(line[2:].strip())
        except Exception:
            pass  # Fall back to stored summary

    # Persist Activity
    activity = Activity(
        lead_id=lead_id,
        activity_type=ActivityType.call,
        title=f"{'Inbound' if direction == 'inbound' else 'Outbound'} Call — {caller} → {callee}",
        description=summary,
        outcome=sentiment,
        duration_seconds=duration,
        yeastar_call_id=str(call_id),
        call_direction=direction,
        caller_number=caller,
        callee_number=callee,
        recording_url=recording_url,
        occurred_at=datetime.utcnow(),
    )
    db.add(activity)

    # Auto-create Reminders from action items
    for item in action_items:
        reminder = Reminder(
            lead_id=lead_id,
            title=f"[Call Action] {item[:100]}",
            message=f"From call with {caller}: {item}",
            due_at=datetime.utcnow() + timedelta(hours=24),
        )
        db.add(reminder)

    db.commit()
    db.refresh(activity)

    return {
        "activity_id": str(activity.id),
        "summary": summary,
        "sentiment": sentiment,
        "action_items": action_items,
    }
