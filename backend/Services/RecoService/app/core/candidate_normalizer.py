from __future__ import annotations

from typing import Optional

from app.config import settings
from app.models.domain_models import CandidateItem
from app.utils.text import normalize_tags


def _business_photo_url(raw: dict) -> Optional[str]:
    photos = raw.get("photos")
    if not photos or not isinstance(photos, list):
        return None

    sorted_photos = sorted(photos, key=lambda p: p.get("ordre", 999) if isinstance(p, dict) else 999)

    for p in sorted_photos:
        if not isinstance(p, dict):
            continue
        url_image = p.get("urlImage") or p.get("url_image") or p.get("url")
        if not url_image:
            continue
        if url_image.startswith("http"):
            return url_image
        base = settings.GATEWAY_BASE_URL.rstrip("/") + settings.BUSINESS_SERVICE_PATH
        return base + url_image

    return None


def _discovery_photo_url(raw: dict) -> Optional[str]:
    images = raw.get("images")
    if images and isinstance(images, list):
        for img in images:
            if isinstance(img, str) and img.strip():
                url = img.strip()
                if url.startswith("http"):
                    return url
                base = settings.GATEWAY_BASE_URL.rstrip("/") + settings.DISCOVERY_SERVICE_PATH
                return base + url

    for key in ["imageUrl", "image", "photo", "cover", "thumbnail"]:
        val = raw.get(key)
        if val and isinstance(val, str) and val.strip():
            return val.strip()

    return None


def normalize_business_item(raw: dict) -> CandidateItem:
    item_type = str(raw.get("nomCategorie") or raw.get("type") or "business").lower()
    item_id = str(raw.get("id"))
    return CandidateItem(
        id=item_id,
        source="business",
        type=item_type,
        title=raw.get("nom") or raw.get("title") or "Lieu",
        description=raw.get("description"),
        latitude=raw.get("latitude"),
        longitude=raw.get("longitude"),
        price_level=None,
        rating=raw.get("rating"),
        review_count=raw.get("reviewCount"),
        tags=normalize_tags(raw.get("tagsCulturels")),
        popularity=None,
        photo_url=_business_photo_url(raw),
    )


def normalize_discovery_item(raw: dict) -> CandidateItem:
    item_type = str(raw.get("type") or "place").lower()
    item_id = str(raw.get("id"))
    return CandidateItem(
        id=item_id,
        source="discovery",
        type=item_type,
        title=raw.get("nom") or raw.get("title") or "Lieu",
        description=raw.get("description"),
        latitude=raw.get("latitude"),
        longitude=raw.get("longitude"),
        price_level=str(raw.get("prixMoyen")) if raw.get("prixMoyen") is not None else None,
        rating=raw.get("note"),
        review_count=raw.get("reviewCount"),
        tags=normalize_tags(raw.get("tags")),
        popularity=raw.get("popularite"),
        photo_url=_discovery_photo_url(raw),
    )
