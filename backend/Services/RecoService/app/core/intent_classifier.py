"""
intent_classifier.py — Intent detection for GoMatch RecoService v3.

Complete intent list:
  match_day_plan    — full day program around a specific match
  off_day_plan      — discovery day without match
  after_match_plan  — what to do after the match
  pre_match_plan    — what to do before the match
  match_watch       — find a place to watch the match without ticket
  fan_zone_request  — find a fan zone / sports bar
  specific_food     — find a restaurant / food
  specific_cafe     — find a café / tea room
  specific_activity — find an activity / cultural site
  nearby_request    — find anything close by
  hotel_search      — find accommodation
  discovery_search  — cultural discovery / sightseeing
  local_commerce_search — artisans / local shops
  family_plan       — family-friendly options
  cheap_plan        — budget-conscious recommendations
  cultural_plan     — local culture / traditions immersion
  route_plan        — multi-stop itinerary request
  day_plan          — general full-day plan (no specific match)
  short_plan        — 1h / 2h / 3h quick options
  morning_plan      — morning activities
  evening_plan      — evening activities
  multi_day_plan    — multi-day trip planning
  match_info        — match schedule / info
  greeting          — greeting / small talk
  unknown           — fallback
"""
from __future__ import annotations

from typing import Optional


def _hits(text: str, keywords: list) -> int:
    return sum(1 for k in keywords if k in text)


def _score_intent(text: str, pos: list, neg: list) -> float:
    score = float(_hits(text, pos))
    if neg:
        score -= 0.6 * _hits(text, neg)
    return max(score, 0.0)


