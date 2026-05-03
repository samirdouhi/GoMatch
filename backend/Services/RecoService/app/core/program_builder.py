"""
program_builder.py — Generates time-slotted day itineraries around a match.

Each slot has: time_str (start), end_time_str (end), duration_min, duration_label, photo.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional

from app.models.domain_models import CandidateItem
from app.models.response_models import DayProgram, ProgramSlot, RecommendationCard
from app.utils.geo import distance_text


@dataclass
class _SlotDef:
    key: str
    label: str
    emoji: str
    preferred_types: List[str]
    duration_min: int
    tip: str
    is_match: bool = False
    minutes_before_kickoff: Optional[int] = None


_FULL_DAY_SLOTS: List[_SlotDef] = [
    _SlotDef("breakfast", "Petit déjeuner", "☕",
             ["cafe", "café", "coffee", "salon de thé", "breakfast"],
             60, "Commence la journée tranquillement avant les visites.",
             minutes_before_kickoff=690),
    _SlotDef("morning_activity", "Visite matinale", "🏛️",
             ["musée", "museum", "monument", "attraction", "culture", "viewpoint", "médina", "patrimoine", "découverte"],
             90, "Le matin, la médina est fraîche et peu fréquentée — profites-en !",
             minutes_before_kickoff=510),
    _SlotDef("lunch", "Déjeuner", "🍽️",
             ["restaurant", "resto", "food", "gastro", "cuisine", "tajine", "couscous"],
             90, "Prends des forces pour le reste de la journée.",
             minutes_before_kickoff=360),
    _SlotDef("afternoon_activity", "Après-midi / Shopping", "🛍️",
             ["activity", "attraction", "shopping", "souk", "artisanat", "viewpoint", "découverte"],
             90, "Dernier tour avant le match — ramène un souvenir !",
             minutes_before_kickoff=210),
    _SlotDef("pre_match", "Ambiance pré-match", "🍺",
             ["fanzone", "fan zone", "bar sport", "bar", "cafe", "coffee", "sports bar"],
             90, "Rejoins l'ambiance supporters — arrive tôt, ça se remplit vite !",
             minutes_before_kickoff=120),
    _SlotDef("match", "MATCH ⚽", "⚽",
             [],
             120, "Le moment que tout le monde attendait.",
             is_match=True,
             minutes_before_kickoff=0),
    _SlotDef("post_match_dinner", "Dîner / Célébration", "🎉",
             ["restaurant", "bar", "nightlife", "bistro", "café", "tajine"],
             120, "Victoire ou pas, on mange bien ce soir !"),
    _SlotDef("hotel", "Repos / Hôtel", "🏨",
             ["hotel", "hôtel", "riad", "auberge", "maison d'hôtes", "gîte"],
             480, "Bonne nuit pour récupérer avant le lendemain."),
]

_PRE_MATCH_SLOTS: List[_SlotDef] = [
    _SlotDef("warm_up", "Café / Encas pré-match", "☕",
             ["cafe", "café", "coffee", "restaurant", "bistro", "snack"],
             60, "Prends une bonne base avant la soirée.",
             minutes_before_kickoff=210),
    _SlotDef("local_commerce", "Commerce local / Souvenir", "🛍️",
             ["boutique", "artisanat", "souk", "commerce", "shop", "magasin"],
             45, "Quelques minutes pour un souvenir ou une surprise.",
             minutes_before_kickoff=150),
    _SlotDef("fanzone", "Fan Zone & supporters", "🍺",
             ["fanzone", "fan zone", "bar sport", "bar", "sports bar", "écran géant"],
             90, "L'ambiance monte — rejoins les supporters !",
             minutes_before_kickoff=90),
    _SlotDef("match", "MATCH ⚽", "⚽",
             [],
             120, "C'est parti !",
             is_match=True,
             minutes_before_kickoff=0),
]

_POST_MATCH_SLOTS: List[_SlotDef] = [
    _SlotDef("dinner", "Dîner post-match", "🍽️",
             ["restaurant", "resto", "gastro", "cuisine", "bistro", "tajine"],
             90, "Tu mérites un bon repas après cette soirée."),
    _SlotDef("celebration", "Bar / Soirée", "🎉",
             ["bar", "nightlife", "club", "café", "bistro"],
             120, "La fête continue ou on se consolide entre amis."),
    _SlotDef("hotel", "Nuit / Riad", "🏨",
             ["hotel", "hôtel", "riad", "auberge", "maison d'hôtes"],
             480, "Un bon riad pour finir cette belle soirée."),
]

_MORNING_SLOTS: List[_SlotDef] = [
    _SlotDef("breakfast", "Petit déjeuner", "☕",
             ["cafe", "café", "coffee", "breakfast", "salon de thé"],
             60, "Le meilleur début de journée, bien installé."),
    _SlotDef("morning_visit", "Visite / Découverte", "🏛️",
             ["musée", "museum", "monument", "attraction", "culture", "viewpoint", "médina", "patrimoine"],
             120, "Le matin la ville est vivante et fraîche — c'est l'heure idéale."),
    _SlotDef("local_commerce", "Commerce local", "🛍️",
             ["boutique", "artisanat", "souk", "commerce", "marché", "épicerie"],
             45, "Un tour rapide chez les artisans du quartier."),
    _SlotDef("lunch", "Déjeuner", "🍽️",
             ["restaurant", "resto", "food", "gastro", "cuisine"],
             90, "Une pause bien méritée après la matinée."),
]

_EVENING_SLOTS: List[_SlotDef] = [
    _SlotDef("aperitif", "Apéritif / Terrasse", "🍹",
             ["cafe", "café", "bar", "terrasse", "salon de thé"],
             60, "Le coucher de soleil marocain depuis une belle terrasse, ça vaut le détour."),
    _SlotDef("dinner", "Dîner", "🍽️",
             ["restaurant", "resto", "gastro", "cuisine", "tajine", "couscous"],
             90, "Une belle table pour la soirée — le Maroc régale !"),
    _SlotDef("nightlife", "Sortie nocturne", "🌙",
             ["bar", "nightlife", "club", "bistro", "fanzone"],
             120, "La nuit marocaine a du caractère."),
]

_PLAN_SLOTS = {
    "full_day_plan":   _FULL_DAY_SLOTS,
    "pre_match_plan":  _PRE_MATCH_SLOTS,
    "post_match_plan": _POST_MATCH_SLOTS,
    "morning_plan":    _MORNING_SLOTS,
    "evening_plan":    _EVENING_SLOTS,
}

# Default fallback times when no kickoff is available
_DEFAULT_TIMES = {
    "breakfast": "08:30",
    "morning_activity": "10:30",
    "morning_visit": "10:00",
    "lunch": "13:00",
    "afternoon_activity": "15:30",
    "local_commerce": "16:30",
    "pre_match": "18:00",
    "warm_up": "17:30",
    "fanzone": "19:00",
    "match": "20:00",
    "post_match_dinner": "22:30",
    "dinner": "20:30",
    "celebration": "22:30",
    "aperitif": "18:30",
    "nightlife": "22:00",
    "hotel": "00:30",
}


def _duration_label(duration_min: int) -> str:
    if duration_min < 60:
        return f"{duration_min}min"
    hours = duration_min // 60
    mins = duration_min % 60
    if mins == 0:
        return f"{hours}h"
    return f"{hours}h{mins:02d}"


def _add_minutes(time_str: str, minutes: int) -> str:
    try:
        h, m = map(int, time_str.split(":"))
        total = h * 60 + m + minutes
        return f"{(total // 60) % 24:02d}:{total % 60:02d}"
    except Exception:
        return time_str


def _item_blob(item: CandidateItem) -> str:
    return (
        f"{(item.source or '').lower()} "
        f"{(item.type or '').lower()} "
        f"{(item.title or '').lower()} "
        f"{(item.description or '').lower()} "
        f"{' '.join(str(t).lower() for t in item.tags)}"
    )


# Keys of slots where proximity to the stadium matters most
_STADIUM_PROXIMITY_SLOTS = {"pre_match", "fanzone", "warm_up", "post_match_dinner", "celebration"}


def _score_item_for_slot(item: CandidateItem, slot: _SlotDef) -> float:
    blob = _item_blob(item)
    local_bonus = 0.15 if (item.source == "business" and "commerce" in slot.key) else 0.0

    type_score = 0.0
    for i, keyword in enumerate(slot.preferred_types):
        if keyword in blob:
            type_score = 1.0 - i * 0.08 + local_bonus
            break

    # For pre-match and post-match celebration slots: strongly prefer near stadium
    stadium_bonus = 0.0
    if slot.key in _STADIUM_PROXIMITY_SLOTS and item.stadium_distance_km is not None:
        sd = item.stadium_distance_km
        if sd < 0.5:   stadium_bonus = 0.60
        elif sd < 1:   stadium_bonus = 0.45
        elif sd < 2:   stadium_bonus = 0.30
        elif sd < 3:   stadium_bonus = 0.15

    # For morning / cultural slots: prefer items NOT too close to stadium (city center vibe)
    city_bonus = 0.0
    if slot.key in ("breakfast", "morning_activity", "morning_visit", "lunch", "afternoon_activity"):
        dist_from_user = item.distance_km
        if dist_from_user is not None and dist_from_user < 3:
            city_bonus = 0.10

    return type_score + stadium_bonus + city_bonus + local_bonus


def _best_for_slot(
    candidates: List[CandidateItem],
    slot: _SlotDef,
    used_ids: set[str],
) -> Optional[CandidateItem]:
    eligible = [c for c in candidates if c.id not in used_ids]
    if not eligible:
        return None
    scored = sorted(
        eligible,
        key=lambda c: _score_item_for_slot(c, slot) * 2 + (c.final_score or 0.0),
        reverse=True,
    )
    return scored[0]


def _to_card(item: CandidateItem) -> RecommendationCard:
    return RecommendationCard(
        id=item.id,
        source=item.source,
        type=item.type,
        title=item.title,
        subtitle=item.type,
        description=item.description,
        latitude=item.latitude,
        longitude=item.longitude,
        distance_text=distance_text(item.distance_km),
        price_level=item.price_level,
        rating=item.rating,
        review_count=item.review_count,
        tags=item.tags,
        actions=["view_detail", "view_on_map", "add_to_plan"],
        photo_url=item.photo_url,
    )


def build_program(
    intent: str,
    candidates: List[CandidateItem],
    match: Optional[dict],
    kickoff: Optional[datetime] = None,
) -> Optional[DayProgram]:
    slot_defs = _PLAN_SLOTS.get(intent)
    if not slot_defs:
        return None

    m = match or {}
    team1        = m.get("equipe1") or m.get("team1")
    team2        = m.get("equipe2") or m.get("team2")
    city         = m.get("ville")   or m.get("city")
    stade        = m.get("stade")
    stade_adresse = m.get("stade_adresse")
    date_affichage = m.get("date_affichage")
    kickoff_str  = kickoff.strftime("%H:%M") if kickoff else m.get("heure")

    # Calculate post-match start time (kickoff + 2h)
    post_match_start: Optional[str] = None
    if kickoff:
        post_match_start = _add_minutes(kickoff.strftime("%H:%M"), 120)

    post_match_cursor: Optional[str] = post_match_start

    used_ids: set[str] = set()
    slots: List[ProgramSlot] = []
    fallback_hour = 8

    for slot_def in slot_defs:
        # Compute start time
        if slot_def.is_match:
            time_str = kickoff.strftime("%H:%M") if kickoff else _DEFAULT_TIMES.get(slot_def.key, "20:00")
        elif slot_def.minutes_before_kickoff is not None:
            if kickoff:
                t = kickoff - timedelta(minutes=slot_def.minutes_before_kickoff)
                time_str = t.strftime("%H:%M")
            else:
                time_str = _DEFAULT_TIMES.get(slot_def.key, f"{fallback_hour:02d}:00")
        else:
            # Post-match slot: use cursor
            if post_match_cursor:
                time_str = post_match_cursor
            else:
                time_str = _DEFAULT_TIMES.get(slot_def.key, f"{fallback_hour:02d}:00")

        end_time_str = _add_minutes(time_str, slot_def.duration_min)
        dur_label = _duration_label(slot_def.duration_min)

        # Advance fallback hour
        fallback_hour += max(1, slot_def.duration_min // 60)

        # Advance post-match cursor
        if slot_def.minutes_before_kickoff is None and not slot_def.is_match:
            post_match_cursor = end_time_str

        if slot_def.is_match:
            slots.append(ProgramSlot(
                slot_key=slot_def.key,
                time_str=time_str,
                end_time_str=end_time_str,
                duration_min=slot_def.duration_min,
                duration_label=dur_label,
                label=slot_def.label,
                emoji=slot_def.emoji,
                tip=slot_def.tip,
                is_match=True,
                card=None,
            ))
            continue

        best = _best_for_slot(candidates, slot_def, used_ids)
        if best:
            used_ids.add(best.id)

        slots.append(ProgramSlot(
            slot_key=slot_def.key,
            time_str=time_str,
            end_time_str=end_time_str,
            duration_min=slot_def.duration_min,
            duration_label=dur_label,
            label=slot_def.label,
            emoji=slot_def.emoji,
            tip=slot_def.tip,
            is_match=False,
            card=_to_card(best) if best else None,
        ))

    return DayProgram(
        match_team1=team1,
        match_team2=team2,
        match_kickoff=kickoff_str,
        match_date=date_affichage,
        match_city=city,
        match_stadium=stade,
        match_stadium_address=stade_adresse,
        slots=slots,
    )
