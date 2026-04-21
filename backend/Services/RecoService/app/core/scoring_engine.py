from app.core.context_builder import RecommendationContext
from app.models.domain_models import CandidateItem
from app.utils.budget import normalize_budget


def _compute_profile_score(item: CandidateItem, context: RecommendationContext) -> float:
    score = 0.0
    profile = context.profile or {}

    preferences = profile.get("preferences") or []
    if isinstance(preferences, list):
        pref_lower = {str(p).strip().lower() for p in preferences}
        item_tags = {str(tag).strip().lower() for tag in item.tags}
        overlap = pref_lower.intersection(item_tags)
        if overlap:
            score += min(0.30, 0.10 * len(overlap))

    group_type = context.constraints.get("group_type")
    if group_type and group_type in {tag.lower() for tag in item.tags}:
        score += 0.10

    ambiance = context.constraints.get("ambiance")
    if ambiance and ambiance in {tag.lower() for tag in item.tags}:
        score += 0.15

    return score


def _compute_budget_score(item: CandidateItem, context: RecommendationContext) -> float:
    requested = normalize_budget(context.constraints.get("budget"))
    item_budget = normalize_budget(item.price_level)

    if not requested or not item_budget:
        return 0.0

    if requested == item_budget:
        return 0.15

    near_pairs = {("low", "medium"), ("medium", "low"), ("medium", "high"), ("high", "medium")}
    if (requested, item_budget) in near_pairs:
        return 0.07

    return -0.05


def _compute_match_score(item: CandidateItem, context: RecommendationContext) -> float:
    if context.intent not in {"pre_match_plan", "post_match_plan"}:
        return 0.0

    if item.distance_km is None:
        return 0.0

    if item.distance_km < 2:
        return 0.20
    if item.distance_km < 5:
        return 0.10
    return 0.0


def _compute_distance_score(item: CandidateItem) -> float:
    if item.distance_km is None:
        return 0.0
    if item.distance_km < 1:
        return 0.20
    if item.distance_km < 3:
        return 0.15
    if item.distance_km < 5:
        return 0.08
    if item.distance_km < 10:
        return 0.03
    return 0.0


def _compute_quality_score(item: CandidateItem) -> float:
    score = 0.0
    if item.rating is not None:
        score += min(float(item.rating) / 50.0, 0.10)
    if item.popularity is not None:
        score += min(float(item.popularity) / 1000.0, 0.08)
    return score


def _compute_requested_type_score(item: CandidateItem, context: RecommendationContext) -> float:
    requested_type = context.constraints.get("requested_place_type")
    if not requested_type:
        return 0.0

    item_type = (item.type or "").lower()
    title = (item.title or "").lower()
    description = (item.description or "").lower()
    tags = {str(tag).strip().lower() for tag in item.tags}

    text_blob = f"{item_type} {title} {description} {' '.join(tags)}"

    if requested_type == "cafe":
        if any(x in text_blob for x in ["cafe", "café", "coffee"]):
            return 0.40
        if "restaurant" in item_type:
            return 0.10
        if "hotel" in item_type:
            return -0.25

    if requested_type == "restaurant":
        if any(x in text_blob for x in ["restaurant", "resto", "food", "gastro"]):
            return 0.35
        if "hotel" in item_type:
            return -0.15

    if requested_type == "hotel":
        if "hotel" in text_blob or "hôtel" in text_blob:
            return 0.40
        return -0.10

    if requested_type == "activity":
        if any(x in text_blob for x in [
            "activity", "activities", "attraction", "museum", "musée", "musee",
            "monument", "culture", "viewpoint", "nightlife", "bar", "club",
            "bistro", "visit", "visite"
        ]):
            return 0.40
        if "hotel" in item_type:
            return -0.30

    if requested_type == "cultural":
        if any(x in text_blob for x in ["museum", "musée", "musee", "attraction", "monument", "culture"]):
            return 0.35
        if "hotel" in item_type:
            return -0.15

    if requested_type == "nightlife":
        if any(x in text_blob for x in ["nightlife", "bar", "club"]):
            return 0.35
        if "hotel" in item_type:
            return -0.10

    return 0.0


def score_candidate(item: CandidateItem, context: RecommendationContext) -> CandidateItem:
    item.profile_score = _compute_profile_score(item, context)
    item.budget_score = _compute_budget_score(item, context)
    item.match_score = _compute_match_score(item, context)

    distance_score = _compute_distance_score(item)
    quality_score = _compute_quality_score(item)
    requested_type_score = _compute_requested_type_score(item, context)

    item.final_score = (
        item.profile_score
        + item.budget_score
        + item.match_score
        + distance_score
        + quality_score
        + requested_type_score
    )

    return item