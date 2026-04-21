from app.models.domain_models import CandidateItem
from app.utils.text import normalize_tags


def normalize_business_item(raw: dict) -> CandidateItem:
    return CandidateItem(
        id=str(raw.get("id")),
        source="business",
        type=str(raw.get("nomCategorie") or raw.get("type") or "business").lower(),
        title=raw.get("nom") or raw.get("title") or "Lieu",
        description=raw.get("description"),
        latitude=raw.get("latitude"),
        longitude=raw.get("longitude"),
        price_level=None,
        rating=raw.get("rating"),
        review_count=raw.get("reviewCount"),
        tags=normalize_tags(raw.get("tagsCulturels")),
        popularity=None,
    )


def normalize_discovery_item(raw: dict) -> CandidateItem:
    return CandidateItem(
        id=str(raw.get("id")),
        source="discovery",
        type=str(raw.get("type") or "place").lower(),
        title=raw.get("nom") or raw.get("title") or "Lieu",
        description=raw.get("description"),
        latitude=raw.get("latitude"),
        longitude=raw.get("longitude"),
        price_level=str(raw.get("prixMoyen")) if raw.get("prixMoyen") is not None else None,
        rating=raw.get("note"),
        review_count=raw.get("reviewCount"),
        tags=normalize_tags(raw.get("tags")),
        popularity=raw.get("popularite"),
    )