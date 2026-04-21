from typing import Any, Dict, List

from app.config import settings
from app.utils.http import get_async_client


class DiscoveryClient:
    async def get_places(self) -> List[Dict[str, Any]]:
        url = f"{settings.GATEWAY_BASE_URL}{settings.DISCOVERY_SERVICE_PATH}/api/places"

        async with get_async_client() as client:
            response = await client.get(url)

            if response.status_code >= 400:
                return []

            data = response.json()
            return data if isinstance(data, list) else []

    async def get_places_by_city(self, city: str = "Rabat") -> List[Dict[str, Any]]:
        url = f"{settings.GATEWAY_BASE_URL}{settings.DISCOVERY_SERVICE_PATH}/api/places/filter"

        async with get_async_client() as client:
            response = await client.get(url, params={"ville": city})

            if response.status_code >= 400:
                return []

            data = response.json()
            return data if isinstance(data, list) else []