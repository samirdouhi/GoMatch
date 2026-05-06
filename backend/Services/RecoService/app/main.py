"""
main.py — GoMatch RecoService v3 (intelligent planning + chat engine).

Endpoints:
  GET  /api/reco/health        — health check
  POST /api/reco/chat          — main conversational assistant (spec v3)
  POST /api/reco/recommend     — direct recommendation (no conversation)
  POST /api/reco/day-plan      — full day itinerary generation
  POST /api/reco/before-match  — pre-match mode
  POST /api/reco/after-match   — post-match mode
  POST /conversation           — legacy endpoint (backward compat)
  GET  /                       — service info
  GET  /scenarios              — test scenarios
"""
from __future__ import annotations

import asyncio
from typing import List, Optional

from fastapi import FastAPI, HTTPException

from app.clients.business_client import BusinessClient
from app.clients.culture_client import CultureClient
from app.clients.discovery_client import DiscoveryClient
from app.clients.match_client import MatchClient
from app.clients.profile_client import ProfileClient
from app.config import settings
from app.core.candidate_normalizer import normalize_business_item, normalize_culture_item, normalize_discovery_item
from app.core.constraint_extractor import extract_constraints
from app.core.context_builder import RecommendationContext
from app.core.diversity_engine import (
    apply_excluded_penalty,
    apply_randomization,
    diversify_primary,
    get_alternatives,
)
from app.core.intent_classifier import classify_intent, get_mode
from app.core.itinerary_planner import plan_itinerary
from app.core.llm_responder import generate_response
from app.core.response_builder import (
    build_clarification_response,
    build_greeting_response,
    build_response,
)
from app.core.scoring_engine import score_candidate
from app.core.specific_recommender import get_specific_recommendations, diversify
from app.models.domain_models import CandidateItem
from app.models.request_models import (
    DayPlanRequest,
    MatchContextRequest,
    RecoChatRequest,
    RecommendationRequest,
)
from app.models.response_models import DayPlan, RecommendationResponse
from app.planners.multi_day_planner import build_multi_day_plan
from app.utils.geo import compute_distance_km

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

business_client  = BusinessClient()
culture_client   = CultureClient()
discovery_client = DiscoveryClient()
match_client     = MatchClient()
profile_client   = ProfileClient()

_CHAT_ONLY_INTENTS = {"greeting"}

# Intent → strict place-type filter when no explicit type detected in message text.
# This is what makes "sans ticket" show ONLY fan zones, "je veux manger" ONLY restaurants, etc.
_INTENT_TO_PLACE_TYPE: dict[str, str] = {
    "specific_cafe":         "cafe",
    "specific_food":         "restaurant",
    "hotel_search":          "hotel",
    "specific_activity":     "loisirs",
    "cultural_plan":         "culture",
    "discovery_search":      "culture",
    "fan_zone_request":      "fanzone",
    "match_watch":           "fanzone",      # "sans ticket" → fan zones
    "local_commerce_search": "artisanat",
    # note: match_day_plan / off_day_plan / pre_match_plan / after_match_plan
    # intentionally left out — they generate multi-type programs
}

# Exact nomCategorie.lower() values for each resolved place type.
# Business items are matched EXACTLY (no keyword fallback) to prevent cross-category contamination.
_EXACT_CATEGORY_MAP: dict[str, list[str]] = {
    "cafe":        ["café & salon de thé"],
    "restaurant":  ["restaurant marocain"],
    "street_food": ["street food & snacks"],
    "dessert":     ["desserts & pâtisserie"],
    "artisanat":   ["artisanat & souvenirs"],
    "bien_etre":   ["bien-être traditionnel"],
    "culture":     ["culture & expériences"],
    "loisirs":     ["loisirs & visites"],
    "terroir":     ["produits du terroir"],
    "nightlife":   ["vie nocturne & rooftops"],
}

