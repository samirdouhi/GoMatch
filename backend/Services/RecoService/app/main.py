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
from app.clients.discovery_client import DiscoveryClient
from app.clients.match_client import MatchClient
from app.clients.profile_client import ProfileClient
from app.config import settings
from app.core.candidate_normalizer import normalize_business_item, normalize_discovery_item
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
    "specific_activity":     "activity",
    "cultural_plan":         "cultural",
    "discovery_search":      "cultural",
    "fan_zone_request":      "fanzone",
    "match_watch":           "fanzone",      # "sans ticket" → fan zones
    "local_commerce_search": "souk",
    # note: match_day_plan / off_day_plan / pre_match_plan / after_match_plan
    # intentionally left out — they generate multi-type programs
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
    STRICT type filter. When requested_type is set, return ONLY matching items.
    Fallback is minimal — avoids polluting results with irrelevant categories.
    """
    if not requested_type:
        return items

    _checks = {
        "cafe": lambda i: any(x in _blob(i) for x in [
            "cafe", "café", "coffee", "salon de thé", "thé", "tea", "breakfast",
            "petit déjeuner", "brunch", "snack",
        ]),
        "restaurant": lambda i: any(x in _blob(i) for x in [
            "restaurant", "resto", "food", "gastro", "manger", "cuisine",
            "tajine", "couscous", "repas", "grill", "pizz", "burger",
            "brasserie", "fast food", "snack",
        ]),
        "hotel": lambda i: _is_hotel(i),
        "activity": lambda i: (
            not _is_hotel(i)
            and (nightlife_explicit or not _is_nightlife(i))
            and any(x in _blob(i) for x in [
                "activity", "attraction", "museum", "musée", "monument",
                "visite", "viewpoint", "culture", "médina", "site", "excursion",
                "kasbah", "remparts", "patrimoine", "galerie",
            ])
        ),
        "cultural": lambda i: (
            not _is_hotel(i)
            and any(x in _blob(i) for x in [
                "museum", "musée", "monument", "attraction", "culture",
                "patrimoine", "médina", "kasbah", "remparts", "galerie",
                "historique", "archéologie", "site",
            ])
        ),
        "fanzone": lambda i: any(x in _blob(i) for x in [
            "fanzone", "fan zone", "bar sport", "sports bar", "foot",
            "football", "écran géant", "grand écran", "supporter",
            "watch party", "pub foot", "bar",
        ]),
        "nightlife": lambda i: not _is_hotel(i) and (
            _is_nightlife(i)
            or any(x in _blob(i) for x in ["bar", "soirée", "lounge", "pub"])
        ),
        "souk": lambda i: any(x in _blob(i) for x in [
            "souk", "marché", "artisanat", "boutique", "artisan", "shop",
        ]),
    }

    check = _checks.get(requested_type)
    if not check:
        return items

    filtered = [i for i in items if check(i)]
    if filtered:
        return filtered

    # Minimal fallback: only exclude hotels (never relevant as a fallback)
    # and return at most 10 items so results are focused
    if requested_type not in ("hotel", "souk"):
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


async def _fetch_candidates(ctx: RecommendationContext) -> List[CandidateItem]:
    city = ctx.city

    async def _businesses():
        return await business_client.get_all_businesses()

    async def _places():
        places = await discovery_client.get_places_by_city(city)
        if not places:
            places = await discovery_client.get_places()
        return places

    biz_raw, disc_raw = await asyncio.gather(
        _businesses(), _places(), return_exceptions=True
    )

    candidates: List[CandidateItem] = []
    if isinstance(biz_raw, list):
        candidates.extend(normalize_business_item(item) for item in biz_raw)
    if isinstance(disc_raw, list):
        candidates.extend(normalize_discovery_item(item) for item in disc_raw)

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
