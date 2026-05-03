"""
llm_responder.py — Natural language response generation via Claude API.

Generates context-aware responses for all intents including:
  match_day_plan, off_day_plan, after_match_plan, specific_food/cafe/activity,
  fan_zone_request, nearby_request, and all legacy intents.

Falls back gracefully to rich templates if no API key is configured.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from app.config import settings
from app.models.domain_models import CandidateItem
from app.models.request_models import ChatMessage
from app.models.response_models import DayProgram, PlanStep, SafetyInfo

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """
Tu es GoMatch Assistant, le guide intelligent officiel de GoMatch pour la Coupe du Monde 2026 au Maroc.

IDENTITÉ : Tu t'appelles GoMatch Assistant. Tu parles comme un ami local expert et bienveillant.

EXPERTISE :
- 6 villes hôtes : Rabat, Casablanca, Marrakech, Tanger, Fès, Agadir
- Accès aux données réelles : commerces locaux partenaires GoMatch + sites de découverte officiels
- Planification intelligente autour des matchs de foot (horaires, stades, fan zones, marges de sécurité)

MISSIONS :
1. Match Day : programmes complets du matin jusqu'à l'après-match, avec marges de sécurité
2. Off Day : découverte culturelle de Rabat (médina, artisanat, gastronomie, balade)
3. Demande précise : réponse directe avec 3-5 recommandations classées

STYLE DE RÉPONSE :
- Direct, chaleureux, précis — comme un ami local qui connaît la ville par cœur
- Cite les VRAIS noms des lieux depuis les données JSON — jamais de noms inventés
- Intègre des détails concrets : "à 300m du stade", "noté 4.7/5", "départ à 18h30"
- Personnalise selon : budget, groupe (famille/couple/amis/solo), prénom du profil
- Max 5 phrases. Zéro bullet points. Zéro introduction générique.
- Pour les plans : décris chronologiquement, cite les lieux par leur nom avec les heures
- Si risque de rater le match → avertis clairement avec l'heure de départ recommandée