# Keyword fallback for non-business sources (discovery, culture items without nomCategorie)
_NONBIZ_KEYWORDS: dict[str, list[str]] = {
    "cafe":        ["cafe", "café", "coffee", "salon de thé", "thé", "breakfast", "brunch"],
    "restaurant":  ["restaurant", "resto", "food", "gastro", "tajine", "couscous", "cuisine"],
    "street_food": ["snack", "street food", "fast food", "sandwich", "wrap"],
    "dessert":     ["pâtisserie", "patisserie", "gâteau", "dessert", "glace"],
    "artisanat":   ["souk", "artisanat", "boutique", "artisan", "bijoux", "poterie"],
    "bien_etre":   ["hammam", "spa", "massage", "bien-être", "détente"],
    "culture":     ["museum", "musée", "monument", "culture", "patrimoine", "médina", "kasbah", "site"],
    "loisirs":     ["activity", "attraction", "visite", "excursion", "randonnée", "parc", "loisir"],
    "terroir":     ["terroir", "argan", "miel", "épices", "safran", "coopérative"],
    "nightlife":   ["bar", "nightlife", "club", "discothèque", "soirée", "lounge", "pub", "rooftop"],
    "hotel":       ["hotel", "hôtel", "riad", "auberge", "chambre", "hébergement"],
    "fanzone":     ["fanzone", "fan zone", "bar sport", "écran géant", "foot", "supporter"],
    "souk":        ["souk", "marché", "artisanat", "boutique", "artisan"],
}

# After-match: exclude cultural venues (closed at night) and hotels
_AFTER_MATCH_INTENTS = {"after_match_plan", "after_match", "evening_plan"}
_CULTURAL_BLOBS = ["musée", "museum", "monument", "patrimoine", "médina", "site", "archéologie"]


# ── Candidate helpers ─────────────────────────────────────────────────────────

def _blob(item: CandidateItem) -> str:
    return (
        f"{(item.source or '').lower()} "
        f"{(item.type or '').lower()} "
        f"{(item.title or '').lower()} "
        f"{(item.description or '').lower()} "
        f"{' '.join(str(t).lower() for t in item.tags)}"
    )


def _is_hotel(item: CandidateItem) -> bool:
    return any(x in _blob(item) for x in ["hotel", "hôtel", "riad", "auberge", "maison d'hôtes"])


def _is_nightlife(item: CandidateItem) -> bool:
    return any(x in _blob(item) for x in ["nightlife", "club", "discothèque", "discotheque"])


def _enrich_distances(
    items: List[CandidateItem],
    ctx: RecommendationContext,
) -> List[CandidateItem]:
    for item in items:
        item.distance_km = compute_distance_km(
            ctx.user_latitude, ctx.user_longitude,
            item.latitude, item.longitude,
        )
        item.stadium_distance_km = compute_distance_km(
            ctx.stadium_latitude, ctx.stadium_longitude,
            item.latitude, item.longitude,
        )
    return items


def _filter_session(
    items: List[CandidateItem],
    excluded_ids: List[str],
    session_ids: List[str],
) -> List[CandidateItem]:
    blocked = {str(x) for x in excluded_ids} | {str(x) for x in session_ids}
    return [i for i in items if i.id not in blocked]


