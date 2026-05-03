"""
match_day_planner.py — Full day itinerary planner for World Cup match days.

Safety constraints:
  kickoff_time          = match kick-off (local Morocco time)
  recommended_arrival   = kickoff - 60 min
  travel_time           = estimated minutes to reach stadium from user
  latest_departure      = recommended_arrival - travel_time

All pre-match steps must end before latest_departure.
Post-match steps are scheduled after kickoff + 110 min (full-time).

Plan structure:
  [morning]     Breakfast café
  [mid-morning] Cultural visit
  [lunch]       Restaurant
  [afternoon]   Artisan / activity
  [pre-match]   Fan zone / bar warmup
  [transport]   Head to stadium
  [match]       The game ⚽
  [post-match]  Celebration dinner / bar
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from app.models.domain_models import CandidateItem
from app.models.response_models import PlanStep, SafetyInfo

_WALK_KMH = 4.0
_TRANSIT_KMH = 25.0


# ── Utilities ─────────────────────────────────────────────────────────────────

def _fmt(dt: datetime) -> str:
    return dt.strftime("%H:%M")


def _add(base: datetime, minutes: int) -> datetime:
    return base + timedelta(minutes=minutes)


def _blob(item: CandidateItem) -> str:
    return f"{item.type} {item.title} {item.description or ''} {' '.join(item.tags)}".lower()


def _travel_min(distance_km: Optional[float]) -> int:
    if distance_km is None:
        return 30
    if distance_km < 1.5:
        return max(15, int(distance_km / _WALK_KMH * 60))
    return max(20, int(distance_km / _TRANSIT_KMH * 60) + 10)


def _best(
    candidates: List[CandidateItem],
    preferred: List[str],
    used: set,
    max_km: Optional[float] = None,
) -> Optional[CandidateItem]:
    """Pick highest-scored candidate matching any preferred keyword, not already used."""
    def _ok(item: CandidateItem) -> bool:
        if item.id in used:
            return False
        if max_km and item.distance_km and item.distance_km > max_km:
            return False
        b = _blob(item)
        return any(kw in b for kw in preferred)

    matching = [i for i in candidates if _ok(i)]
    if not matching:
        # Relax: drop keyword filter, keep distance and used constraints
        matching = [i for i in candidates if i.id not in used and
                    (max_km is None or i.distance_km is None or i.distance_km <= max_km)]
    return max(matching, key=lambda x: x.final_score) if matching else None


def _reason(item: CandidateItem, extra: str = "") -> str:
    parts = []
    if item.source == "business":
        parts.append("commerce local partenaire GoMatch")
    if item.distance_km is not None:
        parts.append(f"à {round(item.distance_km, 1)} km de vous")
    if item.rating and item.rating >= 4.0:
        parts.append(f"noté {item.rating}/5")
    if extra:
        parts.append(extra)
    return ", ".join(parts) if parts else "bonne adresse pour cette journée"


# ── Safety calculation ────────────────────────────────────────────────────────

def _compute_safety(
    kickoff: datetime,
    user_to_stadium_km: Optional[float],
) -> Tuple[datetime, datetime, int]:
    """Returns (recommended_arrival, latest_departure, travel_min)."""
    travel = _travel_min(user_to_stadium_km)
    recommended_arrival = _add(kickoff, -60)
    latest_departure = _add(recommended_arrival, -travel)
    return recommended_arrival, latest_departure, travel


# ── Main planner ──────────────────────────────────────────────────────────────

def build_match_day_plan(
    match: Dict[str, Any],
    candidates: List[CandidateItem],
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
    user_to_stadium_km: Optional[float] = None,
    time_available_minutes: Optional[int] = None,
) -> Tuple[List[PlanStep], SafetyInfo]:
    """
    Build a complete match-day itinerary with safety margins.

    Returns:
        plan   — ordered list of PlanStep
        safety — SafetyInfo with arrival and departure deadlines
    """
    equipe1 = match.get("equipe1", "Équipe 1")
    equipe2 = match.get("equipe2", "Équipe 2")
    stade = match.get("stade", "Stade")
    stade_address = match.get("stade_adresse", "")
    kickoff_str = match.get("kickoff") or match.get("heure") or "20:00"
    date_str = match.get("date_iso") or datetime.now().strftime("%Y-%m-%d")

    try:
        kickoff = datetime.strptime(f"{date_str} {kickoff_str}", "%Y-%m-%d %H:%M")
    except ValueError:
        kickoff = datetime.now().replace(hour=20, minute=0, second=0, microsecond=0)

    recommended_arrival, latest_departure, travel_min = _compute_safety(
        kickoff, user_to_stadium_km
    )

    now = datetime.now()
    plan: List[PlanStep] = []
    used: set = set()

    # Start plan at 08:30 or current time (whichever is later)
    day_start = kickoff.replace(hour=8, minute=30, second=0, microsecond=0)
    current = max(now, day_start)

    def _can_fit(duration_min: int, buffer_min: int = 15) -> bool:
        """True if step fits before latest_departure with buffer."""
        return _add(current, duration_min + buffer_min) <= latest_departure

    def _minutes_to_latest() -> int:
        return max(0, int((latest_departure - current).total_seconds() / 60))

    # ── Slot 1: Breakfast / Café ──────────────────────────────────────────────
    minutes_before_match = (kickoff - current).total_seconds() / 60
    if _can_fit(90) and minutes_before_match > 300:
        item = _best(candidates, [
            "cafe", "café", "coffee", "salon de thé", "petit déjeuner", "breakfast", "thé",
        ], used, max_km=6)
        if item:
            used.add(item.id)
            end = _add(current, 90)
            plan.append(PlanStep(
                startTime=_fmt(current), endTime=_fmt(end),
                type="cafe", title=item.title,
                description=item.description or f"Commencez la journée du match {equipe1} vs {equipe2} avec un café marocain.",
                latitude=item.latitude, longitude=item.longitude,
                distanceFromUserKm=item.distance_km,
                distanceToStadiumKm=item.stadium_distance_km,
                estimatedDurationMinutes=90,
                reason=_reason(item, "parfait pour bien démarrer la journée"),
                photo_url=item.photo_url,
            ))
            current = end

    # ── Slot 2: Cultural Visit ────────────────────────────────────────────────
    if _can_fit(120) and (kickoff - current).total_seconds() / 60 > 240:
        item = _best(candidates, [
            "musée", "museum", "monument", "culture", "médina", "patrimoine",
            "kasbah", "minaret", "remparts", "attraction", "visite",
        ], used, max_km=8)
        if item:
            used.add(item.id)
            end = _add(current, 120)
            plan.append(PlanStep(
                startTime=_fmt(current), endTime=_fmt(end),
                type="culture", title=item.title,
                description=item.description or "Profitez du temps avant le match pour découvrir Rabat.",
                latitude=item.latitude, longitude=item.longitude,
                distanceFromUserKm=item.distance_km,
                distanceToStadiumKm=item.stadium_distance_km,
                estimatedDurationMinutes=120,
                reason=_reason(item, "idéal pour découvrir la culture marocaine avant le match"),
                photo_url=item.photo_url,
            ))
            current = end

    # ── Slot 3: Lunch ─────────────────────────────────────────────────────────
    lunch_target = kickoff.replace(hour=12, minute=0, second=0, microsecond=0)
    if current < lunch_target and _add(lunch_target, 90 + 15) <= latest_departure:
        current = lunch_target

    if _can_fit(90) and (kickoff - current).total_seconds() / 60 > 150:
        item = _best(candidates, [
            "restaurant", "resto", "food", "gastro", "cuisine", "tajine", "couscous",
        ], used, max_km=8)
        if item:
            used.add(item.id)
            end = _add(current, 90)
            plan.append(PlanStep(
                startTime=_fmt(current), endTime=_fmt(end),
                type="food", title=item.title,
                description=item.description or "Un déjeuner marocain pour faire le plein d'énergie avant le match.",
                latitude=item.latitude, longitude=item.longitude,
                distanceFromUserKm=item.distance_km,
                distanceToStadiumKm=item.stadium_distance_km,
                estimatedDurationMinutes=90,
                reason=_reason(item, "déjeuner avant le grand match"),
                photo_url=item.photo_url,
            ))
            current = end

    # ── Slot 4: Artisan / Afternoon Activity ──────────────────────────────────
    if _can_fit(90) and (kickoff - current).total_seconds() / 60 > 180:
        item = _best(candidates, [
            "artisan", "artisanat", "souk", "boutique", "shopping", "commerce",
            "activité", "balade", "promenade", "parc",
        ], used, max_km=8)
        if item:
            used.add(item.id)
            end = _add(current, 90)
            plan.append(PlanStep(
                startTime=_fmt(current), endTime=_fmt(end),
                type="shopping", title=item.title,
                description=item.description or "Explorez l'artisanat et les commerces locaux.",
                latitude=item.latitude, longitude=item.longitude,
                distanceFromUserKm=item.distance_km,
                distanceToStadiumKm=item.stadium_distance_km,
                estimatedDurationMinutes=90,
                reason=_reason(item, "idéal pour l'après-midi avant le match"),
                photo_url=item.photo_url,
            ))
            current = end

    # ── Slot 5: Pre-match Warmup (Fan Zone / Bar / Café) ─────────────────────
    prematch_target = _add(kickoff, -120)
    if current < prematch_target and prematch_target < latest_departure:
        current = prematch_target

    if current < latest_departure and _minutes_to_latest() > 20:
        item = _best(candidates, [
            "fan zone", "fanzone", "bar sport", "sports bar",
            "bar", "café", "cafe", "coffee", "pub",
        ], used)
        prematch_end = _add(latest_departure, -5)
        if item and prematch_end > current:
            used.add(item.id)
            duration = int((prematch_end - current).total_seconds() / 60)
            plan.append(PlanStep(
                startTime=_fmt(current), endTime=_fmt(prematch_end),
                type="fan_zone", title=item.title,
                description=item.description or f"Chauffez l'ambiance avant {equipe1} vs {equipe2} !",
                latitude=item.latitude, longitude=item.longitude,
                distanceFromUserKm=item.distance_km,
                distanceToStadiumKm=item.stadium_distance_km,
                estimatedDurationMinutes=duration,
                reason=_reason(item, f"départ vers le stade à {_fmt(latest_departure)}"),
                photo_url=item.photo_url,
            ))
            current = prematch_end

    # ── Transport to stadium ──────────────────────────────────────────────────
    if latest_departure > now and travel_min > 0:
        plan.append(PlanStep(
            startTime=_fmt(latest_departure),
            endTime=_fmt(recommended_arrival),
            type="transport",
            title=f"Départ vers {stade}",
            description=(
                f"Dirigez-vous vers {stade}. {stade_address}. "
                f"Comptez environ {travel_min} minutes de trajet."
            ),
            latitude=match.get("stade_latitude"),
            longitude=match.get("stade_longitude"),
            distanceFromUserKm=user_to_stadium_km,
            distanceToStadiumKm=0.0,
            estimatedDurationMinutes=travel_min,
            reason=f"Arrivée recommandée au stade à {_fmt(recommended_arrival)}, 60 minutes avant le coup d'envoi.",
        ))

    # ── The match ─────────────────────────────────────────────────────────────
    match_end = _add(kickoff, 110)
    plan.append(PlanStep(
        startTime=kickoff_str,
        endTime=_fmt(match_end),
        type="match",
        title=f"⚽ {equipe1} vs {equipe2}",
        description=f"Coup d'envoi à {kickoff_str} au {stade}. {stade_address}",
        latitude=match.get("stade_latitude"),
        longitude=match.get("stade_longitude"),
        distanceFromUserKm=user_to_stadium_km,
        distanceToStadiumKm=0.0,
        estimatedDurationMinutes=110,
        reason="Le grand rendez-vous ! Ambiance unique de la Coupe du Monde au Maroc 🇲🇦",
    ))
    current = match_end

    # ── Post-match Celebration ────────────────────────────────────────────────
    post_start = _add(kickoff, 120)
    if current < post_start:
        current = post_start

    item = _best(candidates, [
        "restaurant", "bar", "bistro", "café", "cafe", "terrasse",
        "nightlife", "célébration", "brasserie",
    ], used)
    if item:
        used.add(item.id)
        end = _add(current, 120)
        plan.append(PlanStep(
            startTime=_fmt(current), endTime=_fmt(end),
            type="food", title=item.title,
            description=item.description or "Célébrez la victoire (ou consolez-vous) autour d'un bon repas !",
            latitude=item.latitude, longitude=item.longitude,
            distanceFromUserKm=item.distance_km,
            distanceToStadiumKm=item.stadium_distance_km,
            estimatedDurationMinutes=120,
            reason=_reason(item, "parfait pour l'après-match"),
            photo_url=item.photo_url,
        ))

    # ── Safety info ───────────────────────────────────────────────────────────
    time_to_kickoff_min = (kickoff - now).total_seconds() / 60
    warning = None
    if time_to_kickoff_min < 90:
        warning = (
            f"⚠️ Il reste moins de {int(time_to_kickoff_min)} minutes avant le coup d'envoi ! "
            f"Dirigez-vous directement vers {stade}."
        )
    elif time_to_kickoff_min < travel_min + 65:
        warning = (
            f"⚠️ Temps limité ! Partez maintenant vers {stade} "
            f"pour arriver avant {_fmt(recommended_arrival)}."
        )

    safety = SafetyInfo(
        kickoff=kickoff_str,
        recommendedArrival=_fmt(recommended_arrival),
        latestDepartureToStadium=_fmt(latest_departure),
        warningMessage=warning,
    )

    return plan, safety
