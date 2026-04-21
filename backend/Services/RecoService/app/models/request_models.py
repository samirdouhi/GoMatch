from typing import List, Optional

from pydantic import BaseModel, Field


class UserContext(BaseModel):
    access_token: str = Field(default="")
    user_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    language: Optional[str] = "fr"


class RecommendationRequest(BaseModel):
    message: str
    context: UserContext
    current_match_id: Optional[str] = None
    excluded_ids: List[str] = []
    session_recommended_ids: List[str] = []
    conversation_memory: Optional[dict] = None