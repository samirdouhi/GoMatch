from typing import Any, Dict, List, Optional

from app.config import settings
from app.utils.http import get_async_client


class MatchClient:
    async def get_today_matches(self) -> List[Dict[str, Any]]:
        url = f"{settings.GATEWAY_BASE_URL}{settings.MATCH_SERVICE_PATH}/matches/world-cup/today"

        async with get_async_client() as client:
            response = await client.get(url)

            if response.status_code >= 400:
                return []

            data = response.json()
            return data if isinstance(data, list) else []

    async def get_upcoming_matches(self) -> List[Dict[str, Any]]:
        url = f"{settings.GATEWAY_BASE_URL}{settings.MATCH_SERVICE_PATH}/matches/world-cup/upcoming"

        async with get_async_client() as client:
            response = await client.get(url)

            if response.status_code >= 400:
                return []

            data = response.json()
            return data if isinstance(data, list) else []

    async def get_match_context(self, current_match_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        today = await self.get_today_matches()

        if current_match_id:
            for match in today:
                if str(match.get("id")) == str(current_match_id):
                    return match

        if today:
            return today[0]

        upcoming = await self.get_upcoming_matches()
        if upcoming:
            return upcoming[0]

        return None