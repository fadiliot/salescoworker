"""
Gemini AI — Reply Generator
Generates contextual email replies for sales agents
"""
from typing import Optional, Dict
from app.config import get_settings

settings = get_settings()


def _get_model():
    if not settings.GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        return genai.GenerativeModel(settings.GEMINI_MODEL)
    except Exception:
        return None


def generate_reply(
    subject: str,
    body: str,
    from_address: str,
    agent_name: str = "Sales Team",
    context: Optional[str] = None,
) -> str:
    """
    Generate a professional email reply suggestion.
    Returns a ready-to-send reply text.
    """
    model = _get_model()

    if not model:
        return (
            f"Hi,\n\nThank you for reaching out regarding '{subject}'. "
            "I'd be happy to discuss this further and explore how we can help you.\n\n"
            "Could we schedule a quick call this week?\n\n"
            f"Best regards,\n{agent_name}"
        )

    extra_context = f"\nAdditional context: {context}" if context else ""

    prompt = f"""You are a professional sales assistant helping draft email replies.

Original email:
From: {from_address}
Subject: {subject}
Body: {body[:2000]}
{extra_context}

Write a professional, concise, and friendly reply email. 
- Keep it under 150 words
- Be helpful and move the deal forward
- Sign off as {agent_name}
- Do NOT include a subject line, just the body

Reply:"""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return (
            f"Hi,\n\nThank you for your email. I'll get back to you shortly.\n\n"
            f"Best regards,\n{agent_name}"
        )


def generate_followup(
    lead_name: str,
    last_activity: str,
    deal_stage: str,
    agent_name: str = "Sales Team",
) -> str:
    """Generate a follow-up email for a stale lead."""
    model = _get_model()

    if not model:
        return (
            f"Hi {lead_name},\n\nI wanted to follow up on our previous conversation. "
            "We'd love to help move things forward.\n\n"
            "Could we connect for a quick call this week?\n\n"
            f"Best regards,\n{agent_name}"
        )

    prompt = f"""Write a short follow-up email for a sales lead.

Lead Name: {lead_name}
Last Activity: {last_activity}
Deal Stage: {deal_stage}
Your Name: {agent_name}

Rules:
- Max 100 words
- Friendly, not pushy
- Include a clear call to action
- No subject line, just body

Follow-up email:"""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return (
            f"Hi {lead_name},\n\nJust following up to see if you had a chance to review our last conversation. "
            "Happy to answer any questions!\n\nBest,\n{agent_name}"
        )