# (intent_name, positive_keywords, negative_keywords, specificity_weight)
_INTENT_DEFS = [

    # ── Greeting ──────────────────────────────────────────────────────────────
    ("greeting", [
        "bonjour", "bonsoir", "salut", "hello", "hi", "hey", "coucou",
        "salam", "bonne journée", "good morning", "good evening", "hola",
        "ça va", "ca va", "comment tu vas", "merci", "thank you", "thanks",
    ], [], 1.0),

    # ── Match Watch (sans ticket) ─────────────────────────────────────────────
    ("match_watch", [
        "sans ticket", "pas de ticket", "pas de billet", "sans billet",
        "regarder le match", "voir le match", "trouver fan zone",
        "diffusion", "retransmission", "regarder ensemble",
        "où voir le match", "ou voir le match",
        "n'ai pas de ticket", "n'ai pas de billet",
        "je n'ai pas de ticket",
    ], [], 3.0),

    # ── Match Day Plan ────────────────────────────────────────────────────────
    ("match_day_plan", [
        "planifie ma journée", "programme du match", "journée de match",
        "programme complet", "programme pour le match", "toute la journée du match",
        "journée complète match", "que faire le jour du match",
        "itinéraire pour le match", "organise ma journée pour le match",
        "prépare ma journée", "planning journée match",
        "maroc espagne", "maroc france", "maroc portugal", "maroc brésil",
        "maroc angleterre", "maroc allemagne", "maroc italie",
        "match maroc", "programme de la journée du match",
    ], [], 3.5),

    # ── Off Day Plan ──────────────────────────────────────────────────────────
    ("off_day_plan", [
        "journée libre", "pas de match", "jour libre", "journée off", "off day",
        "découvrir rabat", "explorer rabat", "visiter rabat", "tourisme rabat",
        "que faire à rabat", "que faire aujourd'hui sans match",
        "journée tranquille", "balade à rabat", "explorer la ville",
        "itinéraire touristique", "découverte de la ville", "jour sans match",
    ], ["match", "stade", "fan zone", "avant le match", "après le match"], 2.5),

    # ── After Match Plan ──────────────────────────────────────────────────────
    ("after_match_plan", [
        "après le match", "apres le match", "post-match", "post match",
        "soirée après", "célébrer", "celebrer", "fêter la victoire",
        "after the game", "après la rencontre", "après match",
        "où aller après", "sortie après match", "après le coup de sifflet",
    ], ["avant le match", "pré-match", "pre-match"], 2.5),

    # ── Pre-match Plan ────────────────────────────────────────────────────────
    ("pre_match_plan", [
        "avant le match", "avant match", "pré-match", "pre-match",
        "programme avant", "que faire avant", "avant ce soir", "before the game",
        "warming up", "avant la rencontre", "activité avant le match",
        "manger avant le match", "j'ai seulement", "2 heures avant le match",
        "1 heure avant le match", "3 heures avant le match",
    ], ["après", "apres", "post match", "après le match", "après-match"], 2.5),

    # ── Fan Zone Request ──────────────────────────────────────────────────────
    ("fan_zone_request", [
        "fan zone", "fanzone", "bar sport", "sports bar", "grand écran", "écran géant",
        "ambiance supporters", "pub foot", "big screen", "watch party",
        "supporters bar", "zone supporters", "fan zone proche", "fan zones",
    ], ["sans ticket", "pas de ticket"], 2.0),

    # ── Family Plan ───────────────────────────────────────────────────────────
    ("family_plan", [
        "famille", "en famille", "avec ma famille", "avec les enfants", "enfants",
        "kids", "sortie famille", "activité famille", "programme famille",
        "accessible enfants", "adapté famille", "avec les petits",
    ], [], 2.2),

    # ── Cheap Plan ───────────────────────────────────────────────────────────
    ("cheap_plan", [
        "pas cher", "cheap", "economique", "économique", "petit budget",
        "bon marché", "budget serré", "abordable", "budget limité",
        "gratuit", "free", "prix raisonnable", "pas trop cher",
    ], [], 1.8),

    # ── Cultural Plan ─────────────────────────────────────────────────────────
    ("cultural_plan", [
        "culture locale", "artisanat local", "traditions locales",
        "cuisine locale", "expérience locale", "vivre comme un local",
        "vie locale", "médina", "quartier traditionnel",
        "découverte culturelle", "patrimoine culturel", "histoire locale",
        "produits locaux", "savoir-faire local",
    ], [], 2.0),

    # ── Route Plan ───────────────────────────────────────────────────────────
    ("route_plan", [
        "parcours", "avec plusieurs étapes", "circuit touristique",
        "balade guidée", "visite guidée", "étape par étape",
        "combiner café activité", "combiner restaurant activité",
        "propose un parcours", "itinéraire avec café",
        "un parcours avec", "faire un circuit",
    ], ["hotel", "dormir", "nuit", "séjour"], 1.8),

    # ── General Day Plan (no match context) ───────────────────────────────────
    ("day_plan", [
        "journée complète", "journee complete", "programme complet",
        "toute la journée", "toute la journee",
        "du matin au soir", "organise ma journée", "organise ma journee",
        "plan journée", "plan journee", "programme de la journée",
        "remplis ma journée", "occupe ma journée", "planifie ma journée",
        "journée à rabat", "propose une journée", "génère une journée",
        "genere une journee", "programme journee",
    ], ["match", "stade", "fan zone", "avant le match", "après le match"], 2.2),

    # ── Short Plan (1h / 2h / 3h) ─────────────────────────────────────────────
    ("short_plan", [
        "seulement 2 heures", "seulement 1 heure", "seulement 3 heures",
        "2 heures libres", "1 heure disponible",
        "j'ai 2h", "j'ai 1h", "j'ai 3h",
        "j'ai 2 heures", "j'ai 1 heure", "j'ai 3 heures",
        "j'ai deux heures", "j'ai une heure",
        "peu de temps", "rapidement", "vite fait", "en vitesse",
        "j'ai peu de temps", "entre deux", "dans 2h", "dans 1h",
        "2 heures devant moi", "1 heure devant moi",
    ], [], 1.8),

    # ── Specific Food ─────────────────────────────────────────────────────────
    ("specific_food", [
        "je veux manger", "j'ai faim", "où manger", "resto",
        "manger", "déjeuner", "diner", "dîner", "repas",
        "tajine", "couscous", "table", "food", "eat", "gastro", "brasserie",
        "menu", "plat", "que manger", "cuisine",
    ], ["hôtel", "nuit", "dormir", "fan zone", "café", "activité", "activite", "musée"], 1.8),

    # ── Specific Café ─────────────────────────────────────────────────────────
    ("specific_cafe", [
        "je veux un café", "café proche", "prendre un café", "salon de thé",
        "coffee", "thé", "tea", "cappuccino", "petit déjeuner",
        "breakfast", "où prendre un café", "pause café",
    ], ["restaurant", "hôtel", "activité", "manger", "activite"], 1.8),

    # ── Specific Activity ─────────────────────────────────────────────────────
    ("specific_activity", [
        "je veux une activité", "activité proche", "que faire",
        "activite", "activités", "sortie", "à faire", "explorer",
        "loisirs", "expérience", "excursion", "balade", "randonnée",
        "what to do", "occupation", "musée", "visite", "monument",
    ], ["restaurant", "cafe", "café", "hôtel", "dormir", "fan zone", "manger"], 1.5),

    # ── Nearby Request ────────────────────────────────────────────────────────
    ("nearby_request", [
        "proche de moi", "autour de moi", "près de moi", "à côté",
        "a cote", "dans le coin", "nearby", "around me", "around here",
        "endroit proche", "lieu proche", "adresse proche",
    ], [], 2.0),

    # ── Hotel ─────────────────────────────────────────────────────────────────
    ("hotel_search", [
        "hotel", "hôtel", "hébergement", "hebergement", "riad", "dormir",
        "chambre", "nuitée", "nuit", "séjour", "ou dormir", "sleep",
        "accommodation", "maison d'hôtes", "auberge", "où loger",
    ], [], 1.5),

    # ── Discovery / Cultural ──────────────────────────────────────────────────
    ("discovery_search", [
        "visiter", "découvrir", "découverte", "sites", "monuments",
        "patrimoine", "médina", "tourisme", "choses à voir", "attractions",
        "sightseeing", "explore", "histoire", "que visiter",
    ], [], 1.5),

    # ── Local Commerce ────────────────────────────────────────────────────────
    ("local_commerce_search", [
        "artisan", "artisanat", "souk", "marché", "commerce local",
        "boutique", "produits locaux", "souvenirs", "crafts",
        "commerçant", "made in maroc", "boutiques locales",
    ], [], 1.5),

    # ── Multi-Day Plan ────────────────────────────────────────────────────────
    ("multi_day_plan", [
        "séjour complet", "sejour complet", "plusieurs jours", "multi-jours",
        "programme sur 3 jours", "3 jours à rabat", "week-end complet",
        "voyage de 3 jours", "planifie mon séjour", "mon séjour complet",
        "itinéraire complet", "programme tout mon séjour",
        "organise mon voyage", "plan mon voyage", "trip complet", "full trip",
    ], [], 3.5),

    # ── Match Info ────────────────────────────────────────────────────────────
    ("match_info", [
        "quel match", "quels matchs", "match aujourd", "match ce soir", "match demain",
        "horaire match", "programme des matchs", "coupe du monde", "world cup 2026",
        "qui joue", "c'est quand le match", "schedule", "fixture",
    ], ["planifie", "programme journée", "journée", "avant le match", "après le match"], 1.5),

    # ── Morning / Evening Plans ───────────────────────────────────────────────
    ("morning_plan", [
        "ce matin", "programme matin", "matinée", "le matin",
        "que faire le matin", "activité matin", "balade matin",
        "breakfast plan", "morning activities",
    ], ["soir", "nuit", "après le match"], 1.5),

    ("evening_plan", [
        "ce soir", "soirée", "programme soirée", "plan soirée",
        "sortie soirée", "que faire ce soir", "evening plan", "tonight",
    ], ["matin", "midi", "avant le match"], 1.5),
]


