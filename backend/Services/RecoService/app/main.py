from fastapi import FastAPI, HTTPException
from app.models.schemas import RecommendationRequest
from app.services.business_client import get_nearby_commerces
from app.services.profile_client import get_user_profile, extract_preferences
from app.services.match_client import get_today_matches, get_upcoming_matches
from app.services.preference_mapper import normalize_text, get_interest_targets

app = FastAPI()


COVERAGE_CITY = "Rabat"
DEFAULT_RADIUS_KM = 15
FALLBACK_RADIUS_KM = 1200
STRONG_MATCH_THRESHOLD = 25


@app.get("/")
def root():
    return {"message": "RecoService is running"}


def score_distance(distance: float) -> int:
    if distance <= 1:
        return 50
    if distance <= 3:
        return 35
    if distance <= 5:
        return 20
    if distance <= 10:
        return 5
    return -25


def score_time_available(available_minutes: int, distance: float) -> int:
    if available_minutes < 60:
        return 10 if distance <= 2 else -15
    if available_minutes < 120:
        return 5 if distance <= 5 else -5
    return 5


def score_match_context(
    has_match_today: bool,
    has_upcoming_match: bool,
    normalized_preferences: list[str],
    category_text: str,
) -> int:
    score = 0

    if has_match_today:
        if (
            "cafe" in category_text
            or "restaurant" in category_text
            or "snack" in category_text
            or "restauration" in category_text
        ):
            score += 12

        if "football" in normalized_preferences:
            score += 8

    elif has_upcoming_match:
        score += 4

    return score


def build_reason_text(
    matched_preferences: list[str],
    distance_km: float,
    has_match_today: bool,
    horaires_present: bool,
) -> list[str]:
    reasons = []

    if matched_preferences:
        reasons.append("correspond à vos préférences")

    if distance_km <= 1:
        reasons.append("très proche de vous")
    elif distance_km <= 3:
        reasons.append("proche de vous")

    if horaires_present:
        reasons.append("horaires disponibles")

    if has_match_today:
        reasons.append("pertinent avant ou après match")

    return reasons


@app.post("/recommend")
def recommend(data: RecommendationRequest):
    try:
        profile = get_user_profile(data.access_token)
        preferences = extract_preferences(profile)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"ProfileService error: {str(e)}")

    try:
        commerces = get_nearby_commerces(
            data.latitude,
            data.longitude,
            rayon_km=DEFAULT_RADIUS_KM,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"BusinessService error: {str(e)}")

    fallback_mode = False

    # Si rien autour de l'utilisateur, on élargit fortement la recherche
    if not commerces:
        try:
            commerces = get_nearby_commerces(
                data.latitude,
                data.longitude,
                rayon_km=FALLBACK_RADIUS_KM,
            )
            fallback_mode = True
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"BusinessService fallback error: {str(e)}",
            )

    try:
        matches_today = get_today_matches()
    except Exception:
        matches_today = []

    try:
        upcoming_matches = get_upcoming_matches()
    except Exception:
        upcoming_matches = []

    has_match_today = len(matches_today) > 0
    has_upcoming_match = len(upcoming_matches) > 0

    normalized_preferences = [normalize_text(p) for p in preferences]
    mapped_targets = get_interest_targets(preferences)
    mapped_categories = mapped_targets["categories"]
    mapped_tags = mapped_targets["tags"]

    results = []

    for commerce in commerces:
        score = 0
        matched_preferences = []

        distance = float(commerce.get("distanceKm", 9999))
        score += score_distance(distance)

        nom_categorie = normalize_text(str(commerce.get("nomCategorie", "")))
        tags = [normalize_text(str(tag)) for tag in commerce.get("tagsCulturels", [])]

        # Match direct avec préférences utilisateur
        for pref in normalized_preferences:
            if pref in tags:
                score += 20
                if pref not in matched_preferences:
                    matched_preferences.append(pref)

            if pref and pref in nom_categorie:
                score += 15
                if pref not in matched_preferences:
                    matched_preferences.append(pref)

        # Match via mapping onboarding -> catégories/tags métier
        for mapped_tag in mapped_tags:
            if mapped_tag in tags:
                score += 14
                if mapped_tag not in matched_preferences:
                    matched_preferences.append(mapped_tag)

        for mapped_category in mapped_categories:
            if mapped_category and mapped_category in nom_categorie:
                score += 14
                if mapped_category not in matched_preferences:
                    matched_preferences.append(mapped_category)

        horaires = commerce.get("horaires", [])
        horaires_present = bool(horaires)

        if horaires_present:
            score += 10

        score += score_match_context(
            has_match_today=has_match_today,
            has_upcoming_match=has_upcoming_match,
            normalized_preferences=normalized_preferences,
            category_text=nom_categorie,
        )

        score += score_time_available(
            available_minutes=data.available_minutes,
            distance=distance,
        )

        # Budget: placeholder pour prochaine étape
        if data.budget is not None:
            score += 0

        reasons = build_reason_text(
            matched_preferences=matched_preferences,
            distance_km=distance,
            has_match_today=has_match_today,
            horaires_present=horaires_present,
        )

        results.append(
            {
                "commerce": commerce,
                "score": score,
                "distanceKm": distance,
                "matchedPreferences": matched_preferences,
                "reasons": reasons,
            }
        )

    results.sort(key=lambda x: x["score"], reverse=True)

    strong_results = [r for r in results if r["score"] >= STRONG_MATCH_THRESHOLD]

    if strong_results:
        final_results = strong_results[:5]
        response_mode = "normal"
        message = "Recommandations trouvées."
    else:
        final_results = results[:5]
        response_mode = "fallback"
        message = (
            f"Aucune correspondance parfaite trouvée près de vous. "
            f"Voici les meilleures options disponibles pour la zone couverte ({COVERAGE_CITY})."
        )

    if fallback_mode and final_results:
        response_mode = "fallback_out_of_area"
        message = (
            f"Aucun commerce pertinent n’a été trouvé autour de votre position actuelle. "
            f"Les recommandations affichées proviennent principalement de la zone couverte ({COVERAGE_CITY})."
        )

    return {
        "mode": response_mode,
        "message": message,
        "userPreferences": preferences,
        "mappedCategories": mapped_categories,
        "mappedTags": mapped_tags,
        "matchesTodayCount": len(matches_today),
        "upcomingMatchesCount": len(upcoming_matches),
        "searchedRadiusKm": FALLBACK_RADIUS_KM if fallback_mode else DEFAULT_RADIUS_KM,
        "recommendations": final_results,
    }