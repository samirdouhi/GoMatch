import unicodedata


def normalize_text(value: str) -> str:
    value = value.strip().lower()
    value = unicodedata.normalize("NFKD", value)
    value = "".join(c for c in value if not unicodedata.combining(c))
    return value


INTEREST_MAPPING = {
    "gastronomie": {
        "categories": ["restauration", "cafe & salon de the"],
        "tags": ["gastronomie", "local", "traditionnel", "street food"]
    },
    "cafes": {
        "categories": ["cafe & salon de the"],
        "tags": ["moderne", "rapide", "ambiance locale", "cafe"]
    },
    "culture": {
        "categories": ["loisirs & tourisme", "souvenirs & cadeaux", "artisanat"],
        "tags": ["culture", "tradition", "patrimoine", "musee"]
    },
    "artisanat": {
        "categories": ["artisanat", "souvenirs & cadeaux", "epicerie & produits locaux"],
        "tags": ["artisanal", "local", "traditionnel"]
    },
    "football": {
        "categories": ["cafe & salon de the", "restauration", "loisirs & tourisme"],
        "tags": ["football", "sport", "match", "fan zone"]
    },
    "shopping": {
        "categories": ["mode & habillement", "souvenirs & cadeaux", "services"],
        "tags": ["shopping", "boutique", "local"]
    },
    "marches": {
        "categories": ["epicerie & produits locaux", "souvenirs & cadeaux", "artisanat"],
        "tags": ["marche", "souk", "local"]
    },
    "architecture": {
        "categories": ["loisirs & tourisme"],
        "tags": ["architecture", "monument", "historique"]
    },
    "nature": {
        "categories": ["loisirs & tourisme"],
        "tags": ["nature", "randonnee", "paysage"]
    },
    "events": {
        "categories": ["loisirs & tourisme", "restauration"],
        "tags": ["festival", "evenement", "activite"]
    },
    "evenements": {
        "categories": ["loisirs & tourisme", "restauration"],
        "tags": ["festival", "evenement", "activite"]
    },
    "nightlife": {
        "categories": ["cafe & salon de the", "restauration"],
        "tags": ["sortie", "ambiance", "nightlife"]
    }
}


def get_interest_targets(preferences: list[str]) -> dict:
    mapped_categories = set()
    mapped_tags = set()

    for pref in preferences:
        key = normalize_text(pref)
        targets = INTEREST_MAPPING.get(key)

        if not targets:
            continue

        for category in targets["categories"]:
            mapped_categories.add(normalize_text(category))

        for tag in targets["tags"]:
            mapped_tags.add(normalize_text(tag))

    return {
        "categories": list(mapped_categories),
        "tags": list(mapped_tags)
    }