"""
Zoho CRM Integration Client
Handles OAuth 2.0 flow and CRM API operations
"""
import httpx
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.config import get_settings
from app.models.integration_token import IntegrationToken

settings = get_settings()


class ZohoCRMClient:
    def __init__(self, db: Session):
        self.db = db
        self.settings = settings

    def get_auth_url(self) -> str:
        """Returns OAuth authorization URL for Zoho"""
        params = {
            "scope": "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL",
            "client_id": self.settings.ZOHO_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": self.settings.ZOHO_REDIRECT_URI,
            "access_type": "offline",
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.settings.ZOHO_ACCOUNTS_URL}/oauth/v2/auth?{query}"

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access + refresh tokens"""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.settings.ZOHO_ACCOUNTS_URL}/oauth/v2/token",
                params={
                    "grant_type": "authorization_code",
                    "client_id": self.settings.ZOHO_CLIENT_ID,
                    "client_secret": self.settings.ZOHO_CLIENT_SECRET,
                    "redirect_uri": self.settings.ZOHO_REDIRECT_URI,
                    "code": code,
                },
            )
            data = resp.json()
            self._save_token(data)
            return data

    def _save_token(self, data: Dict[str, Any]):
        expires_at = None
        if "expires_in" in data:
            expires_at = datetime.utcnow() + timedelta(seconds=int(data["expires_in"]))

        token = self.db.query(IntegrationToken).filter(
            IntegrationToken.service == "zoho_crm"
        ).first()

        if token:
            token.access_token = data.get("access_token", token.access_token)
            token.refresh_token = data.get("refresh_token", token.refresh_token)
            token.expires_at = expires_at
            token.updated_at = datetime.utcnow()
        else:
            token = IntegrationToken(
                service="zoho_crm",
                access_token=data.get("access_token", ""),
                refresh_token=data.get("refresh_token"),
                expires_at=expires_at,
            )
            self.db.add(token)
        self.db.commit()

    async def _get_valid_token(self) -> Optional[str]:
        token = self.db.query(IntegrationToken).filter(
            IntegrationToken.service == "zoho_crm"
        ).first()
        if not token:
            return None

        # Refresh if expired
        if token.expires_at and token.expires_at < datetime.utcnow():
            if token.refresh_token:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"{self.settings.ZOHO_ACCOUNTS_URL}/oauth/v2/token",
                        params={
                            "grant_type": "refresh_token",
                            "client_id": self.settings.ZOHO_CLIENT_ID,
                            "client_secret": self.settings.ZOHO_CLIENT_SECRET,
                            "refresh_token": token.refresh_token,
                        },
                    )
                    data = resp.json()
                    token.access_token = data.get("access_token", token.access_token)
                    token.expires_at = datetime.utcnow() + timedelta(seconds=int(data.get("expires_in", 3600)))
                    self.db.commit()

        return token.access_token

    async def get_leads(self, page: int = 1, per_page: int = 50) -> List[Dict]:
        """Fetch leads from Zoho CRM"""
        access_token = await self._get_valid_token()
        if not access_token:
            return []

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.settings.ZOHO_CRM_API_URL}/Leads",
                headers={"Authorization": f"Zoho-oauthtoken {access_token}"},
                params={"page": page, "per_page": per_page},
            )
            if resp.status_code == 200:
                return resp.json().get("data", [])
        return []

    async def create_lead(self, lead_data: Dict[str, Any]) -> Optional[Dict]:
        """Create a lead in Zoho CRM"""
        access_token = await self._get_valid_token()
        if not access_token:
            return None

        payload = {
            "data": [{
                "First_Name": lead_data.get("first_name", ""),
                "Last_Name": lead_data.get("last_name", ""),
                "Email": lead_data.get("email"),
                "Phone": lead_data.get("phone"),
                "Company": lead_data.get("company"),
                "Title": lead_data.get("title"),
            }]
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.settings.ZOHO_CRM_API_URL}/Leads",
                headers={
                    "Authorization": f"Zoho-oauthtoken {access_token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if resp.status_code == 201:
                return resp.json().get("data", [{}])[0]
        return None

    async def get_deals(self) -> List[Dict]:
        """Fetch deals/opportunities from Zoho CRM"""
        access_token = await self._get_valid_token()
        if not access_token:
            return []

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.settings.ZOHO_CRM_API_URL}/Deals",
                headers={"Authorization": f"Zoho-oauthtoken {access_token}"},
            )
            if resp.status_code == 200:
                return resp.json().get("data", [])
        return []

    async def get_contacts(self) -> List[Dict]:
        """Fetch contacts from Zoho CRM"""
        access_token = await self._get_valid_token()
        if not access_token:
            return []

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.settings.ZOHO_CRM_API_URL}/Contacts",
                headers={"Authorization": f"Zoho-oauthtoken {access_token}"},
            )
            if resp.status_code == 200:
                return resp.json().get("data", [])
        return []

    def is_connected(self) -> bool:
        token = self.db.query(IntegrationToken).filter(
            IntegrationToken.service == "zoho_crm"
        ).first()
        return token is not None and token.access_token != ""
