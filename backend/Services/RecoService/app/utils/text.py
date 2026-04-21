from typing import Iterable, List


def safe_lower(value: str | None) -> str:
    return (value or "").strip().lower()


def contains_any(text: str, keywords: Iterable[str]) -> bool:
    lowered = safe_lower(text)
    return any(keyword in lowered for keyword in keywords)


def normalize_tags(tags: list | None) -> List[str]:
    if not tags:
        return []

    cleaned = []
    for tag in tags:
        if tag is None:
            continue
        text = str(tag).strip()
        if text:
            cleaned.append(text)

    return cleaned