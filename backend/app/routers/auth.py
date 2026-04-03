from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.integrations.zoho_crm import ZohoCRMClient
from app.integrations.outlook import OutlookClient
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["Auth"])


# ────────────────────────────── ZOHO ──────────────────────────────

@router.get("/zoho")
def zoho_auth(db: Session = Depends(get_db)):
    """Get Zoho OAuth authorization URL"""
    client = ZohoCRMClient(db)
    url = client.get_auth_url()
    return {"auth_url": url}


@router.get("/callback/zoho")
async def zoho_callback(code: str, db: Session = Depends(get_db)):
    """Handle Zoho OAuth callback"""
    client = ZohoCRMClient(db)
    data = await client.exchange_code_for_token(code)
    if data.get("access_token"):
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/settings?zoho=connected")
    raise HTTPException(status_code=400, detail="Zoho authentication failed")


# ──────────────────────────── MICROSOFT ───────────────────────────

@router.get("/microsoft")
def microsoft_auth(db: Session = Depends(get_db)):
    """Get Microsoft OAuth authorization URL"""
    client = OutlookClient(db)
    url = client.get_auth_url()
    return {"auth_url": url}


@router.get("/callback/microsoft")
async def microsoft_callback(code: str, db: Session = Depends(get_db)):
    """Handle Microsoft OAuth callback"""
    client = OutlookClient(db)
    data = await client.exchange_code_for_token(code)
    if data.get("access_token"):
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/settings?microsoft=connected")
    raise HTTPException(status_code=400, detail="Microsoft authentication failed")


# ───────────────────────── STATUS ENDPOINTS ───────────────────────

@router.get("/status")
def integration_status(db: Session = Depends(get_db)):
    """Check connection status for all integrations"""
    from app.integrations.yeastar import YeastarClient
    zoho = ZohoCRMClient(db)
    outlook = OutlookClient(db)
    yeastar = YeastarClient()
    return {
        "zoho_crm": zoho.is_connected(),
        "microsoft_outlook": outlook.is_connected(),
        "yeastar_pbx": yeastar.is_configured(),
    }
