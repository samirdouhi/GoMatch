from typing import Any, Dict

from app.config import settings
from app.utils.http import get_async_client


class ProfileClient:
    async def get_profile(self, access_token: str | None) -> Dict[str, Any]:
        if not access_token or not access_token.strip():
            return {}

        url = f"{settings.GATEWAY_BASE_URL}{settings.PROFILE_SERVICE_PATH}/me"
        headers = {
            "Authorization": f"Bearer {access_token}"
        }

        async with get_async_client() as client:
            response = await client.get(url, headers=headers)

            if response.status_code >= 400:
                return {}

            data = response.json()
            return data if isinstance(data, dict) else {}