"""
off_day_planner.py — Discovery day itinerary for Rabat (no match constraint).

Builds a geographically coherent, culturally rich day:
  breakfast → cultural morning → lunch → artisan afternoon → café → sunset → dinner

Scoring for off-day prioritizes:
  - cultural value and diversity
  - route coherence (minimize unnecessary travel)
  - experiential variety (no two consecutive same-type slots)
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.models.domain_models import CandidateItem
from app.models.response_models import PlanStep


def _fmt(dt: datetime) -> str:
    return dt.strftime("%H:%M")


def _add(base: datetime, minutes: int) -> datetime:
    return base + timedelta(minutes=minutes)


def _blob(item: CandidateItem) -> str:
    return f"{item.type} {item.title} {item.description or ''} {' '.join(item.tags)}".lower()


def _best(
    candidates: List[CandidateItem],
    preferred: List[str],
    used: set,
    avoid: Optional[List[str]] = None,
    max_km: Optional[float] = None,
) -> Optional[CandidateItem]:
    avoid = avoid or []

    def _ok(item: CandidateItem) -> bool:
        if item.id in used:
            return False
        if max_km and item.distance_km and item.distance_km > max_km:
            return False
        b = _blob(item)
        if avoid and any(a in b for a in avoid):
            return False
        return any(kw in b for kw in preferred)

    matching = [i for i in candidates if _ok(i)]
    if not matching:
        # Relax keyword filter but keep used/avoid/distance constraints
        matching = [i for i in candidates if i.id not in used and
                    (max_km is None or i.distance_km is None or i.distance_km <= max_km) and
                    not (avoid and any(a in _blob(i) for a in avoid))]
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
    return ", ".join(parts) if parts else "un incontournable de Rabat"


def build_off_day_plan(
    candidates: List[CandidateItem],
    profile: Optional[Dict[str, Any]] = None,
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
    city: str = "Rabat",
    constraints: Optional[Dict[str, Any]] = None,
) -> List[PlanStep]:
    """
    Build a full off-day discovery itinerary for Rabat.

    Returns an ordered list of PlanStep.
    """
    plan: List[PlanStep] = []
    used: set = set()
    constraints = constraints or {}
    profile = profile or {}

    # Determine start time
    now = datetime.now()
    day_start = now.replace(hour=8, minute=30, second=0, microsecond=0)
    if day_start < now:
        # Past 8:30 → start at next full hour
        day_start = (now + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
    current = day_start

    # Respect available time constraint
    time_avail = constraints.get("time_available_minutes")
    day_end = _add(current, time_avail) if time_avail else current.replace(hour=22, minute=0)

    def _slot_available(duration_min: int) -> bool:
        return _add(current, duration_min) <= day_end

    # Adjust for group type
    prefs = profile.get("preferences") or {}
    group = prefs.get("groupe") or constraints.get("group_type")
    is_family = group == "family"

    # ── Slot 1: Breakfast / Café ──────────────────────────────────────────────
    if _slot_available(90):
        item = _best(candidates, [
            "café", "cafe", "coffee", "salon de thé", "petit déjeuner",
            "breakfast", "thé", "msemen", "pâtisserie",
        ], used)
        if item:
            used.add(item.id)
            end = _add(current, 90)
            plan.append(PlanStep(
                startTime=_fmt(current), endTime=_fmt(end),
                type="cafe", title=item.title,
                description=item.description or f"Commencez votre journée de découverte de {city} autour d'un café marocain.",
                latitude=item.latitude, longitude=item.longitude,
                distanceFromUserKm=item.distance_km,
                distanceToStadiumKm=None,
                estimatedDurationMinutes=90,
                reason=_reason(item, f"meilleur point de départ pour explorer {city}"),
                photo_url=item.photo_url,
            ))
            current = end

    # ── Slot 2: Cultural Morning Visit ────────────────────────────────────────
    if _slot_available(120):
        cultural_kw = [
            "musée", "museum", "monument", "médina", "patrimoine", "culture",
            "historique", "kasbah", "minaret", "remparts", "tour hassan",
            "chellah", "oudayas", "mausolée",
        ]
        if is_family:
            cultural_kw.extend(["jardin", "parc", "accessible", "familial"])

        item = _best(candidates, cultural_kw, used)
        if item:
            used.add(item.id)
            end = _add(current, 120)
            plan.append(PlanStep(
                startTime=_fmt(current), endTime=_fmt(end),
                type="culture", title=item.title,
                description=item.description or f"Découvrez le patrimoine historique de {city}.",
                latitude=item.latitude, longitude=item.longitude,
                distanceFromUserKm=item.distance_km,
                distanceToStadiumKm=None,
                estimatedDurationMinutes=120,
                reason=_reason(item, f"incontournable pour comprendre l'histoire de {city}"),
                photo_url=item.photo_url,
            ))
            current = end

    # ── Slot 3: Lunch ─────────────────────────────────────────────────────────
    lunch_target = day_start.replace(hour=12, minute=0, second=0, microsecond=0)
    if current < lunch_target and _slot_available(90):
        current = lunch_target

    if _slot_available(90):
        item = _best(candidates, [
            "restaurant", "resto", "food", "gastro", "cuisine",
            "tajine", "couscous", "rfissa", "bastilla", "harira",
        ], used)
        if item:
            used.add(item.id)
            end = _add(current, 90)
            plan.append(PlanStep(
                startTime=_fmt(current), endTime=_fmt(end),
                type="food", title=item.title,
                description=item.description or "Savourez la gastronomie marocaine authentique.",
                latitude=item.latitude, longitude=item.longitude,
                distanceFromUserKm=item.distance_km,
                distanceToStadiumKm=None,
                estimatedDurationMinutes=90,
                reason=_reason(item, "cuisine locale authentique"),
                photo_url=item.photo_url,
            ))
            current = end

    # ── Slot 4: Artisan / Souk ────────────────────────────────────────────────
    artisan_target = day_start.replace(hour=14, minute=0, second=0, microsecond=0)
    if current < artisan_target and _slot_available(90):
        current = artisan_target

    if _slot_available(90):
        item = _best(candidates, [
            "artisan", "artisanat", "souk", "marché", "boutique", "commerce",
            "poterie", "zellige", "tissage", "maroquinerie", "bijoux", "cuir",
        ], used, avoid=["restaurant", "café", "hôtel"])
        if item:
            used.add(item.id)
            end = _add(current, 90)
            plan.append(PlanStep(
                startTime=_fmt(current), endTime=_fmt(end),
                type="shopping", title=item.title,
                description=item.description or "Explorez l'artisanat marocain et ramenez un souvenir authentique.",
                latitude=item.latitude, longitude=item.longitude,
                distanceFromUserKm=item.distance_km,
                distanceToStadiumKm=None,
                estimatedDurationMinutes=90,
                reason=_reason(item, "l'artisanat marocain à son meilleur"),
                photo_url=item.photo_url,
            ))
            current = end

    # ── Slot 5: Afternoon Café / Pause ────────────────────────────────────────
    if _slot_available(60):
        item = _best(candidates, [
            "café", "cafe", "coffee", "salon de thé", "thé à la menthe",
            "pâtisserie", "cornet", "jus",
        ], used)
        if item:
            used.add(item.id)
            end = _add(current, 60)
            plan.append(PlanStep(
                startTime=_fmt(current), endTime=_fmt(end),
                type="cafe", title=item.title,
                description=item.description or "Une pause thé à la menthe bien méritée.",
                latitude=item.latitude, longitude=item.longitude,
                distanceFromUserKm=item.distance_km,
                distanceToStadiumKm=None,
                estimatedDurationMinutes=60,
                reason=_reason(item, "pause idéale après l'après-midi culturelle"),
                photo_url=item.photo_url,
            ))
            current = end

    # ── Slot 6: Sunset Walk / Panorama ───────────────────────────────────────
    if _slot_available(90) and (day_end - current).total_seconds() / 60 > 150:
        item = _best(candidates, [
            "corniche", "plage", "promenade", "parc", "jardin", "panorama",
            "viewpoint", "vue", "coucher", "terrasse", "remparts", "oudayas",
        ], used, avoid=["restaurant", "hôtel", "hotel"])
        if item:
            used.add(item.id)
            end = _add(current, 90)
            plan.append(PlanStep(
                startTime=_fmt(current), endTime=_fmt(end),
                type="culture", title=item.title,
                description=item.description or f"Profitez d'une promenade et du coucher de soleil sur {city}.",
                latitude=item.latitude, longitude=item.longitude,
                distanceFromUserKm=item.distance_km,
                distanceToStadiumKm=None,
                estimatedDurationMinutes=90,
                reason=_reason(item, "moment parfait pour admirer Rabat en fin de journée"),
                photo_url=item.photo_url,
            ))
            current = end

    # ── Slot 7: Dinner ────────────────────────────────────────────────────────
    dinner_target = day_start.replace(hour=19, minute=0, second=0, microsecond=0)
    if current < dinner_target and _slot_available(120):
        current = dinner_target

    if _slot_available(120):
        item = _best(candidates, [
            "restaurant", "resto", "food", "gastro", "cuisine",
            "tajine", "grillades", "terrasse", "brasserie",
        ], used)
        if item:
            used.add(item.id)
            end = _add(current, 120)
            plan.append(PlanStep(
                startTime=_fmt(current), endTime=_fmt(end),
                type="food", title=item.title,
                description=item.description or f"Terminez cette belle journée à {city} autour d'un dîner marocain.",
                latitude=item.latitude, longitude=item.longitude,
                distanceFromUserKm=item.distance_km,
                distanceToStadiumKm=None,
                estimatedDurationMinutes=120,
                reason=_reason(item, "le meilleur pour finir cette journée de découverte"),
                photo_url=item.photo_url,
            ))

    return plan
