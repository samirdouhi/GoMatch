"""
response_builder.py — Build RecommendationResponse from scored candidates.

Populates both spec-v3 fields (primaryRecommendations, alternativeRecommendations,
scoreBreakdown, followUpQuestion) and legacy fields (cards, followups, etc.)
for full backward compatibility.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.models.domain_models import CandidateItem
from app.models.response_models import (
    DayPlan,
    DayProgram,
    PlanStep,
    RecommendationCard,
    RecommendationItemDto,
    RecommendationResponse,
    SafetyInfo,
    ScoreBreakdown,
)
from app.utils.geo import distance_text


# ── Reason generation ─────────────────────────────────────────────────────────

def _build_reason(item: CandidateItem) -> str:
    parts: List[str] = []

    if item.source == "business":
        parts.append("commerce local partenaire GoMatch")

    if item.distance_km is not None:
        if item.distance_km < 0.30:
            parts.append("à deux pas de vous")
        elif item.distance_km < 0.80:
            parts.append("très proche")
        elif item.distance_km < 2.0:
            parts.append(f"à {int(item.distance_km * 1000)}m de vous")
        else:
            parts.append(f"à {round(item.distance_km, 1)} km")

    if item.fan_score > 0:
        parts.append("ambiance supporters garantie")
    elif item.match_score > 0.60:
        parts.append("idéal autour du match")

    if item.intent_match_score > 0.60:
        parts.append("correspond exactement à votre demande")
    elif item.profile_score > 0.40:
        parts.append("correspond à vos préférences")

    if item.budget_score > 0:
        parts.append("dans votre budget")

    if item.rating and item.rating >= 4.5:
        parts.append(f"excellent — noté {item.rating}/5")
    elif item.rating and item.rating >= 4.0:
        parts.append(f"bien noté ({item.rating}/5)")
    elif item.review_count == 0 or item.review_count is None:
        parts.append("nouveau — à découvrir")

    if item.opening_score >= 1.0:
        parts.append("ouvert maintenant")

    return ", ".join(parts) if parts else "bonne adresse à découvrir"


# ── Score breakdown builder ───────────────────────────────────────────────────

def _build_score_breakdown(item: CandidateItem) -> ScoreBreakdown:
    return ScoreBreakdown(
        distanceScore=round(item.distance_score, 3),
        intentMatchScore=round(item.intent_match_score, 3),
        contextMatchScore=round(item.context_match_score, 3),
        ratingScore=round(item.rating_score, 3),
        openingScore=round(item.opening_score, 3),
        diversityScore=round(item.diversity_score, 3),
        localImpactScore=round(item.local_impact_score, 3),
    )


# ── Converters ────────────────────────────────────────────────────────────────

def _to_recommendation_item(item: CandidateItem) -> RecommendationItemDto:
    """Convert CandidateItem → RecommendationItemDto (spec v3)."""
    dist_km = item.distance_km or 0.0
    travel_min = max(5, int(dist_km * 12)) if item.distance_km is not None else None

    return RecommendationItemDto(
        id=item.id,
        source=item.source,
        type=item.type,
        name=item.title,
        description=item.description,
        address=item.address,
        latitude=item.latitude,
        longitude=item.longitude,
        distanceKm=round(dist_km, 2) if item.distance_km is not None else None,
        estimatedTravelMinutes=travel_min,
        imageUrl=item.photo_url,
        category=item.type,
        tags=item.tags,
        noteGlobale=item.rating if item.source == "business" else None,
        nombreAvis=item.review_count if item.source == "business" else None,
        isOpen=(item.opening_score >= 1.0) if item.opening_hours else None,
        scoreTotal=round(item.final_score * 100, 1),
        scoreBreakdown=_build_score_breakdown(item),
        reason=_build_reason(item),
        callToAction="Voir sur la carte",
    )


def _to_card(item: CandidateItem) -> RecommendationCard:
    """Convert CandidateItem → RecommendationCard (legacy)."""
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
        photo_url=item.photo_url,
    )


# ── Follow-up questions ────────────────────────────────────────────────────────

_FOLLOWUPS: Dict[str, List[str]] = {
    "greeting": [
        "Planifie ma journée pour le match",
        "Où manger ce soir ?",
        "Activités à découvrir à Rabat",
        "Trouve-moi une fan zone proche",
    ],
    "match_day_plan": [
        "Adapter pour budget serré",
        "Version en famille",
        "Fan zone la plus proche",
        "Programme après le match",
    ],
    "off_day_plan": [
        "Programme pour demain avec un match",
        "Artisanat local à découvrir",
        "Meilleurs restaurants de Rabat",
        "Activités culturelles",
    ],
    "day_plan": [
        "Version plus culturelle",
        "Adapter pour famille",
        "Option budget serré",
        "Ajouter une fan zone",
    ],
    "multi_day_plan": [
        "Adapter le programme pour famille",
        "Journée match uniquement",
        "Hôtels recommandés pour le séjour",
        "Restaurants à ne pas manquer",
    ],
    "pre_match_plan": [
        "Fan zone la plus proche",
        "Restaurant avant le match",
        "Programme complet de la journée",
        "Hôtel proche du stade",
    ],
    "after_match_plan": [
        "Bar pour célébrer",
        "Restaurant ouvert après 22h",
        "Que faire demain ?",
        "Hôtel pour la nuit",
    ],
    "match_watch": [
        "Fan zone officielle FIFA",
        "Bar avec grand écran le plus proche",
        "Ambiance après le match",
        "Programme autour du match",
    ],
    "fan_zone_request": [
        "Fan zone officielle FIFA",
        "Bar avec grand écran",
        "Ambiance après le match",
        "Programme autour du match",
    ],
    "specific_food": [
        "Restaurant marocain traditionnel",
        "Cuisine internationale",
        "Moins de 200 DH par personne",
        "Restaurant ouvert maintenant",
    ],
    "specific_cafe": [
        "Café avec terrasse",
        "Salon de thé traditionnel",
        "Café proche du stade",
        "Commerce local sympa",
    ],
    "specific_activity": [
        "Visite culturelle",
        "Activité en famille",
        "Que faire ce soir ?",
        "Découvertes locales",
    ],
    "nearby_request": [
        "Restaurants proches",
        "Cafés dans le coin",
        "Activités près de moi",
        "Fan zone proche",
    ],
    "hotel_search": [
        "Riad dans la médina",
        "Hôtel proche du stade",
        "Option petit budget",
        "Hôtel avec piscine",
    ],
    "family_plan": [
        "Activité outdoor pour enfants",
        "Restaurant familial",
        "Musée interactif",
        "Balade accessible poussette",
    ],
    "cheap_plan": [
        "Restaurants moins de 100 DH",
        "Activités gratuites",
        "Cafés abordables",
        "Transport économique",
    ],
    "cultural_plan": [
        "Médina et artisanat",
        "Musées incontournables",
        "Quartiers historiques",
        "Gastronomie locale",
    ],
    "route_plan": [
        "Optimiser l'itinéraire",
        "Ajouter une étape culturelle",
        "Version plus courte",
        "Voir sur la carte",
    ],
    "short_plan": [
        "Programme 1h",
        "Programme 2h",
        "Option café rapide",
        "Visite express",
    ],
    "discovery_search": [
        "Sites historiques à voir",
        "Activités insolites",
        "Commerce artisanal local",
        "Balade dans la médina",
    ],
    "local_commerce_search": [
        "Artisanat local",
        "Souk et marchés",
        "Boutiques authentiques",
        "Produits locaux",
    ],
    "match_info": [
        "Programme autour du match",
        "Fan zone pour ce match",
        "Restaurant avant le match",
        "Hôtel proche du stade",
    ],
}


def _build_followups(intent: str) -> List[str]:
    return _FOLLOWUPS.get(intent, [
        "Montre-moi d'autres options",
        "Lieux proches de moi",
        "Voir sur la carte",
        "Générer une journée complète",
    ])


# ── Route polyline ─────────────────────────────────────────────────────────────

def _steps_to_route(steps: List[PlanStep]) -> List[List[float]]:
    return [
        [s.latitude, s.longitude]
        for s in steps
        if s.latitude is not None and s.longitude is not None
    ]


# ── Public builders ───────────────────────────────────────────────────────────

def build_response(
    intent: str,
    message: str,
    selected_items: List[CandidateItem],
    alternative_items: Optional[List[CandidateItem]] = None,
    program: Optional[DayProgram] = None,
    plan_steps: Optional[List[PlanStep]] = None,
    days: Optional[List[DayPlan]] = None,
    safety: Optional[SafetyInfo] = None,
    mode: str = "specific",
    memory_updates: Optional[Dict[str, Any]] = None,
    match: Optional[Dict[str, Any]] = None,
) -> RecommendationResponse:
    """Build a complete RecommendationResponse with both spec-v3 and legacy fields."""

    # Spec v3: typed DTOs
    primary_items  = [_to_recommendation_item(i) for i in selected_items]
    alt_items      = [_to_recommendation_item(i) for i in (alternative_items or [])]

    # Legacy: cards
    cards        = [_to_card(i) for i in selected_items]
    alternatives = [_to_card(i) for i in (alternative_items or [])]

    followups = _build_followups(intent)
    follow_up_question = followups[0] if followups else None

    summary = (
        message.split(".")[0].strip() + "."
        if "." in message and len(message) > 80
        else message
    )

    effective_plan = plan_steps or []
    top_route = _steps_to_route(effective_plan)

    enriched_days: List[DayPlan] = []
    for day in (days or []):
        if not day.route and day.plan:
            enriched_days.append(DayPlan(
                date=day.date,
                label=day.label,
                type=day.type,
                plan=day.plan,
                route=_steps_to_route(day.plan),
                safety=day.safety,
                match_info=day.match_info,
            ))
        else:
            enriched_days.append(day)

    return RecommendationResponse(
        # ── Spec v3 ───────────────────────────────────────────────────────────
        intent=intent,
        mode=mode,
        summary=summary,
        safety=safety,
        primaryRecommendations=primary_items,
        alternativeRecommendations=alt_items,
        plan=effective_plan,
        days=enriched_days,
        route=top_route,
        followUpQuestion=follow_up_question,
        followUpQuestions=followups,
        # ── Legacy ────────────────────────────────────────────────────────────
        recommendations=cards,
        message=message,
        cards=cards,
        followups=followups,
        alternatives=alternatives,
        program=program,
        needs_clarification=False,
        clarification_question=None,
        memory_updates=memory_updates or {},
    )


def build_clarification_response(
    intent: str,
    question: str,
    followups: List[str],
    memory_updates: Optional[Dict[str, Any]] = None,
) -> RecommendationResponse:
    return RecommendationResponse(
        intent=intent,
        mode="specific",
        summary=question,
        primaryRecommendations=[],
        alternativeRecommendations=[],
        plan=[],
        followUpQuestion=followups[0] if followups else None,
        followUpQuestions=followups,
        recommendations=[],
        message=question,
        cards=[],
        followups=followups,
        alternatives=[],
        needs_clarification=True,
        clarification_question=question,
        memory_updates=memory_updates or {},
    )


def build_greeting_response(message: str) -> RecommendationResponse:
    followups = _build_followups("greeting")
    return RecommendationResponse(
        intent="greeting",
        mode="specific",
        summary=message,
        primaryRecommendations=[],
        alternativeRecommendations=[],
        plan=[],
        followUpQuestion=followups[0] if followups else None,
        followUpQuestions=followups,
        recommendations=[],
        message=message,
        cards=[],
        followups=followups,
        alternatives=[],
        needs_clarification=False,
        memory_updates={},
    )
