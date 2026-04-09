"""
Stakeholder Analyzer - Gemini 1.5 Flash
Categorizes contacts into sales roles (Champion, Gatekeeper, Economic Buyer, etc.)
based on their title and available information.
"""
from typing import Optional, List, Dict, Any
from app.config import get_settings
from app.models.contact import StakeholderRole
import google.generativeai as genai
import json

settings = get_settings()

def _get_model():
    if not settings.GEMINI_API_KEY:
        return None
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        return genai.GenerativeModel(settings.GEMINI_MODEL)
    except Exception:
        return None

async def categorize_contact(first_name: str, last_name: str, title: str, company: str, notes: Optional[str] = None) -> StakeholderRole:
    """
    Predict the strategic role of a contact using Gemini.
    """
    model = _get_model()
    
    if not model or not title:
        return StakeholderRole.unknown

    prompt = f"""You are a sales strategy expert. Categorize this contact into one of these specific strategic roles:
Roles:
- Champion: Internal advocate who wants the deal to happen. (e.g., Manager, Lead)
- Gatekeeper: Controls access to decision makers. (e.g., EA, Office Manager)
- Economic Buyer: Has budget authority. (e.g., CEO, CFO, VP, Director)
- Evaluator: Technical or functional user assessing the solution. (e.g., Engineer, Specialist)
- Legal: Procurement or legal reviewer.
- Unknown: If Title is too vague.

Contact:
Name: {first_name} {last_name}
Title: {title}
Company: {company}
Notes: {notes or ""}

Return ONLY the role name from the list above. No explanation.
Role:"""

    try:
        response = model.generate_content(prompt)
        role_str = response.text.strip()
        # Clean up and match enum
        for role in StakeholderRole:
            if role.value.lower() in role_str.lower():
                return role
    except Exception:
        pass
        
    return StakeholderRole.unknown
