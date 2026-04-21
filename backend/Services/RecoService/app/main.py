from typing import List

from fastapi import FastAPI, HTTPException

from app.clients.business_client import BusinessClient
from app.clients.discovery_client import DiscoveryClient
from app.clients.match_client import MatchClient
from app.clients.profile_client import ProfileClient
from app.config import settings
from app.core.candidate_normalizer import normalize_business_item, normalize_discovery_item
from app.core.constraint_extractor import extract_constraints
from app.core.context_builder import RecommendationContext
from app.core.diversity_engine import diversify
from app.core.intent_classifier import classify_intent
from app.core.response_builder import build_clarification_response, build_response
from app.core.scoring_engine import score_candidate
from app.models.domain_models import CandidateItem
from app.models.request_models import RecommendationRequest
from app.models.response_models import RecommendationResponse
from app.utils.geo import compute_distance_km

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

business_client = BusinessClient()
discovery_client = DiscoveryClient()
match_client = MatchClient()
profile_client = ProfileClient()


@app.get("/")
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "ok",
    }


def _enrich_distances(
    items: List[CandidateItem],
    context: RecommendationContext,
) -> List[CandidateItem]:
    for item in items:
        item.distance_km = compute_distance_km(
            context.user_latitude,
            context.user_longitude,
            item.latitude,
            item.longitude,
        )
    return items


def _filter_candidates(
    items: List[CandidateItem],
    excluded_ids: List[str],
    session_recommended_ids: List[str],
) -> List[CandidateItem]:
    excluded = {str(x) for x in excluded_ids}
    session_ids = {str(x) for x in session_recommended_ids}

    return [
        item for item in items
        if item.id not in excluded and item.id not in session_ids
    ]


def _is_hotel(item: CandidateItem) -> bool:
    blob = f"{(item.type or '').lower()} {(item.title or '').lower()} {(item.description or '').lower()} {' '.join([str(t).lower() for t in item.tags])}"
    return "hotel" in blob or "hôtel" in blob


def _is_cafe(item: CandidateItem) -> bool:
    blob = f"{(item.type or '').lower()} {(item.title or '').lower()} {(item.description or '').lower()} {' '.join([str(t).lower() for t in item.tags])}"
    return any(x in blob for x in ["cafe", "café", "coffee"])


def _is_restaurant(item: CandidateItem) -> bool:
    blob = f"{(item.type or '').lower()} {(item.title or '').lower()} {(item.description or '').lower()} {' '.join([str(t).lower() for t in item.tags])}"
    return any(x in blob for x in ["restaurant", "resto", "food", "gastro"])


def _is_activity(item: CandidateItem) -> bool:
    blob = f"{(item.type or '').lower()} {(item.title or '').lower()} {(item.description or '').lower()} {' '.join([str(t).lower() for t in item.tags])}"
    return any(x in blob for x in [
        "activity", "activities", "attraction", "museum", "musée", "musee",
        "monument", "culture", "viewpoint", "visit", "visite"
    ])


def _is_cultural(item: CandidateItem) -> bool:
    blob = f"{(item.type or '').lower()} {(item.title or '').lower()} {(item.description or '').lower()} {' '.join([str(t).lower() for t in item.tags])}"
    return any(x in blob for x in [
        "museum", "musée", "musee", "attraction", "monument", "culture"
    ])


def _is_nightlife(item: CandidateItem) -> bool:
    blob = f"{(item.type or '').lower()} {(item.title or '').lower()} {(item.description or '').lower()} {' '.join([str(t).lower() for t in item.tags])}"
    return any(x in blob for x in ["nightlife", "bar", "club", "nightclub", "discotheque", "discothèque"])


