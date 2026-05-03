"""
scoring_engine.py — Explainable multi-factor recommendation scoring.

Formula (spec v3):
  scoreTotal =
    distanceScore     * 0.25
    + intentMatchScore  * 0.25
    + contextMatchScore * 0.15
    + ratingScore       * 0.15
    + openingScore      * 0.10
    + diversityScore    * 0.05
    + localImpactScore  * 0.05

Each component returns [0, 1]. Max total ≈ 1.00.
scoreTotal * 100 = score on 100-point scale for display.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

from app.core.context_builder import RecommendationContext
from app.models.domain_models import CandidateItem
from app.utils.budget import normalize_budget

# ── Type keyword banks ────────────────────────────────────────────────────────

_TYPE_KEYWORDS: dict[str, list[str]] = {
    "cafe":       ["cafe", "café", "coffee", "salon de thé", "thé", "breakfast", "petit déjeuner"],
    "restaurant": ["restaurant", "resto", "food", "gastro", "cuisine", "tajine", "couscous", "brasserie"],
    "hotel":      ["hotel", "hôtel", "riad", "auberge", "maison d'hôtes", "gîte", "hébergement"],
    "activity":   ["activity", "attraction", "museum", "musée", "monument", "visite", "viewpoint", "découverte", "excursion"],
    "cultural":   ["museum", "musée", "monument", "attraction", "culture", "patrimoine", "médina", "minaret", "remparts", "kasbah"],
    "fanzone":    ["fanzone", "fan zone", "bar sport", "sports bar", "écran géant", "foot", "supporter"],
    "nightlife":  ["nightlife", "bar", "club", "discothèque", "boîte", "soirée"],
    "souk":       ["souk", "marché", "artisanat", "boutique", "commerce", "shop", "artisan"],
}

_CULTURAL_KEYWORDS = [
    "musée", "museum", "monument", "patrimoine", "médina", "kasbah", "minaret",
    "remparts", "culture", "historique", "attraction", "viewpoint", "découverte",
    "site", "archéologie", "galerie", "art", "tradition",
]

_FANZONE_KEYWORDS = [
    "fan zone", "fanzone", "bar sport", "sports bar", "foot", "football",
    "supporter", "écran géant", "grand écran",
]

_AMBIANCE_TAGS: dict[str, list[str]] = {
    "calm":     ["calme", "tranquille", "zen", "quiet", "reposant", "paisible"],
    "calme":    ["calme", "tranquille", "zen", "quiet"],
    "animated": ["festif", "animé", "vivant", "convivial", "ambiance"],
    "animé":    ["festif", "animé", "vivant", "convivial"],
    "cultural": ["culture", "culturel", "historique", "patrimoine", "art", "musée"],
    "culturel": ["culture", "culturel", "historique", "patrimoine"],
    "sport":    ["sport", "foot", "football", "supporter", "fan"],
}

_GROUP_AFFINITIES: dict[str, list[str]] = {
    "family":  ["famille", "enfant", "kids", "accessible", "familial", "sécurisé"],
    "couple":  ["romantique", "couple", "intime", "vue", "terrasse"],
    "friends": ["animé", "groupe", "festif", "bar", "convivial"],
    "solo":    ["calme", "tranquille", "culturel", "lecture"],
}

_SLOT_TYPE_AFFINITY: dict[str, list[str]] = {
    "morning":    ["cafe", "coffee", "salon de thé", "cultural", "musée", "monument", "viewpoint"],
    "lunch":      ["restaurant", "resto", "food", "gastro", "tajine", "cafe"],
    "afternoon":  ["cultural", "activity", "attraction", "musée", "monument", "souk", "artisanat"],
    "pre_match":  ["fanzone", "fan zone", "bar", "cafe", "coffee", "restaurant"],
    "match_time": ["fanzone", "bar", "sports bar"],
    "post_match": ["restaurant", "bar", "nightlife", "bistro", "cafe", "célébration"],
    "evening":    ["restaurant", "bar", "nightlife", "bistro", "terrasse"],
    "night":      ["bar", "nightlife", "club", "restaurant"],
    "late_night": ["bar", "nightlife", "club"],
}

# Intent → preferred type mapping for intentMatchScore boost
_INTENT_TYPE_MAP: dict[str, str] = {
    "specific_food":         "restaurant",
    "specific_cafe":         "cafe",
    "hotel_search":          "hotel",
    "specific_activity":     "activity",
    "cultural_plan":         "cultural",
    "fan_zone_request":      "fanzone",
    "match_watch":           "fanzone",
    "evening_plan":          "nightlife",
    "local_commerce_search": "souk",
    "discovery_search":      "cultural",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _blob(item: CandidateItem) -> str:
    return (
        f"{(item.source or '').lower()} "
        f"{(item.type or '').lower()} "
        f"{(item.title or '').lower()} "
        f"{(item.description or '').lower()} "
        f"{' '.join(str(t).lower() for t in item.tags)}"
    )


def _contains(text: str, keywords: list[str]) -> bool:
    return any(k in text for k in keywords)


# ── Component scorers (each returns [0, 1]) ───────────────────────────────────

def _distance_score(item: CandidateItem) -> float:
    """Proximity to user. Highest weight: 0.25."""
    d = item.distance_km
    if d is None:
        return 0.50   # Neutral when no user location
    if d < 0.30:  return 1.00
    if d < 0.50:  return 0.90
    if d < 1.00:  return 0.75
    if d < 2.00:  return 0.55
    if d < 3.00:  return 0.38
    if d < 5.00:  return 0.22
    if d < 10.0:  return 0.10
    return 0.02


def _intent_match_score(item: CandidateItem, ctx: RecommendationContext) -> float:
    """
    How well the item matches what the user asked for.
    Combines: place-type match (0.60) + intent-type affinity (0.20) + ambiance (0.15) + group (0.10).
    Family/cheap plan bonuses included.
    Weight: 0.25.
    """
    profile = ctx.profile or {}
    prefs = profile.get("preferences") or {}
    b = _blob(item)
    score = 0.0

    # Place-type match (up to 0.60)
    requested_type = ctx.constraints.get("requested_place_type")
    types_lieux = prefs.get("types_lieux") or []
    all_preferred = ([requested_type] + list(types_lieux)) if requested_type else list(types_lieux)

    if all_preferred:
        for t in all_preferred:
            keywords = _TYPE_KEYWORDS.get(t, [t])
            if _contains(b, keywords):
                score += 0.60
                break

    # Intent-type affinity (up to 0.20) — e.g. specific_food → boost restaurants
    intent_type = _INTENT_TYPE_MAP.get(ctx.intent)
    if intent_type:
        keywords = _TYPE_KEYWORDS.get(intent_type, [])
        if _contains(b, keywords):
            score += 0.20

    # Ambiance match (up to 0.15)
    ambiance = ctx.constraints.get("ambiance") or prefs.get("ambiance")
    if ambiance:
        tags = _AMBIANCE_TAGS.get(str(ambiance).lower(), [str(ambiance)])
        if _contains(b, tags):
            score += 0.15

    # Group affinity (up to 0.10)
    groupe = ctx.constraints.get("group_type") or prefs.get("groupe")
    if groupe:
        affinities = _GROUP_AFFINITIES.get(str(groupe).lower(), [])
        if _contains(b, affinities):
            score += 0.10

    # Family plan: boost accessible / family-friendly places
    if ctx.intent == "family_plan":
        family_kw = ["famille", "enfant", "accessible", "sécurisé", "familial", "kids", "outdoor"]
        if _contains(b, family_kw):
            score += 0.20

    # Cheap plan: boost budget-friendly
    if ctx.intent == "cheap_plan":
        cheap_kw = ["économique", "abordable", "pas cher", "budget", "gratuit"]
        if _contains(b, cheap_kw) or item.price_level == "low":
            score += 0.20

    # Cultural plan: boost cultural venues
    if ctx.intent == "cultural_plan":
        if _contains(b, _CULTURAL_KEYWORDS):
            score += 0.20

    return min(score, 1.0)


def _context_match_score(item: CandidateItem, ctx: RecommendationContext) -> float:
    """
    Context: stadium/city proximity (60%) + time-slot compatibility (40%).
    Weight: 0.15.
    """
    _match_intents = {
        "match_day_plan", "pre_match_plan", "after_match_plan",
        "fan_zone_request", "match_watch", "full_day_plan", "post_match_plan",
    }

    # Stadium proximity component
    stad_score = 0.0
    if ctx.intent in _match_intents:
        d = item.stadium_distance_km
        if d is None:
            d = item.distance_km
        if d is not None:
            if d < 0.30:  stad_score = 1.00
            elif d < 0.50: stad_score = 0.85
            elif d < 1.00: stad_score = 0.70
            elif d < 2.00: stad_score = 0.45
            elif d < 3.00: stad_score = 0.20
            elif d < 5.00: stad_score = 0.08
        else:
            stad_score = 0.40   # Unknown
    else:
        # Off-day / specific: proximity to user acts as city-center proxy
        d = item.distance_km
        if d is not None:
            if d < 1.00:  stad_score = 0.70
            elif d < 3.00: stad_score = 0.50
            elif d < 6.00: stad_score = 0.25
        else:
            stad_score = 0.40

    # Time slot compatibility
    slot = ctx.time_slot
    affinity = _SLOT_TYPE_AFFINITY.get(slot, [])
    b = _blob(item)

    time_avail = ctx.constraints.get("time_available_minutes")
    time_penalty = 0.0
    if time_avail is not None and time_avail < 60:
        # Penalize long activities when user has < 1h
        if _contains(b, ["musée", "museum", "monument", "excursion", "randonnée"]):
            time_penalty = 0.30

    time_score = 0.05
    for i, keyword in enumerate(affinity):
        if keyword in b:
            time_score = max(1.0 - i * 0.12, 0.20)
            break
    time_score = max(time_score - time_penalty, 0.0)

    return min(stad_score * 0.60 + time_score * 0.40, 1.0)


def _rating_score(item: CandidateItem) -> float:
    """
    Normalized rating for business items. Neutral 0.55 for no data.
    Applies confidence factor based on review count.
    Weight: 0.15.
    """
    r = getattr(item, "rating", None)
    count = getattr(item, "review_count", None)

    if r is None:
        return 0.55   # New place — don't penalize

    try:
        normalized = min(max(float(r) / 5.0, 0.0), 1.0)
        if count is not None and count > 0:
            confidence = min(count / 20.0, 1.0)   # Full confidence at 20+ reviews
            return normalized * confidence + 0.55 * (1.0 - confidence)
        return normalized
    except (TypeError, ValueError):
        return 0.55


def _opening_score(item: CandidateItem) -> float:
    """
    Is the place open right now?
    1.0 = open, 0.5 = unknown, 0.2 = probably closed.
    Weight: 0.10.
    """
    hours_list = item.opening_hours
    if not hours_list:
        return 0.50

    now = datetime.now()
    current_minutes = now.hour * 60 + now.minute
    _time_pat = re.compile(r"(\d{1,2})[h:](\d{0,2})\s*[-–]\s*(\d{1,2})[h:](\d{0,2})")

    for entry in hours_list:
        m = _time_pat.search(str(entry).lower())
        if m:
            open_h, open_m_s, close_h, close_m_s = m.groups()
            open_m  = int(open_m_s)  if open_m_s  else 0
            close_m = int(close_m_s) if close_m_s else 0
            open_min  = int(open_h)  * 60 + open_m
            close_min = int(close_h) * 60 + close_m

            if close_min < open_min:   # Overnight (e.g. 22h–02h)
                if current_minutes >= open_min or current_minutes <= close_min:
                    return 1.0
            else:
                if open_min <= current_minutes <= close_min:
                    return 1.0

    return 0.20   # Hours present but none matched → probably closed


def _diversity_score(item: CandidateItem) -> float:
    """Cultural richness of the place. Binary. Weight: 0.05."""
    b = _blob(item)
    return 1.0 if _contains(b, _CULTURAL_KEYWORDS) else 0.0


def _local_impact_score(item: CandidateItem) -> float:
    """
    Favor GoMatch local partners (source='business') and events.
    Weight: 0.05.
    """
    if item.source == "business":
        return 1.0
    if item.source == "event":
        return 0.80
    return 0.0


def _compute_budget(item: CandidateItem, ctx: RecommendationContext) -> float:
    """Budget compatibility. Not in main formula but stored for explanation."""
    requested = normalize_budget(ctx.constraints.get("budget"))
    item_budget = normalize_budget(item.price_level)
    if not requested or not item_budget:
        return 0.0
    if requested == item_budget:
        return 1.0
    near = {("low", "medium"), ("medium", "low"), ("medium", "high"), ("high", "medium")}
    if (requested, item_budget) in near:
        return 0.5
    return -0.5


# ── Public scoring API ────────────────────────────────────────────────────────

def score_candidate(item: CandidateItem, ctx: RecommendationContext) -> CandidateItem:
    """
    Compute explainable score and store all components on the item.
    Returns the same item (mutated) for chaining.
    """
    dist_s  = _distance_score(item)
    intent_s = _intent_match_score(item, ctx)
    ctx_s   = _context_match_score(item, ctx)
    rating_s = _rating_score(item)
    opening_s = _opening_score(item)
    div_s   = _diversity_score(item)
    local_s = _local_impact_score(item)

    # Spec v3 component names
    item.distance_score     = dist_s
    item.intent_match_score = intent_s
    item.context_match_score = ctx_s
    item.rating_score       = rating_s
    item.opening_score      = opening_s
    item.diversity_score    = div_s
    item.local_impact_score = local_s

    # Legacy aliases (used by planners / response_builder)
    item.profile_score   = intent_s
    item.match_score     = ctx_s
    item.time_slot_score = ctx_s
    item.budget_score    = _compute_budget(item, ctx)
    item.fan_score       = (
        1.0 if _contains(_blob(item), _FANZONE_KEYWORDS)
        and ctx.intent in {"match_day_plan", "pre_match_plan", "fan_zone_request", "match_watch"}
        else 0.0
    )

    # Final score — distance × 0.40, rating × 0.30, match_relevance × 0.20, diversity × 0.10
    item.final_score = (
        dist_s    * 0.40
        + rating_s  * 0.30
        + intent_s  * 0.12
        + ctx_s     * 0.08
        + opening_s * 0.05
        + div_s     * 0.03
        + local_s   * 0.02
    )

    return item
