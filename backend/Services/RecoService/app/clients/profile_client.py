"""
profile_client.py — Fetches and parses the tourist profile from ProfileService.

The ProfileService returns TouristeProfileResponseDto which contains:
  - userProfile: { prenom, nom, langue, photoUrl }
  - nationalite
  - preferencesJson: JSON string → { typesDeLieux, budget, ambiancePrefere, activitesFavorites, groupeType }
  - equipesSuiviesJson: JSON string (followed teams list)
  - inscriptionTerminee
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List

from app.config import settings
from app.utils.http import get_async_client

logger = logging.getLogger(__name__)


def _safe_parse_json(raw: Any, fallback: Any = None) -> Any:
    if raw is None:
        return fallback
    if not isinstance(raw, str):
        return raw if raw else fallback
    try:
        return json.loads(raw)
    except Exception:
        return fallback


def _coerce_list(val: Any) -> List[str]:
    if isinstance(val, list):
        return [str(v).lower().strip() for v in val if v]
    if isinstance(val, str) and val.strip():
        return [val.lower().strip()]
    return []


def parse_touriste_profile(raw: dict) -> dict:
    """Convert TouristeProfileResponseDto into a normalized dict for the recommendation engine."""
    user_profile = raw.get("userProfile") or {}

    prefs = _safe_parse_json(
        raw.get("preferencesJson") or raw.get("PreferencesJson"), {}
    )
    if not isinstance(prefs, dict):
        prefs = {}

    teams = _safe_parse_json(
        raw.get("equipesSuiviesJson") or raw.get("EquipesSuiviesJson"), []
    )

    return {
        "prenom": user_profile.get("prenom") or user_profile.get("Prenom"),
        "nom": user_profile.get("nom") or user_profile.get("Nom"),
        "langue": (user_profile.get("langue") or "FR").upper(),
        "nationalite": raw.get("nationalite") or raw.get("Nationalite"),
        "inscription_terminee": raw.get("inscriptionTerminee", False),
        "photo_url": user_profile.get("photoUrl"),
        "preferences": {
            "types_lieux": _coerce_list(
                prefs.get("typesDeLieux") or prefs.get("types") or prefs.get("preferredTypes")
            ),
            "budget": prefs.get("budget") or prefs.get("budgetRange"),
            "ambiance": prefs.get("ambiancePrefere") or prefs.get("ambiance"),
            "activites": _coerce_list(
                prefs.get("activitesFavorites") or prefs.get("activities") or prefs.get("activites")
            ),
            "groupe": prefs.get("groupeType") or prefs.get("groupType"),
        },
        "equipes_suivies": teams if isinstance(teams, list) else [],
    }


class ProfileClient:
    async def get_profile(self, access_token: str | None) -> dict:
        if not access_token or not access_token.strip():
            return {}

        url = f"{settings.GATEWAY_BASE_URL}{settings.PROFILE_SERVICE_PATH}/api/touriste/profile/me"
        headers = {"Authorization": f"Bearer {access_token}"}

        async with get_async_client() as client:
            try:
                response = await client.get(url, headers=headers)
                if response.status_code >= 400:
                    logger.debug("Profile fetch status %s — continuing without profile", response.status_code)
                    return {}
                data = response.json()
                return parse_touriste_profile(data) if isinstance(data, dict) else {}
            except Exception as exc:
                logger.warning("Profile fetch failed: %s", exc)
                return {}
