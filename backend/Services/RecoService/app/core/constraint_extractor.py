import re
from app.utils.budget import normalize_budget

_MOROCCAN_CITIES = [
    "rabat", "casablanca", "casa", "marrakech", "marrakesh",
    "tanger", "tangier", "fès", "fes", "agadir", "oujda",
    "meknès", "meknes", "kenitra", "tetouan", "tétouan",
    "el jadida", "safi", "mohammedia",
]

_GROUP_KEYWORDS = {
    "family":  ["famille", "enfant", "enfants", "kids", "family", "familles"],
    "couple":  ["couple", "romantique", "amoureux", "amoureuse", "en amour", "en couple"],
    "friends": ["amis", "potes", "groupe", "bande", "friends", "avec des amis"],
    "solo":    ["solo", "seul", "seule", "alone", "tout seul", "toute seule"],
}

_AMBIANCE_KEYWORDS = {
    "calm":     ["calme", "tranquille", "reposant", "quiet", "peaceful", "zen", "détendu"],
    "animated": ["festif", "animé", "anime", "convivial", "vivant", "ambiance", "festive"],
    "cultural": ["culturel", "culturelle", "culture", "histoire", "historique", "art", "musée"],
    "sport":    ["foot", "football", "sport", "supporter", "supporters", "match", "fan"],
}

_PLACE_TYPE_KEYWORDS = {
    # Official GoMatch categories (strict mapping to nomCategorie)
    "cafe": [
        "café", "cafe", "coffee", "salon de thé", "thé", "tea",
        "breakfast", "petit déjeuner", "brunch", "un café", "un coffee", "terrasse calme",
    ],
    "restaurant": [
        "restaurant", "resto", "manger", "déjeuner", "diner", "dîner",
        "cuisine marocaine", "cuisine", "repas", "tajine", "couscous", "grill",
        "brasserie", "faim", "j'ai faim", "je veux manger", "trouver à manger",
    ],
    "street_food": [
        "snack", "street food", "fast food", "sandwich", "wrap", "msemen",
        "sfenj", "briouate", "bourek", "shawarma", "manger vite", "vite fait",
        "sur le pouce", "je veux grignoter", "grignoter",
    ],
    "dessert": [
        "pâtisserie", "patisserie", "gâteau", "dessert", "glace", "crêpe",
        "cornes de gazelle", "chebakia", "corne gazelle", "sucrerie", "douceurs",
        "pâtisseries marocaines",
    ],
    "artisanat": [
        "artisanat", "souvenir", "souvenirs", "bijoux", "poterie", "céramique",
        "zellige", "babouche", "cuivre", "tissus", "tapis", "antiquités",
        "artisan", "shop local", "boutique artisanale",
    ],
    "bien_etre": [
        "hammam", "spa", "massage", "bien-être", "bien être", "détente",
        "gommage", "rasul", "soins", "soin du corps", "relaxation",
    ],
    "culture": [
        "musée", "musee", "monument", "attraction", "culture", "historique",
        "patrimoine", "médina", "site", "kasbah", "remparts", "galerie",
        "archéologie", "tradition", "exposition", "culturel",
    ],
    "loisirs": [
        "activité", "activite", "activités", "sortie", "visite", "à faire",
        "explorer", "découvrir", "découverte", "excursion", "randonnée",
        "que faire", "quoi faire", "parc", "loisir", "loisirs",
    ],
    "terroir": [
        "terroir", "argan", "huile d'argan", "miel", "épices", "safran",
        "produits locaux", "coopérative", "produits du terroir", "local",
        "artisanal alimentaire",
    ],
    "hotel": [
        "hotel", "hôtel", "hébergement", "hebergement", "riad", "dormir",
        "chambre", "nuitée", "séjour", "maison d'hôtes", "auberge", "gîte",
        "où dormir", "passer la nuit",
    ],
    "fanzone": [
        "fan zone", "fanzone", "bar foot", "bar sport", "sports bar",
        "écran géant", "grand écran", "sans ticket", "sans billet",
        "pas de ticket", "pas de billet", "n'ai pas de ticket",
        "je n'ai pas de ticket", "regarder le match", "voir le match",
        "diffusion", "retransmission", "watch party",
    ],
    "nightlife": [
        "rooftop", "bar", "nightlife", "club", "boîte", "boite", "discothèque",
        "discotheque", "soirée", "après match", "fêter", "celebrer", "lounge",
        "vie nocturne", "cocktail", "apéro",
    ],
}

# Official GoMatch cultural tags (used to refine results after category filter)
_OFFICIAL_GOMATCH_TAGS = [
    "animé", "artisanal", "authentique", "calme", "chaleureux", "chill",
    "culturel", "économique", "familial", "festif", "haut de gamme", "historique",
    "local", "match diffusé", "moderne", "moyen", "romantique", "supporters",
    "touristique", "traditionnel", "rapide",
]


