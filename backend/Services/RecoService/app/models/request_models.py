from typing import List, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class UserContext(BaseModel):
    access_token: str = Field(default="")
    user_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    language: Optional[str] = "fr"


class RecommendationRequest(BaseModel):
    """Internal request format — used by /conversation endpoint (backward compat)."""
    message: str
    context: UserContext
    current_match_id: Optional[str] = None
    excluded_ids: List[str] = []
    session_recommended_ids: List[str] = []
    conversation_memory: Optional[dict] = None
    conversation_history: List[ChatMessage] = []


class RecoChatRequest(BaseModel):
    """
    Spec v3 request format for /api/reco/chat and /api/reco/recommend.
    Exposes all context fields at the top level for easier integration.
    """
    message: str
    userLatitude: Optional[float] = None
    userLongitude: Optional[float] = None
    userId: Optional[str] = None
    selectedMatchId: Optional[str] = None
    hasTicket: Optional[bool] = None
    availableMinutes: Optional[int] = None
    budget: Optional[str] = None               # "low" | "medium" | "high"
    preferences: List[str] = []               # ["culture", "local", "calme"]
    excludedIds: List[str] = []
    accessToken: str = ""
    conversationHistory: List[ChatMessage] = []
    conversationMemory: Optional[dict] = None
    language: str = "fr"

    def to_recommendation_request(self) -> RecommendationRequest:
        """Bridge to legacy internal request model."""
        memory: dict = dict(self.conversationMemory or {})
        if self.budget:
            memory["budget"] = self.budget
        if self.availableMinutes is not None:
            memory["time_available_minutes"] = self.availableMinutes
        if self.hasTicket is not None:
            memory["has_ticket"] = self.hasTicket
        if self.preferences:
            memory["preferences"] = self.preferences

        return RecommendationRequest(
            message=self.message,
            context=UserContext(
                access_token=self.accessToken,
                user_id=self.userId,
                latitude=self.userLatitude,
                longitude=self.userLongitude,
                language=self.language,
            ),
            current_match_id=self.selectedMatchId,
            excluded_ids=self.excludedIds,
            session_recommended_ids=self.excludedIds,
            conversation_memory=memory,
            conversation_history=self.conversationHistory,
        )


class MatchContextRequest(BaseModel):
    """Match-specific request for /api/reco/before-match and /api/reco/after-match."""
    userLatitude: Optional[float] = None
    userLongitude: Optional[float] = None
    userId: Optional[str] = None
    matchId: Optional[str] = None
    hasTicket: Optional[bool] = True
    availableMinutes: Optional[int] = None
    budget: Optional[str] = None
    preferences: List[str] = []
    excludedIds: List[str] = []
    accessToken: str = ""
    language: str = "fr"


class DayPlanRequest(BaseModel):
    """Request for /api/reco/day-plan — generate a full day itinerary."""
    userLatitude: Optional[float] = None
    userLongitude: Optional[float] = None
    userId: Optional[str] = None
    city: Optional[str] = "Rabat"
    matchId: Optional[str] = None
    hasTicket: Optional[bool] = None
    budget: Optional[str] = None
    preferences: List[str] = []
    groupType: Optional[str] = None           # "family" | "couple" | "friends" | "solo"
    excludedIds: List[str] = []
    accessToken: str = ""
    language: str = "fr"
