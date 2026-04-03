"""
Gemini AI — Insights Engine
Generates pipeline-level insights, hot lead alerts, and action recommendations
"""
import json
from typing import List, Dict, Any, Optional
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


def get_pipeline_insights(
    total_leads: int,
    hot_leads: int,
    deals_by_stage: Dict[str, int],
    avg_response_time_hours: float,
    win_rate: float,
) -> Dict[str, Any]:
    """Generate pipeline-level AI insights"""
    model = _get_model()

    if not model:
        tips = []
        if avg_response_time_hours > 24:
            tips.append("⚡ Response times over 24h — faster replies boost conversion by 7x.")
        if win_rate < 0.3:
            tips.append("📈 Win rate under 30% — review your qualification criteria.")
        if hot_leads > 0:
            tips.append(f"🔥 {hot_leads} hot leads need immediate attention.")

        return {
            "health_score": min(100, int(win_rate * 100 + (50 - avg_response_time_hours))),
            "insights": tips or ["Pipeline looks healthy. Keep following up consistently."],
            "focus_areas": ["Follow up with hot leads", "Reduce response time"],
        }

    prompt = f"""You are a sales manager AI. Analyze the pipeline and give insights.

Pipeline Stats:
- Total Leads: {total_leads}
- Hot Leads: {hot_leads}
- Deals by Stage: {json.dumps(deals_by_stage)}
- Avg Response Time: {avg_response_time_hours:.1f} hours
- Win Rate: {win_rate*100:.1f}%

Return ONLY valid JSON:
{{
  "health_score": <0-100>,
  "insights": ["insight1", "insight2", "insight3"],
  "focus_areas": ["area1", "area2"]
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
            "health_score": 65,
            "insights": [
                f"You have {hot_leads} high-priority leads requiring attention.",
                f"Average response time is {avg_response_time_hours:.0f} hours.",
                f"Current win rate: {win_rate*100:.0f}%",
            ],
            "focus_areas": ["Hot lead follow-ups", "Pipeline velocity"],
        }


def suggest_next_actions(lead: Dict[str, Any]) -> List[str]:
    """Suggest concrete next actions for a specific lead"""
    model = _get_model()

    if not model:
        actions = []
        days = lead.get("days_since_contact", 0)
        stage = lead.get("status", "new")
        if stage == "new":
            actions.append("Send introduction email")
            actions.append("Research company background")
        elif stage == "contacted":
            actions.append("Schedule a discovery call")
        elif stage == "qualified":
            actions.append("Prepare and send a proposal")
        else:
            actions.append("Follow up on pending items")
        if days > 7:
            actions.append("Send a follow-up email — it's been a while!")
        return actions

    prompt = f"""A sales agent needs next action suggestions for this lead.

Lead: {json.dumps(lead, indent=2)}

Return ONLY a JSON array of 3 short, specific action strings:
["action1", "action2", "action3"]"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if "```" in text:
            text = text.split("```")[1].replace("json", "").strip()
        return json.loads(text)
    except Exception:
        return ["Send follow-up email", "Schedule discovery call", "Update lead status"]
