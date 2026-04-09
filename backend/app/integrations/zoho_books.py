"""
Zoho Books Integration Client
Handles invoice and customer data from Zoho Books
"""
import httpx
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.config import get_settings
from app.models.integration_token import IntegrationToken

settings = get_settings()


class ZohoBooksClient:
    def __init__(self, db: Session):
        self.db = db
        self.settings = settings

    def get_auth_url(self) -> str:
        """Zoho Books uses same OAuth scope as CRM; combined token preferred"""
        params = {
            "scope": "ZohoBooks.fullaccess.all",
            "client_id": self.settings.ZOHO_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": self.settings.ZOHO_REDIRECT_URI,
            "access_type": "offline",
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.settings.ZOHO_ACCOUNTS_URL}/oauth/v2/auth?{query}"

    async def _get_valid_token(self) -> Optional[str]:
        # Reuse zoho_crm token (shared Zoho OAuth) or zoho_books
        token = self.db.query(IntegrationToken).filter(
            IntegrationToken.service.in_(["zoho_crm", "zoho_books"])
        ).first()
        if not token:
            return None

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

    def _base_params(self) -> Dict:
        return {"organization_id": self.settings.ZOHO_ORGANIZATION_ID or ""}

    async def get_invoices(self, customer_name: Optional[str] = None) -> List[Dict]:
        access_token = await self._get_valid_token()
        if not access_token:
            return []

        params = self._base_params()
        if customer_name:
            params["customer_name"] = customer_name

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.settings.ZOHO_BOOKS_API_URL}/invoices",
                headers={"Authorization": f"Zoho-oauthtoken {access_token}"},
                params=params,
            )
            if resp.status_code == 200:
                return resp.json().get("invoices", [])
        return []

    async def get_customers(self) -> List[Dict]:
        access_token = await self._get_valid_token()
        if not access_token:
            return []

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.settings.ZOHO_BOOKS_API_URL}/contacts",
                headers={"Authorization": f"Zoho-oauthtoken {access_token}"},
                params={**self._base_params(), "contact_type": "customer"},
            )
            if resp.status_code == 200:
                return resp.json().get("contacts", [])
        return []

    async def get_invoice_detail(self, invoice_id: str) -> Optional[Dict]:
        access_token = await self._get_valid_token()
        if not access_token:
            return None

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.settings.ZOHO_BOOKS_API_URL}/invoices/{invoice_id}",
                headers={"Authorization": f"Zoho-oauthtoken {access_token}"},
                params=self._base_params(),
            )
            if resp.status_code == 200:
                return resp.json().get("invoice")
        return None

    def is_connected(self) -> bool:
        token = self.db.query(IntegrationToken).filter(
            IntegrationToken.service.in_(["zoho_crm", "zoho_books"])
        ).first()
        return token is not None

    async def send_payment_reminder(self, invoice_id: str) -> Dict:
        """Send a payment reminder email for an invoice via Zoho Books"""
        access_token = await self._get_valid_token()
        if not access_token:
            return {"error": "Not connected"}
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.settings.ZOHO_BOOKS_API_URL}/invoices/{invoice_id}/paymentreminder",
                headers={"Authorization": f"Zoho-oauthtoken {access_token}"},
                params=self._base_params(),
            )
            return resp.json()
