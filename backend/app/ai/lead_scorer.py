"""
Gemini AI — Lead Scorer
Scores leads 0-100 based on engagement, deal potential, and recency
"""
import json
from typing import Dict, Any, List
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


def score_lead(lead_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Score a single lead and return score + reasoning.
    lead_data keys: name, email, company, status, source, activities_count,
                    emails_count, days_since_contact, deal_amount, deal_stage
    """
    model = _get_model()

    # Rule-based fallback scoring
    score = 30
    reasons = []

    if lead_data.get("email"):
        score += 5
    if lead_data.get("company"):
        score += 5
        reasons.append("Company information available")
    if lead_data.get("phone"):
        score += 5
    if lead_data.get("activities_count", 0) > 2:
        score += 15
        reasons.append(f"{lead_data['activities_count']} activities logged")
    if lead_data.get("emails_count", 0) > 1:
        score += 10
        reasons.append("Active email engagement")
    days = lead_data.get("days_since_contact", 999)
    if days < 3:
        score += 15
        reasons.append("Recently contacted")
    elif days < 7:
        score += 10
    elif days > 30:
        score -= 10
        reasons.append("Not contacted in over 30 days")
    if lead_data.get("deal_amount"):
        score += 10
        reasons.append("Active deal")
    stage = lead_data.get("deal_stage", "")
    if stage in ("proposal", "negotiation"):
        score += 10
        reasons.append(f"Deal in {stage} stage")
    elif stage == "won":
        score = 100

    score = max(0, min(100, score))
    is_hot = score >= 70

    if not model:
        return {
            "score": score,
            "is_hot": is_hot,
            "reasons": reasons,
            "next_action": "Follow up with a call or email to move this lead forward.",
        }

    prompt = f"""You are a sales AI. Score this lead and provide insights.

Lead Data: {json.dumps(lead_data, indent=2)}

Respond with ONLY valid JSON:
{{
  "score": <integer 0-100>,
  "is_hot": <true | false>,
  "reasons": ["reason1", "reason2"],
  "next_action": "one specific next step for the sales agent"
}}"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception:
        return {
            "score": score,
            "is_hot": is_hot,
            "reasons": reasons,
            "next_action": "Schedule a follow-up call to assess interest level.",
        }


def batch_score_leads(leads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Score a list of leads and return scored list"""
    return [{"id": lead.get("id"), **score_lead(lead)} for lead in leads]