def classify_intent(message: str, memory: Optional[dict] = None) -> str:
    text = message.lower().strip()
    memory = memory or {}

    best_intent = "unknown"
    best_score = 0.0

    for intent_name, pos_kw, neg_kw, weight in _INTENT_DEFS:
        raw = _score_intent(text, pos_kw, neg_kw)
        if raw <= 0:
            continue
        weighted = raw * weight
        if weighted > best_score:
            best_score = weighted
            best_intent = intent_name

    # Contextual follow-up resolution
    if best_score < 0.5:
        last_intent = memory.get("last_intent", "")
        followup_signals = [
            "et après", "et ensuite", "et puis", "suite", "continuer",
            "après ça", "quoi d'autre", "autre chose", "et maintenant",
            "autre option", "propose autre chose",
        ]
        if last_intent and any(x in text for x in followup_signals):
            _FOLLOWUP_MAP = {
                "pre_match_plan":       "after_match_plan",
                "match_day_plan":       "after_match_plan",
                "morning_plan":         "specific_food",
                "specific_cafe":        "specific_food",
                "specific_food":        "specific_activity",
                "specific_activity":    "discovery_search",
                "discovery_search":     "specific_cafe",
                "off_day_plan":         "specific_food",
                "day_plan":             "specific_activity",
                "cultural_plan":        "specific_cafe",
                "family_plan":          "specific_activity",
                "cheap_plan":           "specific_food",
                "route_plan":           "specific_activity",
            }
            if last_intent in _FOLLOWUP_MAP:
                return _FOLLOWUP_MAP[last_intent]

    return best_intent


# ── Mode mapping ──────────────────────────────────────────────────────────────

INTENT_TO_MODE: dict[str, str] = {
    "match_day_plan":         "match_day",
    "pre_match_plan":         "match_day",
    "morning_plan":           "match_day",
    "off_day_plan":           "off_day",
    "day_plan":               "off_day",
    "cultural_plan":          "off_day",
    "route_plan":             "off_day",
    "multi_day_plan":         "multi_day",
    "specific_food":          "specific",
    "specific_cafe":          "specific",
    "specific_activity":      "specific",
    "fan_zone_request":       "specific",
    "match_watch":            "specific",
    "after_match_plan":       "specific",
    "nearby_request":         "specific",
    "hotel_search":           "specific",
    "discovery_search":       "specific",
    "local_commerce_search":  "specific",
    "evening_plan":           "specific",
    "match_info":             "specific",
    "family_plan":            "specific",
    "cheap_plan":             "specific",
    "short_plan":             "specific",
    "greeting":               "specific",
    "unknown":                "specific",
    # Legacy aliases
    "full_day_plan":          "match_day",
    "post_match_plan":        "specific",
    "cafe_search":            "specific",
    "restaurant_search":      "specific",
    "activity_search":        "specific",
    "fanzone_search":         "specific",
    "general_recommendation": "specific",
}


def get_mode(intent: str) -> str:
    return INTENT_TO_MODE.get(intent, "specific")
