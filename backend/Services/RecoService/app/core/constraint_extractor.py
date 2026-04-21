import re

from app.utils.budget import normalize_budget


def extract_constraints(message: str, memory: dict | None = None) -> dict:
    text = message.lower()
    memory = memory or {}

    budget = None
    if any(x in text for x in ["pas cher", "cheap", "economique", "économique", "$"]):
        budget = "low"
    elif any(x in text for x in ["moyen", "medium", "$$"]):
        budget = "medium"
    elif any(x in text for x in ["luxe", "haut de gamme", "expensive", "$$$"]):
        budget = "high"

    budget = normalize_budget(budget) or memory.get("budget")

    time_available_minutes = memory.get("time_available_minutes")
    hours_match = re.search(r"(\d+)\s*(heure|heures|h)", text)
    minutes_match = re.search(r"(\d+)\s*(minute|minutes|min)", text)

    if hours_match:
        time_available_minutes = int(hours_match.group(1)) * 60
    elif minutes_match:
        time_available_minutes = int(minutes_match.group(1))

    ambiance = memory.get("ambiance")
    if "calme" in text:
        ambiance = "calm"
    elif any(x in text for x in ["festif", "animé", "anime", "convivial"]):
        ambiance = "animated"
    elif any(x in text for x in ["culture", "culturel", "culturelle"]):
        ambiance = "cultural"

    group_type = memory.get("group_type")
    if "famille" in text:
        group_type = "family"
    elif "couple" in text:
        group_type = "couple"
    elif "amis" in text:
        group_type = "friends"
    elif "solo" in text or "seul" in text:
        group_type = "solo"

    requested_place_type = memory.get("requested_place_type")
    nightlife_explicit = memory.get("nightlife_explicit", False)

    if any(x in text for x in ["café", "cafe", "coffee"]):
        requested_place_type = "cafe"

    elif any(x in text for x in ["restaurant", "resto", "manger", "déjeuner", "dejeuner", "dîner", "diner"]):
        requested_place_type = "restaurant"

    elif any(x in text for x in ["hotel", "hôtel", "hébergement", "hebergement"]):
        requested_place_type = "hotel"

    elif any(x in text for x in [
        "activité", "activite", "activités", "activites",
        "sortie", "visite", "chose à faire", "choses à faire",
        "a faire", "à faire", "découvrir", "decouvrir"
    ]):
        requested_place_type = "activity"

    elif any(x in text for x in ["musée", "musee", "monument", "attraction", "culture"]):
        requested_place_type = "cultural"

    elif any(x in text for x in ["bar", "nightlife", "club", "boîte", "boite", "night club", "discothèque", "discotheque"]):
        requested_place_type = "nightlife"
        nightlife_explicit = True

    clarification_needed = False
    clarification_question = None

    generic_request = any(x in text for x in [
        "que faire", "quoi faire", "activité", "activite", "activités", "activites",
        "je veux sortir", "propose-moi quelque chose", "propose moi quelque chose",
        "je veux une activité"
    ])

    if generic_request and not requested_place_type:
        clarification_needed = True
        clarification_question = (
            "Tu préfères plutôt une activité culturelle, un café calme, un restaurant convivial, "
            "ou une ambiance plus animée ?"
        )

    # si l'utilisateur veut une activité mais n'a pas précisé le style,
    # on force un comportement safe par défaut
    if requested_place_type == "activity" and not nightlife_explicit:
        if ambiance is None:
            ambiance = "calm"

    return {
        "budget": budget,
        "time_available_minutes": time_available_minutes,
        "ambiance": ambiance,
        "group_type": group_type,
        "requested_place_type": requested_place_type,
        "nightlife_explicit": nightlife_explicit,
        "clarification_needed": clarification_needed,
        "clarification_question": clarification_question,
    }