from typing import List

from app.models.domain_models import CandidateItem


def diversify(items: List[CandidateItem], max_items: int = 3) -> List[CandidateItem]:
    selected: List[CandidateItem] = []
    seen_types = set()

    for item in sorted(items, key=lambda x: x.final_score, reverse=True):
        item_type = (item.type or "").lower()

        if item_type not in seen_types or len(selected) < 2:
            selected.append(item)
            seen_types.add(item_type)

        if len(selected) >= max_items:
            break

    return selected