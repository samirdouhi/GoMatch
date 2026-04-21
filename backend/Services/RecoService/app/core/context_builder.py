from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class RecommendationContext:
    intent: str
    constraints: Dict[str, Any]
    profile: Dict[str, Any]
    user_latitude: Optional[float]
    user_longitude: Optional[float]
    current_match: Optional[Dict[str, Any]]