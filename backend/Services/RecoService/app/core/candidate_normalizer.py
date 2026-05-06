from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from app.config import settings
from app.models.domain_models import CandidateItem
from app.utils.text import normalize_tags

_JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]


def _business_photo_url(raw: dict) -> Optional[str]:
    photos = raw.get("photos")
    if not photos or not isinstance(photos, list):
        return None

    sorted_photos = sorted(
        photos,
        key=lambda p: p.get("ordre", 999) if isinstance(p, dict) else 999,
    )

    # Use PUBLIC_ASSET_BASE_URL so the browser can reach the image
    public_base = settings.PUBLIC_ASSET_BASE_URL.rstrip("/")
    internal_base = settings.GATEWAY_BASE_URL.rstrip("/")

    for p in sorted_photos:
        if not isinstance(p, dict):
            continue
        url_image = p.get("urlImage") or p.get("url_image") or p.get("url")
        if not url_image:
            continue
        if url_image.startswith("http"):
            # Replace internal Docker URL with public-facing URL
            if internal_base and url_image.startswith(internal_base):
                return public_base + url_image[len(internal_base):]
            return url_image
        if url_image.startswith("/uploads/"):
            return f"{public_base}{url_image}"
        return f"{public_base}{settings.BUSINESS_SERVICE_PATH}{url_image}"

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


def _parse_business_opening_hours(raw: dict) -> List[str]:
    """
    Convert BusinessService horaires[] to parseable strings like "09:00 – 18:00".
    The scoring engine parses these with regex (\d{1,2})[h:](\d{0,2}).
    """
    horaires = raw.get("horaires") or []
    if not isinstance(horaires, list):
        return []

    today_js = datetime.now().weekday()  # 0=Mon … 6=Sun
    # BusinessService: jourSemaine 0=Lun … 6=Dim
    result: List[str] = []
    for h in horaires:
        if not isinstance(h, dict) or h.get("estFerme"):
            continue
        ouv = str(h.get("heureOuverture") or "")
        ferm = str(h.get("heureFermeture") or "")
        if ouv and ferm:
            result.append(f"{ouv[:5]} – {ferm[:5]}")
    return result


def _business_tags(raw: dict) -> List[str]:
    """Combine nomCategorie + tagsCulturels for richer keyword matching."""
    tags = normalize_tags(raw.get("tagsCulturels"))
    cat = raw.get("nomCategorie")
    if cat and str(cat).lower() not in [t.lower() for t in tags]:
        tags.insert(0, str(cat).lower())
    return tags


def normalize_business_item(raw: dict) -> CandidateItem:
    item_type = str(raw.get("nomCategorie") or raw.get("type") or "business").lower()
    item_id = str(raw.get("id"))

    # Correct field mapping: noteGlobale (not rating), nombreAvis (not reviewCount)
    note = raw.get("noteGlobale")
    nb_avis = raw.get("nombreAvis") or 0

    return CandidateItem(
        id=item_id,
        source="business",
        type=item_type,
        title=raw.get("nom") or raw.get("title") or "Lieu",
        description=raw.get("description"),
        address=raw.get("adresse"),
        latitude=raw.get("latitude"),
        longitude=raw.get("longitude"),
        price_level=None,
        rating=float(note) if note is not None else None,
        review_count=int(nb_avis) if nb_avis else None,
        tags=_business_tags(raw),
        opening_hours=_parse_business_opening_hours(raw),
        popularity=float(nb_avis) / 10.0 if nb_avis else None,
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
        address=raw.get("adresse"),
        latitude=raw.get("latitude"),
        longitude=raw.get("longitude"),
        price_level=str(raw.get("prixMoyen")) if raw.get("prixMoyen") is not None else None,
        rating=raw.get("note"),
        review_count=raw.get("reviewCount") or raw.get("nombreAvis"),
        tags=normalize_tags(raw.get("tags")),
        opening_hours=[],
        popularity=raw.get("popularite"),
        photo_url=_discovery_photo_url(raw),
    )


def _culture_tags(raw: dict) -> List[str]:
    """Build tags from category + tag names for cultural content."""
    tags: List[str] = []
    cat = raw.get("nomCategorie") or raw.get("categorie", {})
    if isinstance(cat, dict):
        cat = cat.get("nom", "")
    if cat:
        tags.append(str(cat).lower())
    # tagsCulturels may be list of strings or list of objects with 'nom'
    raw_tags = raw.get("tagsCulturels") or raw.get("tags") or []
    for t in raw_tags:
        if isinstance(t, str):
            tags.append(t.lower())
        elif isinstance(t, dict):
            nom = t.get("nom") or t.get("name", "")
            if nom:
                tags.append(str(nom).lower())
    # Always add cultural keyword for intent matching
    tags.extend(["culture", "culturel", "historique", "patrimoine"])
    return list(dict.fromkeys(tags))  # deduplicate while preserving order


def _culture_photo_url(raw: dict) -> Optional[str]:
    medias = raw.get("medias") or []
    for m in medias:
        if isinstance(m, dict) and m.get("type") == "Image":
            url = m.get("url") or m.get("urlImage")
            if url and isinstance(url, str) and url.strip():
                return url.strip()
    return None


def normalize_culture_item(raw: dict) -> CandidateItem:
    """Normalize a CultureService ContenuCulturel to CandidateItem."""
    item_id = f"culture_{raw.get('id', '')}"
    return CandidateItem(
        id=item_id,
        source="culture",
        type="cultural",
        title=raw.get("titre") or raw.get("title") or "Contenu culturel",
        description=raw.get("resume") or raw.get("corps"),
        address=raw.get("lieu"),
        latitude=raw.get("latitude"),
        longitude=raw.get("longitude"),
        price_level=None,
        rating=4.0,  # Cultural content doesn't have ratings; default to good
        review_count=None,
        tags=_culture_tags(raw),
        opening_hours=[],
        popularity=None,
        photo_url=_culture_photo_url(raw),
    )
