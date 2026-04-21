from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class RecommendationCard(BaseModel):
    id: str
    source: str
    type: str
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_text: Optional[str] = None
    price_level: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    tags: List[str] = []
    reason: Optional[str] = None
    actions: List[str] = []


class RecommendationResponse(BaseModel):
    intent: str
    message: str
    cards: List[RecommendationCard]
    followups: List[str]
    alternatives: List[RecommendationCard] = []
    needs_clarification: bool = False
    clarification_question: Optional[str] = None
    memory_updates: Dict[str, Any] = {}