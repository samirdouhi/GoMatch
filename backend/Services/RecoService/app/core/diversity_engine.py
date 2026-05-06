"""
diversity_engine.py — Diversity and rotation logic for recommendations.

Rules:
  - Maximum 2 items of the same broad category in the primary 3
  - Items in excludedIds get a score penalty
  - Controlled randomization ±0.03 to prevent always proposing the same places
  - Alternative recommendations pull from different categories than primary
"""
from __future__ import annotations

import random
from typing import List, Set

from app.models.domain_models import CandidateItem

# ── Category normalization ────────────────────────────────────────────────────

_CATEGORY_MAP = [
    (["café", "cafe", "coffee", "salon de thé", "breakfast", "brunch"], "cafe"),
    (["restaurant", "resto", "food", "gastro", "tajine", "couscous", "cuisine", "grill", "pizz"], "restaurant"),
    (["hotel", "hôtel", "riad", "auberge", "maison d'hôtes", "hébergement", "gîte"], "hotel"),
    (["museum", "musée", "monument", "attraction", "culture", "patrimoine", "kasbah", "médina",
      "historique", "archéologie", "galerie", "art", "culturel"], "culture"),
    (["fanzone", "fan zone", "bar sport", "sports bar", "écran géant", "watch party", "pub foot"], "fanzone"),
    (["bar", "nightlife", "club", "discothèque", "boîte", "lounge", "pub"], "nightlife"),
    (["activity", "activité", "excursion", "balade", "viewpoint", "promenade", "randonnée"], "activity"),
    (["souk", "marché", "artisanat", "boutique", "artisan", "shop", "commerce local"], "souk"),
    (["stade", "stadium", "arena"], "stadium"),
]


def _get_category(item: CandidateItem) -> str:
    blob = (
        f"{(item.type or '').lower()} "
        f"{(item.title or '').lower()} "
        f"{' '.join(str(t).lower() for t in item.tags)}"
    )
    for keywords, cat in _CATEGORY_MAP:
        if any(k in blob for k in keywords):
            return cat
    return item.source or "other"


# ── Core diversity functions ───────────────────────────────────────────────────

def apply_randomization(
    items: List[CandidateItem],
    noise_range: float = 0.03,
    seed: int | None = None,
) -> List[CandidateItem]:
    """
    Apply controlled ±noise_range jitter to final_score.
    Prevents the same recommendations appearing every single time.
    """
    rng = random.Random(seed)
    for item in items:
        noise = rng.uniform(-noise_range, noise_range)
        item.final_score = max(0.0, min(1.0, item.final_score + noise))
    return items


def apply_excluded_penalty(
    items: List[CandidateItem],
    excluded_ids: List[str],
    penalty: float = 0.30,
) -> List[CandidateItem]:
    """Reduce score for items already proposed in this session."""
    blocked = set(excluded_ids)
    for item in items:
        if item.id in blocked:
            item.final_score = max(0.0, item.final_score - penalty)
    return items


def diversify_primary(
    items: List[CandidateItem],
    n_primary: int = 3,
    max_same_category: int = 1,
) -> List[CandidateItem]:
    """
    Select n_primary items ensuring at most max_same_category per broad category.
    Default is max 1 per category to maximise diversity.
    Falls back to fill remaining slots if not enough variety.
    """
    sorted_items = sorted(items, key=lambda x: x.final_score, reverse=True)
    category_counts: dict[str, int] = {}
    selected: List[CandidateItem] = []
    overflow: List[CandidateItem] = []

    for item in sorted_items:
        cat = _get_category(item)
        count = category_counts.get(cat, 0)
        if len(selected) < n_primary and count < max_same_category:
            selected.append(item)
            category_counts[cat] = count + 1
        else:
            overflow.append(item)

    # Fill remaining slots if not enough variety (relax the constraint)
    for item in overflow:
        if len(selected) >= n_primary:
            break
        if item not in selected:
            selected.append(item)

    return selected[:n_primary]


def get_alternatives(
    all_items: List[CandidateItem],
    primary_items: List[CandidateItem],
    n_alternatives: int = 4,
    prefer_different_category: bool = True,
) -> List[CandidateItem]:
    """
    Return n_alternatives items not in primary_items.
    Prefers items from different categories than primary when possible.
    """
    primary_ids: Set[str] = {item.id for item in primary_items}
    primary_cats: Set[str] = {_get_category(item) for item in primary_items}
    remaining = [i for i in all_items if i.id not in primary_ids]

    if prefer_different_category:
        # Prefer different categories, sorted by score
        different_cat = [i for i in remaining if _get_category(i) not in primary_cats]
        same_cat = [i for i in remaining if _get_category(i) in primary_cats]

        different_cat.sort(key=lambda x: x.final_score, reverse=True)
        same_cat.sort(key=lambda x: x.final_score, reverse=True)

        result = different_cat[:n_alternatives]
        if len(result) < n_alternatives:
            result.extend(same_cat[:n_alternatives - len(result)])
        return result

    return sorted(remaining, key=lambda x: x.final_score, reverse=True)[:n_alternatives]


def diversify(items: List[CandidateItem], max_items: int = 3) -> List[CandidateItem]:
    """Legacy compatibility wrapper."""
    return diversify_primary(items, n_primary=max_items, max_same_category=2)