def _filter_by_type(
    items: List[CandidateItem],
    requested_type: Optional[str],
    nightlife_explicit: bool,
) -> List[CandidateItem]:
    """
    STRICT type filter respecting official GoMatch categories.

    For official business categories (cafe, restaurant, street_food, dessert, artisanat,
    bien_etre, culture, loisirs, terroir, nightlife): business items are matched by
    EXACT nomCategorie (item.type) — no cross-category contamination.

    Non-business items (discovery, culture source) use keyword fallback.

    For special types (fanzone, hotel): keyword-only matching with smart fallback.

    Returns an empty list when no exact match found for an official category
    (caller should detect this and return a clarification response).
    """
    if not requested_type:
        return items

    # ── Official business category: strict exact match ────────────────────────
    exact_names = _EXACT_CATEGORY_MAP.get(requested_type)
    if exact_names:
        # Business items: must match exact nomCategorie
        matched_business = [
            i for i in items
            if i.source == "business" and (i.type or "") in exact_names
        ]
        # Non-business items: keyword match (they have no nomCategorie)
        nonbiz_kw = _NONBIZ_KEYWORDS.get(requested_type, [])
        matched_other = [
            i for i in items
            if i.source != "business" and any(k in _blob(i) for k in nonbiz_kw)
        ]
        # Return combined — may be empty (triggers no-results fallback in _run_pipeline)
        return matched_business + matched_other

    # ── Hotel: keyword match (riad, auberge, etc. may not use exact category) ─
    if requested_type == "hotel":
        matched = [i for i in items if _is_hotel(i)]
        return matched if matched else items[:6]

    # ── Fan zone: stadium → explicit keywords → sport culture tags ────────────
    if requested_type == "fanzone":
        _FANZONE_PRIMARY = [
            "fanzone", "fan zone", "bar sport", "sports bar",
            "écran géant", "grand écran", "watch party", "pub foot",
        ]
        _FANZONE_SECONDARY = [
            "foot", "football", "supporter", "match diffusé", "retransmission",
            "diffusion", "ambiance sport", "sport", "pub", "bar",
        ]
        primary = [
            i for i in items
            if i.source in ("stadium", "fanzone")
            or any(x in _blob(i) for x in _FANZONE_PRIMARY)
        ]
        if primary:
            return primary
        secondary = [i for i in items if any(x in _blob(i) for x in _FANZONE_SECONDARY)]
        if secondary:
            return secondary
        # Last resort: bars/cafes near the stadium
        bars = [
            i for i in items
            if not _is_hotel(i) and any(x in _blob(i) for x in ["café", "cafe", "bar", "pub"])
        ]
        return bars[:8] if bars else [i for i in items if not _is_hotel(i)][:8]

    # ── Souk / generic keyword type ───────────────────────────────────────────
    nonbiz_kw = _NONBIZ_KEYWORDS.get(requested_type, [])
    if nonbiz_kw:
        matched = [i for i in items if any(k in _blob(i) for k in nonbiz_kw)]
        if matched:
            return matched

    # Generic fallback: exclude hotels
    if requested_type not in ("hotel",):
        no_hotels = [i for i in items if not _is_hotel(i)]
        return no_hotels[:10] if no_hotels else items[:10]

    return items[:10]


def _apply_intent_filter(
    items: List[CandidateItem],
    intent: str,
    nightlife_explicit: bool,
) -> List[CandidateItem]:
    # Daytime intents: exclude nightlife venues unless user explicitly asked
    _daytime = {
        "match_day_plan", "pre_match_plan", "morning_plan",
        "off_day_plan", "specific_activity", "full_day_plan",
        "day_plan", "family_plan", "cultural_plan", "route_plan", "short_plan",
    }
    if intent in _daytime and not nightlife_explicit:
        cleaned = [i for i in items if not _is_nightlife(i)]
        return cleaned if cleaned else items

    # After-match: remove hotels + cultural venues (closed at night)
    # Keep restaurants, bars, cafés, fan zones, nightlife
    if intent in _AFTER_MATCH_INTENTS:
        def _is_cultural(i: CandidateItem) -> bool:
            b = _blob(i)
            return any(c in b for c in _CULTURAL_BLOBS)
        cleaned = [i for i in items if not _is_hotel(i) and not _is_cultural(i)]
        return cleaned if cleaned else items

    return items


def _create_stadium_candidate(match: dict) -> Optional[CandidateItem]:
    """Create a synthetic CandidateItem for the match stadium."""
    stade_name = match.get("stade")
    if not stade_name:
        return None
    equipe1 = match.get("equipe1", "?")
    equipe2 = match.get("equipe2", "?")
    kickoff = match.get("heure") or ""
    return CandidateItem(
        id=f"stadium_{match.get('id', 'x')}",
        source="stadium",
        type="stade",
        title=stade_name,
        description=(
            f"Stade officiel — {equipe1} vs {equipe2}"
            + (f" · coup d'envoi {kickoff}" if kickoff else "")
        ),
        address=match.get("stade_adresse"),
        latitude=match.get("stade_latitude"),
        longitude=match.get("stade_longitude"),
        tags=["stade", "stadium", "foot", "football", "match", "coupe du monde", "coupe du monde 2026"],
        opening_hours=[],
        rating=5.0,
        final_score=0.95,
    )