def _extract_budget(text: str, memory: dict) -> str | None:
    if any(x in text for x in ["pas cher", "cheap", "economique", "économique", "petit budget", "$"]):
        return "low"
    if any(x in text for x in ["moyen", "medium", "raisonnable", "$$"]):
        return "medium"
    if any(x in text for x in ["luxe", "haut de gamme", "expensive", "premium", "$$$", "chic"]):
        return "high"
    return normalize_budget(memory.get("budget"))


def _extract_time_available(text: str, memory: dict) -> int | None:
    hours_match = re.search(r"(\d+)\s*h(?:eure|eures)?(?!\d)", text)
    minutes_match = re.search(r"(\d+)\s*(?:minute|minutes|min)", text)
    if hours_match:
        return int(hours_match.group(1)) * 60
    if minutes_match:
        return int(minutes_match.group(1))
    return memory.get("time_available_minutes")


def _extract_group_type(text: str, memory: dict) -> str | None:
    for group, keywords in _GROUP_KEYWORDS.items():
        if any(k in text for k in keywords):
            return group
    return memory.get("group_type")


def _extract_ambiance(text: str, memory: dict) -> str | None:
    for ambiance, keywords in _AMBIANCE_KEYWORDS.items():
        if any(k in text for k in keywords):
            return ambiance
    return memory.get("ambiance")


def _extract_place_type(text: str, memory: dict) -> tuple[str | None, bool]:
    nightlife_explicit = memory.get("nightlife_explicit", False)
    for place_type, keywords in _PLACE_TYPE_KEYWORDS.items():
        if any(k in text for k in keywords):
            if place_type == "nightlife":
                nightlife_explicit = True
            return place_type, nightlife_explicit
    return memory.get("requested_place_type"), nightlife_explicit


def _extract_cultural_tags(text: str) -> list[str]:
    """Extract official GoMatch cultural tags mentioned explicitly in the message."""
    found = []
    for tag in _OFFICIAL_GOMATCH_TAGS:
        if tag in text:
            found.append(tag)
    # Additional synonym mapping
    _TAG_SYNONYMS: dict[str, str] = {
        "animée": "animé", "festive": "festif", "calme": "calme",
        "famille": "familial", "enfants": "familial", "pas cher": "économique",
        "traditionnel": "traditionnel", "locale": "local", "historique": "historique",
        "supporters": "supporters", "match diffusé": "match diffusé",
    }
    for synonym, tag in _TAG_SYNONYMS.items():
        if synonym in text and tag not in found:
            found.append(tag)
    return found


def _extract_city(text: str, memory: dict) -> str | None:
    for city in _MOROCCAN_CITIES:
        if city in text:
            normalized = {
                "casa": "Casablanca",
                "marrakesh": "Marrakech",
                "tangier": "Tanger",
                "fes": "Fès",
                "meknes": "Meknès",
            }.get(city, city.capitalize())
            return normalized
    return memory.get("city")


def _needs_clarification(text: str, requested_type: str | None) -> tuple[bool, str | None]:
    if requested_type:
        return False, None

    vague_request = any(x in text for x in [
        "je veux sortir", "propose-moi quelque chose", "propose moi quelque chose",
        "je sais pas quoi faire", "je ne sais pas quoi faire",
    ])

    if vague_request:
        return True, (
            "Pas de problème ! Tu préfères plutôt : un café calme, "
            "un restaurant, une activité culturelle, ou une ambiance festive ?"
        )

    return False, None


_FOLLOWUP_SIGNALS = [
    "et après", "et ensuite", "et puis", "suite", "continuer", "après ça",
    "quoi d'autre", "autre chose", "autre option", "maintenant", "ok et",
    "et pour", "aussi", "sinon", "encore", "plus de",
]


def _is_followup(text: str) -> bool:
    return any(x in text for x in _FOLLOWUP_SIGNALS)


def extract_constraints(message: str, memory: dict | None = None) -> dict:
    text = message.lower()
    memory = memory or {}

    budget = _extract_budget(text, memory)
    time_available_minutes = _extract_time_available(text, memory)
    group_type = _extract_group_type(text, memory)
    ambiance = _extract_ambiance(text, memory)
    requested_place_type, nightlife_explicit = _extract_place_type(text, memory)
    city = _extract_city(text, memory)
    cultural_tags = _extract_cultural_tags(text)
    clarification_needed, clarification_question = _needs_clarification(text, requested_place_type)

    # For follow-up messages, inherit city from memory if not found in message
    if not city and _is_followup(text):
        city = memory.get("city")

    # Defaults: activity without nightlife context gets calm ambiance
    if requested_place_type in ("loisirs", "culture") and not nightlife_explicit and ambiance is None:
        ambiance = "calm"

    return {
        "budget": budget,
        "time_available_minutes": time_available_minutes,
        "ambiance": ambiance,
        "group_type": group_type,
        "requested_place_type": requested_place_type,
        "nightlife_explicit": nightlife_explicit,
        "city": city,
        "cultural_tags": cultural_tags,
        "clarification_needed": clarification_needed,
        "clarification_question": clarification_question,
    }
