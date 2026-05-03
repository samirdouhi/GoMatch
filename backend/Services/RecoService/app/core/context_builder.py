from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Optional


def _compute_time_slot(kickoff: Optional[datetime]) -> str:
    now = datetime.now()
    if kickoff is None:
        hour = now.hour
        if hour < 11:   return "morning"
        if hour < 14:   return "lunch"
        if hour < 18:   return "afternoon"
        if hour < 21:   return "evening"
        return "night"

    delta_minutes = (kickoff - now).total_seconds() / 60
    if delta_minutes > 360:   return "morning"
    if delta_minutes > 180:   return "afternoon"
    if delta_minutes > 60:    return "pre_match"
    if delta_minutes > -30:   return "match_time"
    if delta_minutes > -180:  return "post_match"
    return "late_night"


def _parse_kickoff(match: Optional[Dict[str, Any]]) -> Optional[datetime]:
    if not match:
        return None
    raw = match.get("date") or match.get("kickoff") or match.get("dateTime") or match.get("utcDate")
    if not raw:
        return None
    s = str(raw).strip()
    # Drop timezone if present — already converted to Morocco local by normalize_match
    s = s[:19].replace("T", "T")
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:len(fmt) + 2], fmt)
        except ValueError:
            continue
    return None


def _merge_profile_into_constraints(constraints: dict, profile: dict) -> dict:
    """Fill constraint gaps using parsed profile preferences (non-destructive)."""
    if not profile:
        return constraints

    prefs = profile.get("preferences") or {}
    merged = dict(constraints)

    if not merged.get("budget"):
        budget = prefs.get("budget")
        if budget:
            merged["budget"] = str(budget).lower()

    if not merged.get("group_type"):
        groupe = prefs.get("groupe")
        if groupe:
            merged["group_type"] = str(groupe).lower()

    if not merged.get("ambiance"):
        ambiance = prefs.get("ambiance")
        if ambiance:
            merged["ambiance"] = str(ambiance).lower()

    return merged


@dataclass
class RecommendationContext:
    intent: str
    constraints: Dict[str, Any]
    profile: Dict[str, Any]
    user_latitude: Optional[float]
    user_longitude: Optional[float]
    current_match: Optional[Dict[str, Any]]
    match_kickoff: Optional[datetime] = field(default=None)
    time_slot: str = field(default="afternoon")
    city: str = field(default="Rabat")
    stadium_latitude: Optional[float] = field(default=None)
    stadium_longitude: Optional[float] = field(default=None)

    def __post_init__(self):
        self.match_kickoff = _parse_kickoff(self.current_match)
        self.time_slot = _compute_time_slot(self.match_kickoff)

        city_from_constraints = self.constraints.get("city")
        city_from_match = (self.current_match or {}).get("ville")
        self.city = city_from_constraints or city_from_match or "Rabat"

        # Stadium coordinates for proximity scoring
        if self.current_match:
            self.stadium_latitude  = self.current_match.get("stade_latitude")
            self.stadium_longitude = self.current_match.get("stade_longitude")

        # Merge profile preferences into constraints as intelligent defaults
        self.constraints = _merge_profile_into_constraints(self.constraints, self.profile)
