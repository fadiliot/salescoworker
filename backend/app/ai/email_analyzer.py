"""
Gemini AI — Email Analyzer
Analyzes incoming emails: summarize, extract leads, detect sentiment
"""
import json
from typing import Optional, Dict, Any
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


def _safe_generate(model, prompt: str) -> str:
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"AI unavailable: {str(e)}"


def analyze_email(
    subject: str,
    body: str,
    from_address: str,
) -> Dict[str, Any]:
    """
    Analyze an email and return:
    - summary: 2-3 sentence summary
    - sentiment: positive/neutral/negative
    - is_lead: bool
    - extracted_lead: dict with name, email, company if lead detected
    - urgency: low/medium/high
    """
    model = _get_model()

    # Dummy response when no API key
    if not model:
        if not settings.AI_FALLBACK_ENABLED:
            raise RuntimeError("Gemini API Key missing and fallbacks disabled.")
        return {
            "summary": f"Email from {from_address} about: {subject[:100]}",
            "sentiment": "neutral",
            "is_lead": False,
            "extracted_lead": None,
            "urgency": "low",
        }

    prompt = f"""You are an intelligent sales assistant. Analyze this email and respond with ONLY valid JSON.

Email From: {from_address}
Subject: {subject}
Body: {body[:2000]}

Return JSON with exactly these fields:
{{
  "summary": "2-3 sentence summary of the email",
  "sentiment": "positive" | "neutral" | "negative",
  "is_lead": true | false,
  "extracted_lead": {{
    "name": "full name if found",
    "email": "email if found",
    "company": "company if found",
    "phone": "phone if found"
  }} or null,
  "urgency": "low" | "medium" | "high"
}}"""

    result_text = _safe_generate(model, prompt)
    try:
        # Strip markdown code blocks if present
        if "```" in result_text:
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        return json.loads(result_text)
    except Exception:
        return {
            "summary": result_text[:300] if result_text else "Analysis failed",
            "sentiment": "neutral",
            "is_lead": False,
            "extracted_lead": None,
            "urgency": "low",
        }


def extract_lead_from_email(subject: str, body: str, from_address: str) -> Optional[Dict]:
    """Extract lead contact details from an email"""
    result = analyze_email(subject, body, from_address)
    if result.get("is_lead") and result.get("extracted_lead"):
        lead = result["extracted_lead"]
        if not lead.get("email"):
            lead["email"] = from_address
        return lead
    return None
