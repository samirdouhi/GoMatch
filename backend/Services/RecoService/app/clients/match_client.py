"""
match_client.py — Fetches and normalises World Cup match data.

MatchResponseDto (C# ASP.NET Core, camelCase JSON) fields:
  id, homeTeam, awayTeam, utcDate, status, stage,
  city, stadiumName, address, latitude, longitude,
  competitionName, fanZones[{name, address, latitude, longitude}]
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from app.config import settings
from app.utils.http import get_async_client

logger = logging.getLogger(__name__)

# Morocco is UTC+1 year-round (since 2019)
_MOROCCO_TZ = timezone(timedelta(hours=1))

_FRENCH_DAYS   = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
_FRENCH_MONTHS = ["", "janvier", "février", "mars", "avril", "mai", "juin",
                  "juillet", "août", "septembre", "octobre", "novembre", "décembre"]


def _to_float(v: Any) -> Optional[float]:
    if v is None:
        return None
    try:
        return float(v)
    except (ValueError, TypeError):
        return None


def _parse_utc_date(raw: Any) -> Optional[datetime]:
    """Parse utcDate from the DTO → Morocco local time (UTC+1), timezone-naive."""
    if not raw:
        return None
    s = str(raw).strip()
    try:
        # Python 3.7–3.10 fromisoformat doesn't handle "Z" suffix
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is not None:
            # Has timezone → convert to Morocco local
            dt_local = dt.astimezone(_MOROCCO_TZ)
            return dt_local.replace(tzinfo=None)
        # No timezone info → assume already stored as Morocco local time
        return dt
    except ValueError:
        # Fallback strptime
        for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                return datetime.strptime(s[:19], fmt)
            except ValueError:
                continue
    return None


def _format_date_fr(dt: datetime) -> str:
    """e.g. 'Lundi 15 juin 2026 à 20:00'"""
    day   = _FRENCH_DAYS[dt.weekday()]
    month = _FRENCH_MONTHS[dt.month]
    return f"{day} {dt.day} {month} {dt.year} à {dt.strftime('%H:%M')}"


def normalize_match(raw: dict) -> dict:
    """
    Convert MatchResponseDto (camelCase JSON) to internal snake_case format.
    Works whether the raw dict is already normalised or comes fresh from the API.
    """
    dt = _parse_utc_date(
        raw.get("utcDate") or raw.get("UtcDate") or raw.get("date")
    )

    return {
        "id": raw.get("id") or raw.get("Id"),
        # Teams
        "equipe1": (raw.get("homeTeam") or raw.get("HomeTeam") or
                    raw.get("equipe1") or "?"),
        "equipe2": (raw.get("awayTeam") or raw.get("AwayTeam") or
                    raw.get("equipe2") or "?"),
        # Datetime (Morocco local)
        "date":           dt.isoformat()          if dt else None,
        "heure":          dt.strftime("%H:%M")    if dt else None,
        "kickoff":        dt.strftime("%H:%M")    if dt else None,
        "date_affichage": _format_date_fr(dt)     if dt else None,
        "date_iso":       dt.date().isoformat()   if dt else None,
        # Venue
        "ville": (raw.get("city") or raw.get("City") or raw.get("ville")),
        "stade": (raw.get("stadiumName") or raw.get("StadiumName") or
                  raw.get("venue")       or raw.get("Venue") or
                  raw.get("stade")),
        "stade_latitude":  _to_float(
            raw.get("latitude")  or raw.get("Latitude")  or raw.get("stade_latitude")),
        "stade_longitude": _to_float(
            raw.get("longitude") or raw.get("Longitude") or raw.get("stade_longitude")),
        "stade_adresse": (raw.get("address") or raw.get("Address") or
                          raw.get("stade_adresse")),
        # Meta
        "competition": (raw.get("competitionName") or raw.get("CompetitionName")),
        "statut":      (raw.get("status")          or raw.get("Status")),
        "stage":       (raw.get("stage")            or raw.get("Stage")),
        "fan_zones":   (raw.get("fanZones")         or raw.get("FanZones") or []),
        "is_experience": bool(raw.get("isExperienceMatch") or raw.get("IsExperienceMatch")),
    }


class MatchClient:
    async def get_today_matches(self) -> List[Dict[str, Any]]:
        url = f"{settings.GATEWAY_BASE_URL}{settings.MATCH_SERVICE_PATH}/matches/world-cup/today"
        async with get_async_client() as client:
            try:
                response = await client.get(url)
                if response.status_code >= 400:
                    return []
                data = response.json()
                return [normalize_match(m) for m in (data if isinstance(data, list) else [])]
            except Exception as exc:
                logger.warning("get_today_matches failed: %s", exc)
                return []

    async def get_upcoming_matches(self) -> List[Dict[str, Any]]:
        url = f"{settings.GATEWAY_BASE_URL}{settings.MATCH_SERVICE_PATH}/matches/world-cup/upcoming"
        async with get_async_client() as client:
            try:
                response = await client.get(url)
                if response.status_code >= 400:
                    return []
                data = response.json()
                return [normalize_match(m) for m in (data if isinstance(data, list) else [])]
            except Exception as exc:
                logger.warning("get_upcoming_matches failed: %s", exc)
                return []

    async def get_match_by_id(self, match_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific match by ID via direct API endpoint."""
        url = f"{settings.GATEWAY_BASE_URL}{settings.MATCH_SERVICE_PATH}/matches/{match_id}"
        async with get_async_client() as client:
            try:
                response = await client.get(url)
                if response.status_code >= 400:
                    return None
                data = response.json()
                if isinstance(data, dict) and data.get("id"):
                    return normalize_match(data)
                return None
            except Exception as exc:
                logger.warning("get_match_by_id(%s) failed: %s", match_id, exc)
                return None

    async def get_match_context(self, current_match_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        STRICT match resolution: when current_match_id is provided, ONLY return
        that specific match. NEVER fall back to a different match.
        This prevents the bug where selecting Maroc vs Brésil returns South Korea.
        """
        if current_match_id:
            # 1. Search today's matches
            today = await self.get_today_matches()
            for match in today:
                if str(match.get("id")) == str(current_match_id):
                    return match

            # 2. Search upcoming matches
            upcoming = await self.get_upcoming_matches()
            for match in upcoming:
                if str(match.get("id")) == str(current_match_id):
                    return match

            # 3. Direct fetch by ID as last resort
            direct = await self.get_match_by_id(current_match_id)
            if direct:
                return direct

            # 4. ID not found anywhere — log warning, return None (never substitute)
            logger.warning(
                "selected_match_id=%s not found in today/upcoming/direct. "
                "Returning None to avoid showing wrong match.",
                current_match_id,
            )
            return None

        # No ID provided → return today's first match or first upcoming
        today = await self.get_today_matches()
        if today:
            return today[0]

        upcoming = await self.get_upcoming_matches()
        return upcoming[0] if upcoming else None