def _create_fanzone_candidates(match: dict) -> List[CandidateItem]:
    """Convert match.fan_zones[] → CandidateItems so they appear in recommendations."""
    fan_zones = match.get("fan_zones") or []
    items: List[CandidateItem] = []
    for i, fz in enumerate(fan_zones):
        if not isinstance(fz, dict):
            continue
        name = fz.get("name") or fz.get("nom") or f"Fan Zone officielle {i + 1}"
        items.append(CandidateItem(
            id=f"fanzone_{match.get('id', 'x')}_{i}",
            source="fanzone",
            type="fanzone",
            title=name,
            description="Fan zone officielle FIFA — grand écran, ambiance supporters",
            address=fz.get("address") or fz.get("adresse"),
            latitude=fz.get("latitude") or fz.get("Latitude"),
            longitude=fz.get("longitude") or fz.get("Longitude"),
            tags=["fan zone", "fanzone", "écran géant", "foot", "football", "supporter", "match diffusé"],
            opening_hours=[],
            rating=4.5,
            final_score=0.90,
        ))
    return items


async def _fetch_candidates(ctx: RecommendationContext) -> List[CandidateItem]:
    city = ctx.city
    intent = ctx.intent or ""

    async def _businesses():
        return await business_client.get_all_businesses()

    async def _places():
        places = await discovery_client.get_places_by_city(city)
        if not places:
            places = await discovery_client.get_places()
        return places

    async def _culture():
        # Only fetch cultural content for relevant intents to avoid noise
        _cultural_intents = {
            "cultural_plan", "discovery_search", "off_day_plan", "day_plan",
            "full_day_plan", "match_day_plan", "morning_plan", "multi_day_plan",
            "family_plan", "route_plan", "short_plan", "nearby_request", "unknown",
        }
        if intent in _cultural_intents or not intent:
            return await culture_client.get_published_contenus()
        return []

    biz_raw, disc_raw, cult_raw = await asyncio.gather(
        _businesses(), _places(), _culture(), return_exceptions=True
    )

    candidates: List[CandidateItem] = []
    if isinstance(biz_raw, list):
        candidates.extend(normalize_business_item(item) for item in biz_raw)
    if isinstance(disc_raw, list):
        candidates.extend(normalize_discovery_item(item) for item in disc_raw)
    if isinstance(cult_raw, list):
        # Only add cultural items that have coordinates (needed for distance scoring)
        candidates.extend(
            normalize_culture_item(item)
            for item in cult_raw
            if item.get("latitude") and item.get("longitude")
        )

    return candidates


# ── Core pipeline ─────────────────────────────────────────────────────────────

