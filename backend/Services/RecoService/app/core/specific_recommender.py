"""
specific_recommender.py — Returns ranked recommendations for focused requests.

Used for: specific_food, specific_cafe, specific_activity, fan_zone_request,
          match_watch, after_match_plan, nearby_request, hotel_search,
          family_plan, cheap_plan, cultural_plan, route_plan, short_plan,
          discovery_search, local_commerce_search, and other non-plan intents.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.models.domain_models import CandidateItem

# ── Intent → preferred type keywords ─────────────────────────────────────────

_INTENT_TYPES: dict[str, list[str]] = {
    "specific_food":          ["restaurant", "resto", "food", "gastro", "cuisine", "tajine", "couscous"],
    "specific_cafe":          ["café", "cafe", "coffee", "salon de thé", "thé", "breakfast"],
    "specific_activity":      ["musée", "monument", "activité", "attraction", "culture", "visite", "excursion", "balade"],
    "fan_zone_request":       ["fan zone", "fanzone", "bar sport", "sports bar", "écran géant", "foot"],
    "match_watch":            ["fan zone", "fanzone", "bar sport", "sports bar", "écran géant", "café", "restaurant"],
    "after_match_plan":       ["restaurant", "bar", "célébration", "nightlife", "bistro", "terrasse", "café"],
    "nearby_request":         [],   # Any type, sorted by distance
    "hotel_search":           ["hotel", "hôtel", "riad", "auberge", "maison d'hôtes"],
    "local_commerce_search":  ["artisan", "artisanat", "souk", "boutique", "commerce"],
    "discovery_search":       ["musée", "monument", "patrimoine", "culture", "médina", "attraction"],
    "morning_plan":           ["café", "cafe", "breakfast", "salon de thé", "musée", "monument"],
    "evening_plan":           ["restaurant", "bar", "terrasse", "nightlife", "bistro"],
    "pre_match_plan":         ["fan zone", "fanzone", "bar sport", "café", "restaurant"],
    "family_plan":            ["musée", "monument", "activité", "attraction", "café", "restaurant", "outdoor"],
    "cheap_plan":             ["café", "café", "restaurant", "resto", "activité"],
    "cultural_plan":          ["musée", "monument", "patrimoine", "médina", "culture", "artisanat", "kasbah"],
    "route_plan":             [],   # Mix of types for route
    "short_plan":             ["café", "cafe", "monument", "activité", "restaurant"],
    "post_match_plan":        ["restaurant", "bar", "célébration", "nightlife"],
    "cafe_search":            ["café", "cafe", "coffee", "salon de thé"],
    "restaurant_search":      ["restaurant", "resto", "food", "cuisine", "tajine"],
    "activity_search":        ["musée", "monument", "activité", "attraction", "culture"],
    "fanzone_search":         ["fan zone", "fanzone", "bar sport", "sports bar"],
    "general_recommendation": [],
    "unknown":                [],
}


def _blob(item: CandidateItem) -> str:
    return f"{item.type} {item.title} {item.description or ''} {' '.join(item.tags)}".lower()


def get_specific_recommendations(
    intent: str,
    candidates: List[CandidateItem],
    max_items: int = 5,
    match: Optional[Dict[str, Any]] = None,
) -> List[CandidateItem]:
    """
    Return top N candidates relevant to the specific intent, already scored.

    For nearby_request: sorted by distance.
    For all others: type-filtered then sorted by final_score.
    """
    preferred_types = _INTENT_TYPES.get(intent, [])

    if intent == "nearby_request":
        return sorted(candidates, key=lambda x: (x.distance_km or 9999))[:max_items]

    if intent == "cheap_plan":
        # Prefer cheaper items and discount items without price_level
        def cheap_sort(i: CandidateItem) -> tuple:
            price_rank = {"low": 0, "medium": 1, "high": 2}.get(
                (i.price_level or "").lower(), 1
            )
            return (price_rank, -i.final_score)
        return sorted(candidates, key=cheap_sort)[:max_items]

    if intent == "family_plan":
        family_kw = ["famille", "enfant", "kids", "accessible", "familial", "outdoor"]
        family_boost = [i for i in candidates if any(k in _blob(i) for k in family_kw)]
        rest = [i for i in candidates if i not in family_boost]
        combined = sorted(family_boost, key=lambda x: -x.final_score) + sorted(rest, key=lambda x: -x.final_score)
        return combined[:max_items]

    if preferred_types:
        matching = [i for i in candidates if any(kw in _blob(i) for kw in preferred_types)]
        if len(matching) < max_items:
            seen = {i.id for i in matching}
            extras = [i for i in candidates if i.id not in seen]
            extras.sort(key=lambda x: x.final_score, reverse=True)
            matching.extend(extras[:max_items - len(matching)])
    else:
        matching = list(candidates)

    matching.sort(key=lambda x: x.final_score, reverse=True)
    return matching[:max_items]


def diversify(candidates: List[CandidateItem], max_items: int = 5) -> List[CandidateItem]:
    """
    Select up to max_items candidates ensuring broad type diversity.
    Max 2 items per broad type.
    """
    selected: List[CandidateItem] = []
    type_counts: dict[str, int] = {}

    for item in candidates:
        if len(selected) >= max_items:
            break
        t = (item.type or "unknown").lower()
        if type_counts.get(t, 0) < 2:
            selected.append(item)
            type_counts[t] = type_counts.get(t, 0) + 1

    if len(selected) < max_items:
        seen_ids = {i.id for i in selected}
        remaining = [i for i in candidates if i.id not in seen_ids]
        selected.extend(remaining[:max_items - len(selected)])

    return selected[:max_items]
