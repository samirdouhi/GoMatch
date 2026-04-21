from typing import List, Optional

from pydantic import BaseModel


class CandidateItem(BaseModel):
    id: str
    source: str
    type: str
    title: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_level: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    tags: List[str] = []
    opening_hours: List[str] = []
    popularity: Optional[float] = None
    distance_km: Optional[float] = None
    profile_score: float = 0.0
    match_score: float = 0.0
    budget_score: float = 0.0
    final_score: float = 0.0