from typing import Optional


def normalize_budget(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    text = str(value).strip().lower()

    if text.isdigit():
        amount = int(text)
        if amount <= 120:
            return "low"
        if amount <= 400:
            return "medium"
        return "high"

    mapping = {
        "cheap": "low",
        "low": "low",
        "budget": "low",
        "pas cher": "low",
        "economique": "low",
        "économique": "low",
        "$": "low",

        "medium": "medium",
        "moyen": "medium",
        "modéré": "medium",
        "modere": "medium",
        "$$": "medium",

        "high": "high",
        "expensive": "high",
        "haut de gamme": "high",
        "luxe": "high",
        "$$$": "high",
    }

    return mapping.get(text, text if text in {"low", "medium", "high"} else None)