async def _run_pipeline(req: RecommendationRequest) -> RecommendationResponse:
    """
    Full recommendation pipeline.
    Shared by all POST endpoints to avoid code duplication.
    """
    memory = req.conversation_memory or {}
    intent = classify_intent(req.message, memory)

    # Greeting: skip full pipeline
    if intent in _CHAT_ONLY_INTENTS:
        msg = await generate_response(
            intent=intent, user_message=req.message,
            candidates=[], match=None, constraints={}, mode="specific",
            conversation_history=req.conversation_history,
        )
        return build_greeting_response(msg)

    constraints = extract_constraints(req.message, memory)

    if constraints.get("clarification_needed"):
        return build_clarification_response(
            intent="clarification",
            question=constraints["clarification_question"],
            followups=[
                "Un café ou salon de thé",
                "Un restaurant marocain",
                "Une activité culturelle",
                "Une ambiance festive",
                "Un hôtel ou riad",
            ],
            memory_updates=constraints,
        )

    profile, current_match = await asyncio.gather(
        profile_client.get_profile(req.context.access_token),
        match_client.get_match_context(req.current_match_id),
    )

    ctx = RecommendationContext(
        intent=intent,
        constraints=constraints,
        profile=profile,
        user_latitude=req.context.latitude,
        user_longitude=req.context.longitude,
        current_match=current_match,
    )

    candidates = await _fetch_candidates(ctx)

    # ── Inject match-derived candidates ─────────────────────────────────────────
    has_ticket = constraints.get("has_ticket")
    _match_intents_inject = {
        "match_day_plan", "pre_match_plan", "fan_zone_request",
        "match_watch", "after_match_plan",
    }
    if current_match and intent in _match_intents_inject:
        # Fan zones from match data — always inject for fanzone/watch requests
        fz_candidates = _create_fanzone_candidates(current_match)
        candidates = fz_candidates + candidates

        # Stadium — inject only for ticket holders on match day / pre-match
        if has_ticket is not False and intent in {"match_day_plan", "pre_match_plan"}:
            stadium = _create_stadium_candidate(current_match)
            if stadium:
                candidates = [stadium] + candidates

    # Apply session exclusion with score penalty (don't hard-block)
    all_excluded = list(set(req.excluded_ids + req.session_recommended_ids))
    candidates = apply_excluded_penalty(candidates, all_excluded, penalty=0.25)

    # If no explicit place-type detected from message keywords, infer it from intent.
    # This ensures "sans ticket" → fanzone, "je veux un hôtel" → hotel, etc.
    resolved_type = constraints.get("requested_place_type")
    if not resolved_type and intent in _INTENT_TO_PLACE_TYPE:
        resolved_type = _INTENT_TO_PLACE_TYPE[intent]
        constraints["requested_place_type"] = resolved_type

    candidates = _filter_by_type(
        candidates,
        resolved_type,
        constraints.get("nightlife_explicit", False),
    )

    # No-results fallback: exact category filter returned empty → ask user to widen search
    if not candidates and resolved_type and resolved_type in _EXACT_CATEGORY_MAP:
        category_label = {
            "cafe": "Café & salon de thé",
            "restaurant": "Restaurant marocain",
            "street_food": "Street food & snacks",
            "dessert": "Desserts & pâtisserie",
            "artisanat": "Artisanat & souvenirs",
            "bien_etre": "Bien-être traditionnel",
            "culture": "Culture & expériences",
            "loisirs": "Loisirs & visites",
            "terroir": "Produits du terroir",
            "nightlife": "Vie nocturne & rooftops",
        }.get(resolved_type, resolved_type)
        return build_clarification_response(
            intent="no_exact_results",
            question=(
                f"Aucun résultat exact trouvé pour \"{category_label}\" "
                f"dans cette zone. Voulez-vous élargir la recherche ?"
            ),
            followups=[
                "Oui, montrez-moi des alternatives proches",
                "Chercher dans une autre ville",
                "Modifier ma recherche",
            ],
            memory_updates={**constraints, "last_intent": intent},
        )

    candidates = _apply_intent_filter(
        candidates, intent, constraints.get("nightlife_explicit", False)
    )
    candidates = _enrich_distances(candidates, ctx)

    # Score all candidates
    scored_raw = [score_candidate(item, ctx) for item in candidates]

    # Apply randomization to prevent always-same suggestions
    scored_raw = apply_randomization(scored_raw, noise_range=0.03)
    scored = sorted(scored_raw, key=lambda x: x.final_score, reverse=True)

    # Route to planner
    plan_steps, safety, actual_mode = plan_itinerary(
        intent=intent,
        candidates=scored,
        match=current_match,
        profile=profile,
        user_lat=req.context.latitude,
        user_lon=req.context.longitude,
        city=ctx.city,
        constraints=constraints,
    )

    # Multi-day plan
    days_plan: list[DayPlan] = []
    if intent == "multi_day_plan":
        actual_mode = "multi_day"
        days_plan = build_multi_day_plan(
            match=current_match,
            candidates=scored,
            user_lat=req.context.latitude,
            user_lon=req.context.longitude,
            city=ctx.city,
            profile=profile,
        )
        if days_plan:
            plan_steps = days_plan[0].plan

    # Select recommendations: 3 primary + 2-4 alternatives
    max_recs = 4 if intent == "hotel_search" else 5
    pre_selected = get_specific_recommendations(intent, scored, max_items=max_recs, match=current_match)
    primary_items = diversify_primary(pre_selected, n_primary=3, max_same_category=2)
    alternative_items = get_alternatives(scored, primary_items, n_alternatives=4)

    # Generate LLM response
    message = await generate_response(
        intent=intent,
        user_message=req.message,
        candidates=primary_items,
        match=current_match,
        constraints=constraints,
        mode=actual_mode,
        plan_steps=plan_steps if plan_steps else None,
        safety=safety,
        conversation_history=req.conversation_history,
        profile=profile,
    )

    return build_response(
        intent=intent,
        message=message,
        selected_items=primary_items,
        alternative_items=alternative_items,
        plan_steps=plan_steps,
        days=days_plan if days_plan else None,
        safety=safety,
        mode=actual_mode,
        memory_updates={
            **constraints,
            "last_intent": intent,
            "city": ctx.city,
            "resolved_type": resolved_type,   # Frontend uses this for filter badge
        },
        match=current_match,
    )


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/api/reco/health")
async def health():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "llm_enabled": bool(settings.ANTHROPIC_API_KEY),
    }


