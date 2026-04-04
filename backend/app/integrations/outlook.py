"""
Microsoft Outlook / Graph API Integration
Handles OAuth 2.0 and email read/send/draft operations
"""
import httpx
import urllib.parse
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.config import get_settings
from app.models.integration_token import IntegrationToken

settings = get_settings()


class OutlookClient:
    def __init__(self, db: Session):
        self.db = db

    def get_auth_url(self) -> str:
        import base64, hashlib
        code_verifier = "sales_coworker_static_pkce_verifier_string_123"
        code_challenge = base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode('ascii')).digest()).decode('ascii').rstrip('=')
        
        scopes = settings.MS_SCOPES.replace(" ", "%20")
        params = (
            f"client_id={settings.MS_CLIENT_ID}"
            f"&response_type=code"
            f"&redirect_uri={urllib.parse.quote(settings.MS_REDIRECT_URI)}"
            f"&scope={scopes}"
            f"&response_mode=query"
            f"&code_challenge={code_challenge}"
            f"&code_challenge_method=S256"
        )
        return f"https://login.microsoftonline.com/{settings.MS_TENANT_ID}/oauth2/v2.0/authorize?{params}"

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://login.microsoftonline.com/{settings.MS_TENANT_ID}/oauth2/v2.0/token",
                data={
                    "client_id": settings.MS_CLIENT_ID,
                    "client_secret": settings.MS_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.MS_REDIRECT_URI,
                    "grant_type": "authorization_code",
                    "code_verifier": "sales_coworker_static_pkce_verifier_string_123"
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
            IntegrationToken.service == "microsoft"
        ).first()

        if token:
            token.access_token = data.get("access_token", token.access_token)
            token.refresh_token = data.get("refresh_token", token.refresh_token)
            token.expires_at = expires_at
            token.updated_at = datetime.utcnow()
        else:
            token = IntegrationToken(
                service="microsoft",
                access_token=data.get("access_token", ""),
                refresh_token=data.get("refresh_token"),
                scope=data.get("scope"),
                expires_at=expires_at,
            )
            self.db.add(token)
        self.db.commit()

    async def _get_valid_token(self) -> Optional[str]:
        token = self.db.query(IntegrationToken).filter(
            IntegrationToken.service == "microsoft"
        ).first()
        if not token:
            return None

        if token.expires_at and token.expires_at < datetime.utcnow():
            if token.refresh_token:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"https://login.microsoftonline.com/{settings.MS_TENANT_ID}/oauth2/v2.0/token",
                        data={
                            "client_id": settings.MS_CLIENT_ID,
                            "client_secret": settings.MS_CLIENT_SECRET,
                            "refresh_token": token.refresh_token,
                            "grant_type": "refresh_token",
                        },
                    )
                    data = resp.json()
                    token.access_token = data.get("access_token", token.access_token)
                    token.expires_at = datetime.utcnow() + timedelta(seconds=int(data.get("expires_in", 3600)))
                    self.db.commit()

        return token.access_token

    async def get_messages(self, folder: str = "Inbox", top: int = 50) -> List[Dict]:
        access_token = await self._get_valid_token()
        if not access_token:
            return []

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.MS_GRAPH_URL}/me/mailFolders/{folder}/messages",
                headers={"Authorization": f"Bearer {access_token}"},
                params={
                    "$top": top,
                    "$orderby": "receivedDateTime desc",
                    "$select": "id,subject,from,toRecipients,bodyPreview,body,receivedDateTime,isRead,conversationId",
                },
            )
            if resp.status_code == 200:
                return resp.json().get("value", [])
        return []

    async def get_message(self, message_id: str) -> Optional[Dict]:
        access_token = await self._get_valid_token()
        if not access_token:
            return None

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.MS_GRAPH_URL}/me/messages/{message_id}",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code == 200:
                return resp.json()
        return None

    async def send_email(self, to: str, subject: str, body: str, reply_to_id: Optional[str] = None) -> bool:
        access_token = await self._get_valid_token()
        if not access_token:
            return False

        if reply_to_id:
            endpoint = f"{settings.MS_GRAPH_URL}/me/messages/{reply_to_id}/reply"
            payload = {"comment": body}
        else:
            endpoint = f"{settings.MS_GRAPH_URL}/me/sendMail"
            payload = {
                "message": {
                    "subject": subject,
                    "body": {"contentType": "HTML", "content": body},
                    "toRecipients": [{"emailAddress": {"address": to}}],
                }
            }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                endpoint,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            return resp.status_code in (200, 202)

    async def mark_as_read(self, message_id: str) -> bool:
        access_token = await self._get_valid_token()
        if not access_token:
            return False

        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{settings.MS_GRAPH_URL}/me/messages/{message_id}",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json={"isRead": True},
            )
            return resp.status_code == 200

    def is_connected(self) -> bool:
        token = self.db.query(IntegrationToken).filter(
            IntegrationToken.service == "microsoft"
        ).first()
        return token is not None and token.access_token != ""