def _filter_by_requested_type(
    items: List[CandidateItem],
    requested_type: str | None,
    nightlife_explicit: bool,
) -> List[CandidateItem]:
    if not requested_type:
        return items

    filtered: List[CandidateItem] = []

    for item in items:
        if requested_type == "cafe":
            if _is_cafe(item):
                filtered.append(item)

        elif requested_type == "restaurant":
            if _is_restaurant(item):
                filtered.append(item)

        elif requested_type == "hotel":
            if _is_hotel(item):
                filtered.append(item)

        elif requested_type == "activity":
            if _is_hotel(item):
                continue
            if not nightlife_explicit and _is_nightlife(item):
                continue
            if _is_activity(item) or _is_cafe(item) or _is_restaurant(item):
                filtered.append(item)

        elif requested_type == "cultural":
            if _is_hotel(item):
                continue
            if _is_cultural(item):
                filtered.append(item)

        elif requested_type == "nightlife":
            if _is_hotel(item):
                continue
            if _is_nightlife(item):
                filtered.append(item)

    if filtered:
        return filtered

    # fallback sûr
    if requested_type == "activity":
        fallback = []
        for item in items:
            if _is_hotel(item):
                continue
            if not nightlife_explicit and _is_nightlife(item):
                continue
            fallback.append(item)
        return fallback if fallback else items

    if requested_type in {"cafe", "restaurant", "cultural"}:
        no_hotels = [item for item in items if not _is_hotel(item)]
        return no_hotels if no_hotels else items

    return items


def _apply_intent_blacklist(
    items: List[CandidateItem],
    intent: str,
    requested_type: str | None,
    nightlife_explicit: bool,
) -> List[CandidateItem]:
    cleaned = items

    if intent in {"pre_match_plan", "post_match_plan"} and requested_type in {
        "activity", "cultural", "cafe", "restaurant"
    }:
        cleaned = [item for item in cleaned if not _is_hotel(item)]

    if not nightlife_explicit and requested_type in {"activity", "cultural", "cafe", "restaurant"}:
        cleaned = [item for item in cleaned if not _is_nightlife(item)]

    return cleaned if cleaned else items


@app.post("/conversation", response_model=RecommendationResponse)
async def conversation(req: RecommendationRequest):
    try:
        intent = classify_intent(req.message)
        memory = req.conversation_memory or {}
        constraints = extract_constraints(req.message, memory)
        print("DEBUG constraints:", constraints)

        if constraints.get("clarification_needed"):
            return build_clarification_response(
                intent="clarification",
                question=constraints["clarification_question"],
                followups=[
                    "Activité culturelle",
                    "Café calme",
                    "Restaurant convivial",
                    "Ambiance plus animée"
                ],
                memory_updates=constraints,
            )

        profile = await profile_client.get_profile(req.context.access_token)
        current_match = await match_client.get_match_context(req.current_match_id)

        context = RecommendationContext(
            intent=intent,
            constraints=constraints,
            profile=profile,
            user_latitude=req.context.latitude,
            user_longitude=req.context.longitude,
            current_match=current_match,
        )

        business_raw = []
        if req.context.latitude is not None and req.context.longitude is not None:
            business_raw = await business_client.search_nearby(
                latitude=req.context.latitude,
                longitude=req.context.longitude,
                radius_km=10.0,
            )

        if not business_raw:
            business_raw = await business_client.get_all_businesses()

        discovery_raw = await discovery_client.get_places_by_city("Rabat")

        candidates: List[CandidateItem] = []
        candidates.extend(normalize_business_item(item) for item in business_raw)
        candidates.extend(normalize_discovery_item(item) for item in discovery_raw)

        candidates = _filter_candidates(
            candidates,
            excluded_ids=req.excluded_ids,
            session_recommended_ids=req.session_recommended_ids,
        )

        candidates = _filter_by_requested_type(
            candidates,
            constraints.get("requested_place_type"),
            constraints.get("nightlife_explicit", False),
        )

        candidates = _apply_intent_blacklist(
            candidates,
            intent,
            constraints.get("requested_place_type"),
            constraints.get("nightlife_explicit", False),
        )

        candidates = _enrich_distances(candidates, context)

        scored = [score_candidate(item, context) for item in candidates]
        scored = sorted(scored, key=lambda x: x.final_score, reverse=True)

        selected = diversify(scored, max_items=3)
        selected_ids = {x.id for x in selected}
        alternatives = [item for item in scored if item.id not in selected_ids][:1]

        return build_response(
            intent,
            selected,
            alternatives,
            memory_updates=constraints,
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RecoService error: {str(exc)}")