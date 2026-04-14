from pydantic import BaseModel


class RecommendationRequest(BaseModel):
    latitude: float
    longitude: float
    available_minutes: int
    budget: float | None = None
    access_token: str