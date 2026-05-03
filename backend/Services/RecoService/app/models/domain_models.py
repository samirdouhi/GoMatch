from typing import List, Optional

from pydantic import BaseModel


class CandidateItem(BaseModel):
    id: str
    source: str                          # "business" | "discovery" | "event"
    type: str
    title: str
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_level: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    tags: List[str] = []
    opening_hours: List[str] = []
    popularity: Optional[float] = None
    distance_km: Optional[float] = None
    stadium_distance_km: Optional[float] = None
    photo_url: Optional[str] = None
    photos: List[str] = []

    # Scoring components — spec v3 names
    distance_score: float = 0.0
    intent_match_score: float = 0.0
    context_match_score: float = 0.0
    rating_score: float = 0.0
    opening_score: float = 0.0
    diversity_score: float = 0.0
    local_impact_score: float = 0.0
    final_score: float = 0.0

    # Legacy aliases kept for backward compat with planners / LLM responder
    profile_score: float = 0.0
    match_score: float = 0.0
    budget_score: float = 0.0
    time_slot_score: float = 0.0
    fan_score: float = 0.0
