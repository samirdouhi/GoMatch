"""
itinerary_planner.py — Central dispatcher for itinerary planning.

Routes to the appropriate planner based on intent:
  match_day_plan / pre_match_plan / morning_plan (with match) → match_day_planner
  off_day_plan → off_day_planner
  everything else → specific_recommender (no full itinerary)

Returns (plan_steps, safety_info, mode).
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from app.core.match_day_planner import build_match_day_plan
from app.core.off_day_planner import build_off_day_plan
from app.models.domain_models import CandidateItem
from app.models.response_models import PlanStep, SafetyInfo
from app.utils.geo import compute_distance_km

_MATCH_DAY_INTENTS = {
    "match_day_plan",
    "pre_match_plan",
    "morning_plan",
    "full_day_plan",    # legacy alias
}

_OFF_DAY_INTENTS = {
    "off_day_plan",
    "day_plan",         # general full-day (no match)
    "cultural_plan",    # culture immersion day
    "route_plan",       # multi-stop itinerary
    "family_plan",      # family-friendly day
}


def plan_itinerary(
    intent: str,
    candidates: List[CandidateItem],
    match: Optional[Dict[str, Any]],
    profile: Optional[Dict[str, Any]],
    user_lat: Optional[float],
    user_lon: Optional[float],
    city: str = "Rabat",
    constraints: Optional[Dict[str, Any]] = None,
) -> Tuple[List[PlanStep], Optional[SafetyInfo], str]:
    """
    Dispatch to the appropriate planner.

    Returns:
        plan    — list of PlanStep (empty for specific intents)
        safety  — SafetyInfo (only for match_day mode)
        mode    — "match_day" | "off_day" | "specific"
    """
    constraints = constraints or {}

    # ── Match Day ─────────────────────────────────────────────────────────────
    if intent in _MATCH_DAY_INTENTS and match:
        user_to_stadium_km: Optional[float] = None
        if user_lat and user_lon:
            s_lat = match.get("stade_latitude")
            s_lon = match.get("stade_longitude")
            if s_lat and s_lon:
                user_to_stadium_km = compute_distance_km(user_lat, user_lon, s_lat, s_lon)

        plan, safety = build_match_day_plan(
            match=match,
            candidates=candidates,
            user_lat=user_lat,
            user_lon=user_lon,
            user_to_stadium_km=user_to_stadium_km,
            time_available_minutes=constraints.get("time_available_minutes"),
        )
        return plan, safety, "match_day"

    # ── Off Day ───────────────────────────────────────────────────────────────
    if intent in _OFF_DAY_INTENTS:
        plan = build_off_day_plan(
            candidates=candidates,
            profile=profile,
            user_lat=user_lat,
            user_lon=user_lon,
            city=city,
            constraints=constraints,
        )
        return plan, None, "off_day"

    # ── Specific request ──────────────────────────────────────────────────────
    return [], None, "specific"