RÈGLES ABSOLUES :
- NE COMMENCE JAMAIS PAR : "Bien sûr", "Absolument", "Voici", "Je suis là", "Bien entendu"
- Commence directement par l'info ou l'accroche principale
- Cite UNIQUEMENT les lieux présents dans les données JSON
- Adapte la langue : français si message en français, anglais si en anglais
- Budget serré → prix économiques en avant ; Famille → sécurité et accessibilité
""".strip()


def _format_place(c: CandidateItem) -> Dict[str, Any]:
    place: Dict[str, Any] = {"nom": c.title, "type": c.type}
    if c.distance_km is not None:
        place["distance"] = f"{int(c.distance_km * 1000)}m" if c.distance_km < 1 else f"{c.distance_km:.1f}km"
    if c.rating:
        place["note"] = f"{c.rating}/5"
    if c.price_level:
        place["prix"] = c.price_level
    if c.description:
        place["description"] = c.description[:180]
    if c.tags:
        place["tags"] = c.tags[:4]
    if c.source == "business":
        place["partenaire"] = "GoMatch"
    return place


def _format_plan(steps: Optional[List[PlanStep]]) -> Optional[List[Dict]]:
    if not steps:
        return None
    return [
        {
            "heure": s.startTime,
            "fin": s.endTime,
            "type": s.type,
            "lieu": s.title,
            "durée_min": s.estimatedDurationMinutes,
            "raison": s.reason[:120] if s.reason else "",
        }
        for s in steps
    ]


def _format_safety(safety: Optional[SafetyInfo]) -> Optional[Dict]:
    if not safety:
        return None
    result: Dict[str, str] = {}
    if safety.kickoff:
        result["coup_d_envoi"] = safety.kickoff
    if safety.recommendedArrival:
        result["arrivée_recommandée_stade"] = safety.recommendedArrival
    if safety.latestDepartureToStadium:
        result["départ_au_plus_tard"] = safety.latestDepartureToStadium
    if safety.warningMessage:
        result["alerte"] = safety.warningMessage
    return result if result else None


def _format_profile(profile: Optional[Dict[str, Any]]) -> Optional[Dict]:
    if not profile:
        return None
    prefs = profile.get("preferences") or {}
    result: Dict[str, Any] = {}
    if profile.get("prenom"):
        result["prenom"] = profile["prenom"]
    if profile.get("nationalite"):
        result["nationalite"] = profile["nationalite"]
    if prefs.get("types_lieux"):
        result["lieux_preferes"] = prefs["types_lieux"]
    if prefs.get("ambiance"):
        result["ambiance"] = prefs["ambiance"]
    if prefs.get("groupe"):
        result["groupe"] = prefs["groupe"]
    if prefs.get("budget"):
        result["budget"] = prefs["budget"]
    if profile.get("equipes_suivies"):
        result["equipes_suivies"] = profile["equipes_suivies"]
    return result if result else None


def _build_user_prompt(
    intent: str,
    mode: str,
    user_message: str,
    candidates: List[CandidateItem],
    match: Optional[Dict[str, Any]],
    constraints: Dict[str, Any],
    plan_steps: Optional[List[PlanStep]] = None,
    safety: Optional[SafetyInfo] = None,
    profile: Optional[Dict[str, Any]] = None,
) -> str:
    ctx: Dict[str, Any] = {
        "message_utilisateur": user_message,
        "intention": intent,
        "mode": mode,
    }

    profile_summary = _format_profile(profile)
    if profile_summary:
        ctx["profil"] = profile_summary

    if match:
        m: Dict[str, Any] = {
            "équipes": f"{match.get('equipe1', '?')} vs {match.get('equipe2', '?')}",
            "coup_d_envoi": match.get("heure") or match.get("kickoff"),
            "stade": match.get("stade"),
            "ville": match.get("ville"),
        }
        if match.get("date_affichage"):
            m["date"] = match["date_affichage"]
        if match.get("stade_adresse"):
            m["adresse"] = match["stade_adresse"]
        ctx["match"] = m

    safety_data = _format_safety(safety)
    if safety_data:
        ctx["marges_sécurité"] = safety_data

    prefs = {k: v for k, v in constraints.items()
             if v and k not in ("clarification_needed", "clarification_question")}
    if prefs:
        ctx["contraintes"] = prefs

    if candidates:
        ctx["lieux_recommandés"] = [_format_place(c) for c in candidates[:5]]

    plan_data = _format_plan(plan_steps)
    if plan_data:
        ctx["programme"] = plan_data

    _instructions = {
        "match_day_plan": (
            "Décris ce programme de journée match de façon vivante et chronologique. "
            "OBLIGATOIRE : mentionne le match (équipes, coup d'envoi, stade), "
            "les vraies heures de chaque étape, et le départ recommandé vers le stade. "
            "Si une alerte de sécurité est présente → mentionne-la clairement."
        ),
        "off_day_plan": (
            "Décris cette journée de découverte de Rabat avec enthousiasme. "
            "Cite les lieux dans l'ordre chronologique avec leurs heures. "
            "Mets en valeur la richesse culturelle, gastronomique et artisanale."
        ),
        "after_match_plan": (
            "Propose des options pour après le match avec enthousiasme — victoire ou pas ! "
            "Cite les vrais noms avec distances et ambiances."
        ),
        "pre_match_plan": (
            "Décris ce programme avant match de façon dynamique. "
            "OBLIGATOIRE : mentionne le coup d'envoi et l'heure de départ vers le stade. "
            "Cite les lieux par leur nom avec distances au stade."
        ),
        "fan_zone_request": (
            "Présente ces fan zones avec l'énergie d'un vrai supporter — "
            "cite les vrais noms, distances, ambiance attendue."
        ),
        "specific_food": (
            "Recommande ces restaurants comme un passionné de gastronomie — "
            "noms, spécialités, distance, prix. Direct et savoureux."
        ),
        "specific_cafe": (
            "Recommande ces cafés comme un habitué — "
            "cite les vrais noms, la distance, l'ambiance. Chaleureux et précis."
        ),
        "specific_activity": (
            "Recommande ces activités comme si tu les avais faites toi-même — "
            "cite les vrais lieux, durées estimées, ce qui les rend spéciaux."
        ),
        "nearby_request": (
            "Présente les options les plus proches — cite les vrais noms et distances exactes."
        ),
        "greeting": (
            "Salue chaleureusement, présente-toi comme GoMatch Assistant, "
            "et propose 3 exemples de ce que tu peux faire (match day plan, off day, demande précise)."
        ),
        "hotel_search": (
            "Présente ces hébergements comme un ami qui les connaît — "
            "riad ou hôtel, cite les vrais noms, distances et ce qui les distingue."
        ),
        "discovery_search": (
            "Partage ces pépites locales avec enthousiasme — "
            "cite les vrais noms, distances, ce qu'on y découvre."
        ),
        "local_commerce_search": (
            "Mets en avant ces commerces locaux avec fierté — c'est l'âme authentique du Maroc. "
            "Cite les vrais noms et ce qu'on y trouve."
        ),
        "match_info": (
            "Parle du match avec passion, donne les infos clés, "
            "et propose naturellement de préparer un programme autour."
        ),
    }

    instruction = _instructions.get(
        intent,
        "Réponds naturellement en citant les vrais lieux disponibles dans les données."
    )

    return (
        f"INSTRUCTION : {instruction}\n\n"
        "DONNÉES :\n"
        + json.dumps(ctx, ensure_ascii=False, indent=2)
        + "\n\nMax 5 phrases. Naturel. Pas de listes. Commence directement par l'accroche."
    )


_FALLBACK: Dict[str, str] = {
    "greeting": (
        "Salam et bienvenue ! GoMatch Assistant est là pour vous guider dans les 6 villes hôtes du Maroc 🇲🇦 "
        "Programme de journée match, découverte de Rabat, restaurant, fan zone... "
        "Dites-moi ce que vous voulez faire !"
    ),
    "match_day_plan": (
        "Voilà votre programme complet pour ce jour de match ! "
        "Du café du matin jusqu'à la célébration après le coup de sifflet final — "
        "j'ai planifié chaque étape en respectant les horaires du match. ⚽"
    ),
    "off_day_plan": (
        "Jour sans match ? Parfait pour explorer Rabat ! "
        "Médina historique, artisanat local, gastronomie marocaine et coucher de soleil sur la Corniche — "
        "j'ai concocté une journée mémorable pour vous."
    ),
    "after_match_plan": (
        "Victoire ou pas, la soirée continue ! "
        "Un bon repas pour récupérer, puis un bar animé pour prolonger avec les supporters. 🎉"
    ),
    "pre_match_plan": (
        "Avant le match, voilà le programme : café pour bien démarrer, "
        "activité ou fan zone pour chauffer l'ambiance — partez vers le stade à l'heure indiquée. ⚽"
    ),
    "fan_zone_request": (
        "Fan zone trouvée ! Grand écran, ambiance supporters garantie — l'expérience match sans le stade. 🍺⚽"
    ),
    "specific_food": (
        "Pour manger, j'ai sélectionné les meilleures tables du coin. "
        "Tajine, couscous ou cuisine internationale — vous ne serez pas déçu !"
    ),
    "specific_cafe": (
        "Pour un café bien marocain, j'ai trouvé ce qu'il vous faut — "
        "terrasse ensoleillée ou salon de thé traditionnel. ☕"
    ),
    "specific_activity": (
        "Pour les activités, le Maroc a de quoi faire ! "
        "J'ai sélectionné les meilleures options proches de vous."
    ),
    "nearby_request": (
        "Voici les adresses les plus proches de vous — "
        "sélectionnées pour leur qualité et leur proximité."
    ),
    "hotel_search": (
        "Pour dormir, entre un riad authentique dans la médina et un hôtel moderne, "
        "les deux ont leur charme. J'ai gardé les mieux notés pour vous. Bonne nuit !"
    ),
    "discovery_search": (
        "Le Maroc regorge de pépites ! Médinas, monuments, vues panoramiques... "
        "J'ai sélectionné les incontournables."
    ),
    "local_commerce_search": (
        "Les vrais trésors, c'est chez les commerçants locaux ! "
        "Artisans, boutiques de quartier, souks — l'âme authentique de la ville."
    ),
    "match_info": (
        "Voilà les matchs du moment. "
        "Dites-moi lequel vous intéresse et je prépare un programme complet autour ! ⚽"
    ),
    "general_recommendation": (
        "J'ai sélectionné les meilleurs spots pour vous. "
        "Budget, ambiance, type de lieu — dites-moi et j'ajuste !"
    ),
    "unknown": (
        "Je suis là pour vous aider à découvrir Rabat et profiter du Mondial 2026 ! "
        "Restaurant, fan zone, activité culturelle, programme de journée... Que souhaitez-vous ?"
    ),
}


async def generate_response(
    intent: str,
    user_message: str,
    candidates: List[CandidateItem],
    match: Optional[Dict[str, Any]],
    constraints: Dict[str, Any],
    mode: str = "specific",
    plan_steps: Optional[List[PlanStep]] = None,
    safety: Optional[SafetyInfo] = None,
    program: Optional[DayProgram] = None,   # Legacy param, kept for compat
    conversation_history: Optional[List[ChatMessage]] = None,
    profile: Optional[Dict[str, Any]] = None,
) -> str:
    if not settings.ANTHROPIC_API_KEY:
        tmpl = _FALLBACK.get(intent, _FALLBACK["general_recommendation"])
        prenom = (profile or {}).get("prenom")
        if prenom:
            tmpl = f"{prenom}, " + tmpl[0].lower() + tmpl[1:]
        return tmpl

    try:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

        user_prompt = _build_user_prompt(
            intent=intent, mode=mode,
            user_message=user_message,
            candidates=candidates, match=match,
            constraints=constraints,
            plan_steps=plan_steps, safety=safety,
            profile=profile,
        )

        messages: list[dict] = []
        if conversation_history:
            for msg in conversation_history[-10:]:
                messages.append({
                    "role": "user" if msg.role == "user" else "assistant",
                    "content": msg.content,
                })
        messages.append({"role": "user", "content": user_prompt})

        response = await client.messages.create(
            model=settings.LLM_MODEL,
            max_tokens=settings.LLM_MAX_TOKENS,
            system=_SYSTEM_PROMPT,
            messages=messages,
        )
        return response.content[0].text.strip()

    except Exception as exc:
        logger.warning("LLM call failed, using fallback: %s", exc)
        return _FALLBACK.get(intent, _FALLBACK["general_recommendation"])
