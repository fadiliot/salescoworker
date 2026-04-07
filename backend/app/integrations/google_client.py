"""
Google Calendar / Meet API Integration
Handles OAuth 2.0 and fetching meeting events
"""
import httpx
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.config import get_settings
from app.models.integration_token import IntegrationToken

settings = get_settings()


class GoogleClient:
    def __init__(self, db: Session):
        self.db = db
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI

    def get_auth_url(self) -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email openid",
            "access_type": "offline",
            "prompt": "consent",
        }
        import urllib.parse
        encoded_params = urllib.parse.urlencode(params)
        return f"https://accounts.google.com/o/oauth2/v2/auth?{encoded_params}"

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            data = resp.json()
            if "error" in data:
                return data
            self._save_token(data)
            return data

    def _save_token(self, data: Dict[str, Any]):
        expires_at = None
        if "expires_in" in data:
            expires_at = datetime.utcnow() + timedelta(seconds=int(data["expires_in"]))

        token = self.db.query(IntegrationToken).filter(
            IntegrationToken.service == "google"
        ).first()

        if token:
            token.access_token = data.get("access_token", token.access_token)
            if data.get("refresh_token"):
                token.refresh_token = data.get("refresh_token")
            token.expires_at = expires_at
            token.updated_at = datetime.utcnow()
        else:
            token = IntegrationToken(
                service="google",
                access_token=data.get("access_token", ""),
                refresh_token=data.get("refresh_token"),
                scope=data.get("scope"),
                expires_at=expires_at,
            )
            self.db.add(token)
        self.db.commit()

    async def _get_valid_token(self) -> Optional[str]:
        token = self.db.query(IntegrationToken).filter(
            IntegrationToken.service == "google"
        ).first()
        if not token:
            return None

        if token.expires_at and token.expires_at < datetime.utcnow():
            if token.refresh_token:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        "https://oauth2.googleapis.com/token",
                        data={
                            "client_id": self.client_id,
                            "client_secret": self.client_secret,
                            "refresh_token": token.refresh_token,
                            "grant_type": "refresh_token",
                        },
                    )
                    data = resp.json()
                    if "access_token" in data:
                        token.access_token = data["access_token"]
                        token.expires_at = datetime.utcnow() + timedelta(seconds=int(data.get("expires_in", 3600)))
                        self.db.commit()

        return token.access_token

    async def get_upcoming_meetings(self, hours_ahead: int = 24) -> List[Dict]:
        access_token = await self._get_valid_token()
        if not access_token:
            return []

        now = datetime.now(timezone.utc)
        time_min = now.isoformat()
        time_max = (now + timedelta(hours=hours_ahead)).isoformat()

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                headers={"Authorization": f"Bearer {access_token}"},
                params={
                    "timeMin": time_min,
                    "timeMax": time_max,
                    "singleEvents": "true",
                    "orderBy": "startTime",
                    "conferenceDataVersion": 1,
                },
            )
            if resp.status_code == 200:
                events = resp.json().get("items", [])
                return events
        return []

    def is_connected(self) -> bool:
        token = self.db.query(IntegrationToken).filter(
            IntegrationToken.service == "google"
        ).first()
        return token is not None and token.access_token != ""
