import time
from typing import Any, Dict, List, Optional, Tuple

from app.config import settings
from app.utils.http import get_async_client

_CACHE_TTL = 120  # seconds
_cache: Dict[str, Tuple[Any, float]] = {}


def _cache_get(key: str) -> Optional[Any]:
    entry = _cache.get(key)
    if entry and time.time() - entry[1] < _CACHE_TTL:
        return entry[0]
    return None


def _cache_set(key: str, value: Any) -> None:
    _cache[key] = (value, time.time())


class BusinessClient:
    async def get_all_businesses(self) -> List[Dict[str, Any]]:
        cached = _cache_get("all_businesses")
        if cached is not None:
            return cached

        url = f"{settings.GATEWAY_BASE_URL}{settings.BUSINESS_SERVICE_PATH}/api/commerces"

        async with get_async_client() as client:
            try:
                response = await client.get(url)
                if response.status_code >= 400:
                    return []
                data = response.json()
                result = data if isinstance(data, list) else []
                # Only active, approved commerces
                result = [
                    c for c in result
                    if isinstance(c, dict)
                    and c.get("statut") == "Approuve"
                    and c.get("estActif", True)
                ]
                _cache_set("all_businesses", result)
                return result
            except Exception:
                return []

    async def search_nearby(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 10.0,
    ) -> List[Dict[str, Any]]:
        cache_key = f"nearby_{latitude:.4f}_{longitude:.4f}_{radius_km}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        url = f"{settings.GATEWAY_BASE_URL}{settings.BUSINESS_SERVICE_PATH}/api/commerces/proches"

        async with get_async_client() as client:
            try:
                response = await client.get(
                    url,
                    params={"latitude": latitude, "longitude": longitude, "rayonKm": radius_km},
                )
                if response.status_code >= 400:
                    return []
                data = response.json()
                result = data if isinstance(data, list) else []
                _cache_set(cache_key, result)
                return result
            except Exception:
                return []