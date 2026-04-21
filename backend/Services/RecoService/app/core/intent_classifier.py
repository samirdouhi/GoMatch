from app.utils.text import contains_any


def classify_intent(message: str) -> str:
    text = message.lower()

    if contains_any(text, [
        "quels matchs", "matchs aujourd", "match today", "today match",
        "quel match", "match ce soir", "match de ce soir"
    ]):
        return "match_info"

    if contains_any(text, [
        "avant le match", "before the match", "before match"
    ]):
        return "pre_match_plan"

    if contains_any(text, [
        "après le match", "apres le match", "after the match", "after match"
    ]):
        return "post_match_plan"

    if contains_any(text, [
        "journée", "journee", "day plan", "programme", "planifie ma journée",
        "j'ai 3 heures", "j'ai 4 heures", "j'ai 5 heures"
    ]):
        return "full_day_plan"

    if contains_any(text, [
        "où dormir", "ou dormir", "hotel", "hôtel", "hébergement", "hebergement"
    ]):
        return "hotel_search"

    if contains_any(text, [
        "que faire", "quoi faire", "activité", "activite", "activités", "activites",
        "je veux sortir", "propose-moi quelque chose", "propose moi quelque chose"
    ]):
        return "activity_search"

    return "general_recommendation"