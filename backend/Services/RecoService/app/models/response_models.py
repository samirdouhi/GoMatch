from typing import Any, Dict, List, Optional

from pydantic import BaseModel


# ── Score breakdown (spec v3) ─────────────────────────────────────────────────

class ScoreBreakdown(BaseModel):
    distanceScore: float = 0.0
    intentMatchScore: float = 0.0
    contextMatchScore: float = 0.0
    ratingScore: float = 0.0
    openingScore: float = 0.0
    diversityScore: float = 0.0
    localImpactScore: float = 0.0


# ── Recommendation item (spec v3) ─────────────────────────────────────────────

class RecommendationItemDto(BaseModel):
    id: str
    source: str                          # "business" | "discovery" | "event"
    type: str
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distanceKm: Optional[float] = None
    estimatedTravelMinutes: Optional[int] = None
    imageUrl: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    noteGlobale: Optional[float] = None   # Only for source == "business"
    nombreAvis: Optional[int] = None      # Only for source == "business"
    isOpen: Optional[bool] = None
    scoreTotal: float = 0.0              # 0-100 scale
    scoreBreakdown: ScoreBreakdown = ScoreBreakdown()
    reason: str = ""
    callToAction: str = "Voir sur la carte"


# ── Recommendation card (legacy + kept for backward compat) ───────────────────

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
    photo_url: Optional[str] = None


# ── Plan step (spec v2) ───────────────────────────────────────────────────────

class PlanStep(BaseModel):
    startTime: str
    endTime: str
    type: str           # food | culture | cafe | shopping | fan_zone | transport | match
    title: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distanceFromUserKm: Optional[float] = None
    distanceToStadiumKm: Optional[float] = None
    estimatedDurationMinutes: int = 60
    reason: str = ""
    photo_url: Optional[str] = None
    address: Optional[str] = None
    source: Optional[str] = None        # "business" | "discovery" | "event"


# ── Safety info ───────────────────────────────────────────────────────────────

class SafetyInfo(BaseModel):
    kickoff: Optional[str] = None
    recommendedArrival: Optional[str] = None
    latestDepartureToStadium: Optional[str] = None
    warningMessage: Optional[str] = None


# ── Day plan ──────────────────────────────────────────────────────────────────

class DayPlan(BaseModel):
    date: Optional[str] = None
    label: str = ""
    type: str = "off_day"               # arrival | match_day | off_day | departure
    plan: List[PlanStep] = []
    route: List[List[float]] = []
    safety: Optional[SafetyInfo] = None
    match_info: Optional[Dict[str, Any]] = None


# ── Legacy program structures ─────────────────────────────────────────────────

class ProgramSlot(BaseModel):
    slot_key: str
    time_str: str
    end_time_str: Optional[str] = None
    duration_min: int
    duration_label: Optional[str] = None
    label: str
    emoji: str
    tip: Optional[str] = None
    is_match: bool = False
    card: Optional[RecommendationCard] = None


class DayProgram(BaseModel):
    match_team1: Optional[str] = None
    match_team2: Optional[str] = None
    match_kickoff: Optional[str] = None
    match_date: Optional[str] = None
    match_city: Optional[str] = None
    match_stadium: Optional[str] = None
    match_stadium_address: Optional[str] = None
    slots: List[ProgramSlot] = []


# ── Main response ─────────────────────────────────────────────────────────────

class RecommendationResponse(BaseModel):
    # ── Spec v3 ───────────────────────────────────────────────────────────────
    intent: str
    mode: str = "specific"
    summary: str = ""
    safety: Optional[SafetyInfo] = None
    primaryRecommendations: List[RecommendationItemDto] = []
    alternativeRecommendations: List[RecommendationItemDto] = []
    plan: List[PlanStep] = []
    days: List[DayPlan] = []
    route: List[List[float]] = []
    followUpQuestion: Optional[str] = None        # Singular, for display
    followUpQuestions: List[str] = []             # Full list

    # ── Legacy fields (spec v2 backward compat) ───────────────────────────────
    recommendations: List[RecommendationCard] = []
    message: str = ""
    cards: List[RecommendationCard] = []
    followups: List[str] = []
    alternatives: List[RecommendationCard] = []
    program: Optional[DayProgram] = None
    needs_clarification: bool = False
    clarification_question: Optional[str] = None
    memory_updates: Dict[str, Any] = {}
