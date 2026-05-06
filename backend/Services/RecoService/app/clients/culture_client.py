"""
culture_client.py — Client for CultureService.
Fetches published cultural content to enrich recommendations.
"""
import time
from typing import Any, Dict, List, Optional, Tuple

from app.config import settings
from app.utils.http import get_async_client

_CACHE_TTL = 180  # seconds (cultural content changes rarely)
_cache: Dict[str, Tuple[Any, float]] = {}


def _cache_get(key: str) -> Optional[Any]:
    entry = _cache.get(key)
    if entry and time.time() - entry[1] < _CACHE_TTL:
        return entry[0]
    return None


def _cache_set(key: str, value: Any) -> None:
    _cache[key] = (value, time.time())


class CultureClient:
    """Fetches published cultural contents from CultureService."""

    async def get_published_contenus(self) -> List[Dict[str, Any]]:
        cached = _cache_get("culture_published")
        if cached is not None:
            return cached

        url = f"{settings.GATEWAY_BASE_URL}{settings.CULTURE_SERVICE_PATH}/api/contenus-culturels"

        async with get_async_client() as client:
            try:
                response = await client.get(url, params={"statut": "Publié"})
                if response.status_code >= 400:
                    return []
                data = response.json()
                result = data if isinstance(data, list) else []
                # Keep only published items with coordinates
                result = [
                    item for item in result
                    if isinstance(item, dict) and item.get("statut") == "Publié"
                ]
                _cache_set("culture_published", result)
                return result
            except Exception:
                return []
