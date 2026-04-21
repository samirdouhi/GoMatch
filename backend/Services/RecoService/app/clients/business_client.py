from typing import Any, Dict, List

from app.config import settings
from app.utils.http import get_async_client


class BusinessClient:
    async def get_all_businesses(self) -> List[Dict[str, Any]]:
        url = f"{settings.GATEWAY_BASE_URL}{settings.BUSINESS_SERVICE_PATH}/api/commerces"

        async with get_async_client() as client:
            response = await client.get(url)

            if response.status_code >= 400:
                return []

            data = response.json()
            return data if isinstance(data, list) else []

    async def search_nearby(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 10.0,
    ) -> List[Dict[str, Any]]:
        url = f"{settings.GATEWAY_BASE_URL}{settings.BUSINESS_SERVICE_PATH}/api/commerces/proches"

        async with get_async_client() as client:
            response = await client.get(
                url,
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "rayonKm": radius_km,
                },
            )

            if response.status_code >= 400:
                return []

            data = response.json()
            return data if isinstance(data, list) else []