# ── Main chat endpoint (spec v3) ──────────────────────────────────────────────

@app.post("/api/reco/chat", response_model=RecommendationResponse)
async def chat(req: RecoChatRequest):
    """
    Main conversational assistant endpoint.
    Accepts RecoChatRequest (spec v3) with all context fields.
    """
    try:
        internal_req = req.to_recommendation_request()
        return await _run_pipeline(internal_req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RecoService error: {str(exc)}")


# ── Direct recommendation ─────────────────────────────────────────────────────

@app.post("/api/reco/recommend", response_model=RecommendationResponse)
async def recommend(req: RecoChatRequest):
    """
    Direct recommendation without full conversation context.
    Same pipeline as /api/reco/chat — alias for integration simplicity.
    """
    try:
        internal_req = req.to_recommendation_request()
        return await _run_pipeline(internal_req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RecoService error: {str(exc)}")


# ── Day plan endpoint ─────────────────────────────────────────────────────────

@app.post("/api/reco/day-plan", response_model=RecommendationResponse)
async def day_plan(req: DayPlanRequest):
    """Generate a complete day itinerary."""
    try:
        # Build a chat request that forces a day-plan intent
        chat_req = RecoChatRequest(
            message="Génère-moi un programme complet pour la journée",
            userLatitude=req.userLatitude,
            userLongitude=req.userLongitude,
            userId=req.userId,
            selectedMatchId=req.matchId,
            hasTicket=req.hasTicket,
            budget=req.budget,
            preferences=req.preferences,
            excludedIds=req.excludedIds,
            accessToken=req.accessToken,
            language=req.language,
            conversationMemory={
                "requested_place_type": None,
                "city": req.city or "Rabat",
                "group_type": req.groupType,
                "budget": req.budget,
            },
        )
        internal_req = chat_req.to_recommendation_request()
        return await _run_pipeline(internal_req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RecoService error: {str(exc)}")


# ── Before-match endpoint ─────────────────────────────────────────────────────

@app.post("/api/reco/before-match", response_model=RecommendationResponse)
async def before_match(req: MatchContextRequest):
    """
    Generate pre-match recommendations.
    Adapts message based on whether user has a ticket.
    """
    try:
        has_ticket = req.hasTicket if req.hasTicket is not None else True
        time_phrase = f" J'ai {req.availableMinutes} minutes." if req.availableMinutes else ""

        if has_ticket:
            message = f"Je veux me préparer avant le match. Propose-moi des activités sur le chemin du stade.{time_phrase}"
        else:
            message = f"Je n'ai pas de ticket pour le match. Trouve-moi une fan zone ou un endroit pour regarder le match.{time_phrase}"

        chat_req = RecoChatRequest(
            message=message,
            userLatitude=req.userLatitude,
            userLongitude=req.userLongitude,
            userId=req.userId,
            selectedMatchId=req.matchId,
            hasTicket=req.hasTicket,
            availableMinutes=req.availableMinutes,
            budget=req.budget,
            preferences=req.preferences,
            excludedIds=req.excludedIds,
            accessToken=req.accessToken,
            language=req.language,
        )
        internal_req = chat_req.to_recommendation_request()
        return await _run_pipeline(internal_req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RecoService error: {str(exc)}")


# ── After-match endpoint ──────────────────────────────────────────────────────

@app.post("/api/reco/after-match", response_model=RecommendationResponse)
async def after_match(req: MatchContextRequest):
    """Generate post-match recommendations — restaurants, bars, nightlife."""
    try:
        message = "Le match vient de se terminer. Propose-moi des options pour la soirée après le match."

        chat_req = RecoChatRequest(
            message=message,
            userLatitude=req.userLatitude,
            userLongitude=req.userLongitude,
            userId=req.userId,
            selectedMatchId=req.matchId,
            hasTicket=req.hasTicket,
            budget=req.budget,
            preferences=req.preferences,
            excludedIds=req.excludedIds,
            accessToken=req.accessToken,
            language=req.language,
        )
        internal_req = chat_req.to_recommendation_request()
        return await _run_pipeline(internal_req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RecoService error: {str(exc)}")


# ── Legacy /conversation (backward compat) ─────────────────────────────────────

@app.post("/conversation", response_model=RecommendationResponse)
async def conversation(req: RecommendationRequest):
    """Legacy endpoint — kept for backward compatibility with frontend v2."""
    try:
        return await _run_pipeline(req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RecoService error: {str(exc)}")


# ── Service info ──────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service":    settings.APP_NAME,
        "version":    settings.APP_VERSION,
        "status":     "ok",
        "llm_enabled": bool(settings.ANTHROPIC_API_KEY),
        "endpoints": [
            "GET  /api/reco/health",
            "POST /api/reco/chat",
            "POST /api/reco/recommend",
            "POST /api/reco/day-plan",
            "POST /api/reco/before-match",
            "POST /api/reco/after-match",
            "POST /conversation (legacy)",
        ],
        "intents": [
            "match_day_plan", "off_day_plan", "after_match_plan", "pre_match_plan",
            "match_watch", "fan_zone_request", "specific_food", "specific_cafe",
            "specific_activity", "nearby_request", "hotel_search", "discovery_search",
            "local_commerce_search", "family_plan", "cheap_plan", "cultural_plan",
            "route_plan", "day_plan", "short_plan", "morning_plan", "evening_plan",
            "multi_day_plan", "match_info", "greeting", "unknown",
        ],
        "scoring_formula": {
            "distanceScore": "0.25",
            "intentMatchScore": "0.25",
            "contextMatchScore": "0.15",
            "ratingScore": "0.15",
            "openingScore": "0.10",
            "diversityScore": "0.05",
            "localImpactScore": "0.05",
        },
    }


@app.get("/scenarios")
async def test_scenarios():
    """Test intent classification for all key scenarios."""
    scenarios = [
        "Planifie ma journée pour le match Maroc Espagne",
        "Je veux manger près de moi",
        "Propose-moi un café proche",
        "J'ai 2h avant le match",
        "Je n'ai pas de ticket, où regarder le match ?",
        "Je veux une journée complète à Rabat",
        "Je veux sortir après le match",
        "Je suis avec ma famille",
        "Je veux quelque chose de pas cher",
        "Je veux découvrir la culture locale",
        "Propose-moi un parcours avec café, activité et fan zone",
        "Journée libre à Rabat",
        "Où dormir près du stade ?",
        "J'ai seulement 1 heure",
        "Propose autre chose",
    ]
    return {
        "scenarios": [
            {
                "message": msg,
                "intent": classify_intent(msg),
                "mode": get_mode(classify_intent(msg)),
            }
            for msg in scenarios
        ]
    }
