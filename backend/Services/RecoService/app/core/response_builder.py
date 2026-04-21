from typing import Any, Dict, List

from app.models.domain_models import CandidateItem
from app.models.response_models import RecommendationCard, RecommendationResponse
from app.utils.geo import distance_text


def _build_reason(item: CandidateItem) -> str:
    reasons = []

    if item.distance_km is not None and item.distance_km < 2:
        reasons.append("proche de vous")

    if item.profile_score > 0.0:
        reasons.append("adapté à votre profil")

    if item.match_score > 0.0:
        reasons.append("pertinent autour du match")

    if item.budget_score > 0.0:
        reasons.append("cohérent avec votre budget")

    return ", ".join(reasons) if reasons else "bonne option"


def _build_message(intent: str) -> str:
    if intent == "match_info":
        return "Voici les informations utiles autour des matchs disponibles."
    if intent == "pre_match_plan":
        return "Voici des options adaptées avant votre match."
    if intent == "post_match_plan":
        return "Voici des options adaptées après votre match."
    if intent == "full_day_plan":
        return "Voici une sélection cohérente pour organiser votre journée."
    if intent == "hotel_search":
        return "Voici des options d’hébergement adaptées à ta demande."
    if intent == "activity_search":
        return "Voici des activités adaptées à ce que tu recherches."
    return "Voici des recommandations adaptées à ta demande."


def _build_followups(intent: str) -> List[str]:
    if intent == "pre_match_plan":
        return [
            "Je veux quelque chose de plus culturel",
            "Propose-moi une option moins chère",
            "Montre-moi ces lieux sur la carte",
        ]

    if intent == "activity_search":
        return [
            "Je veux quelque chose de plus calme",
            "Je préfère une activité culturelle",
            "Montre-moi les options proches",
        ]

    if intent == "full_day_plan":
        return [
            "Ajoute ces lieux à mon parcours",
            "Je veux une version plus calme",
            "Propose-moi d'autres options",
        ]

    return [
        "Montre-moi d'autres options",
        "Voir sur la carte",
        "Je veux des lieux plus proches",
    ]


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
        reason=_build_reason(item),
        actions=["view_detail", "view_on_map", "favorite", "add_to_plan"],
    )


def build_response(
    intent: str,
    selected_items: List[CandidateItem],
    alternative_items: List[CandidateItem] | None = None,
    memory_updates: Dict[str, Any] | None = None,
) -> RecommendationResponse:
    alternative_items = alternative_items or []
    memory_updates = memory_updates or {}

    return RecommendationResponse(
        intent=intent,
        message=_build_message(intent),
        cards=[_to_card(item) for item in selected_items],
        followups=_build_followups(intent),
        alternatives=[_to_card(item) for item in alternative_items],
        needs_clarification=False,
        clarification_question=None,
        memory_updates=memory_updates,
    )


def build_clarification_response(
    intent: str,
    question: str,
    followups: List[str],
    memory_updates: Dict[str, Any] | None = None,
) -> RecommendationResponse:
    return RecommendationResponse(
        intent=intent,
        message=question,
        cards=[],
        followups=followups,
        alternatives=[],
        needs_clarification=True,
        clarification_question=question,
        memory_updates=memory_updates or {},
    )