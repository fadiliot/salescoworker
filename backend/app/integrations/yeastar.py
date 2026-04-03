"""
Yeastar PBX Integration Client
Handles call logs, active calls, and CDR via Yeastar REST API
Uses session-based token authentication
"""
import httpx
import hashlib
import time
from typing import Optional, List, Dict, Any
from app.config import get_settings

settings = get_settings()


class YeastarClient:
    """
    Yeastar P-Series PBX REST API client.
    Authentication: POST /api/v1.0.0/user/login with MD5(password+time)
    """

    def __init__(self):
        self.host = settings.YEASTAR_HOST
        self.username = settings.YEASTAR_USERNAME
        self.password = settings.YEASTAR_PASSWORD
        self._token: Optional[str] = None
        self._token_expiry: float = 0

    def _hash_password(self, timestamp: str) -> str:
        """MD5(password + timestamp)"""
        raw = (self.password or "") + timestamp
        return hashlib.md5(raw.encode()).hexdigest().upper()

    async def _get_token(self) -> Optional[str]:
        """Obtain session token from Yeastar"""
        if not self.host or not self.username or not self.password:
            return None

        if self._token and time.time() < self._token_expiry:
            return self._token

        timestamp = str(int(time.time()))
        password_hash = self._hash_password(timestamp)

        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.post(
                f"{self.host}/api/v1.0.0/user/login",
                json={
                    "username": self.username,
                    "password": password_hash,
                    "port": "8088",
                    "timestamp": timestamp,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "Success":
                    self._token = data.get("token")
                    self._token_expiry = time.time() + 1800  # 30 min
                    return self._token
        return None

    async def get_call_logs(self, limit: int = 50, sort_by: str = "desc") -> List[Dict]:
        """Fetch CDR (Call Detail Records)"""
        token = await self._get_token()
        if not token:
            return []

        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.post(
                f"{self.host}/api/v1.0.0/cdr/get_cdr",
                json={
                    "token": token,
                    "pagesize": limit,
                    "sortby": sort_by,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "Success":
                    return data.get("cdr_list", [])
        return []

    async def get_active_calls(self) -> List[Dict]:
        """Get currently active calls"""
        token = await self._get_token()
        if not token:
            return []

        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.post(
                f"{self.host}/api/v1.0.0/activecall/list",
                json={"token": token},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "Success":
                    return data.get("activecall_list", [])
        return []

    async def get_extensions(self) -> List[Dict]:
        """List all PBX extensions"""
        token = await self._get_token()
        if not token:
            return []

        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.post(
                f"{self.host}/api/v1.0.0/extension/list",
                json={"token": token},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "Success":
                    return data.get("extlist", [])
        return []

    async def click_to_call(self, caller_ext: str, callee_number: str) -> bool:
        """Initiate a call from a PBX extension to a phone number"""
        token = await self._get_token()
        if not token:
            return False

        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.post(
                f"{self.host}/api/v1.0.0/callog/dial",
                json={
                    "token": token,
                    "caller": caller_ext,
                    "callee": callee_number,
                },
            )
            if resp.status_code == 200:
                return resp.json().get("status") == "Success"
        return False

    def is_configured(self) -> bool:
        return bool(self.host and self.username and self.password)
