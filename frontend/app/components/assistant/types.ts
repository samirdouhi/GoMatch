// GoMatch Assistant — shared types

export type Mode = 'before_match' | 'after_match' | 'day_plan' | 'general'
export type Budget = 'low' | 'medium' | 'high'
export type Source = 'business' | 'discovery' | 'event' | 'culture'

/** Strict match context — selectedMatchId is immutable once set. */
export interface MatchContext {
  selectedMatchId: string
  homeTeam: string
  awayTeam: string
  stadium: string
  city: string
  kickoffTime: string   // "18:00"
  kickoffDate: string   // "2030-06-15"
  kickoffISO?: string
  hasTicket: boolean
  stadiumLat?: number
  stadiumLng?: number
  fanZones?: string[]
}

export interface UserContext {
  latitude?: number
  longitude?: number
  availableMinutes?: number
  budget: Budget
  mode: Mode
  preferences: string[]
  hasTicket: boolean
}

export interface ScoreBreakdown {
  distanceScore: number
  intentMatchScore: number
  contextMatchScore: number
  ratingScore: number
  openingScore: number
  diversityScore: number
  localImpactScore: number
}

export interface RecommendationItem {
  id: string
  source: Source
  type: string
  name: string
  description?: string
  address?: string
  latitude?: number
  longitude?: number
  distanceKm?: number
  estimatedTravelMinutes?: number
  imageUrl?: string
  category?: string
  tags: string[]
  noteGlobale?: number      // business only
  nombreAvis?: number       // business only
  isOpen?: boolean
  scoreTotal: number
  scoreBreakdown?: ScoreBreakdown
  reason: string
  callToAction?: string
}

export interface PlanStep {
  order?: number
  startTime: string
  endTime: string
  type: string
  title: string
  description?: string
  address?: string
  latitude?: number
  longitude?: number
  durationMinutes: number
  reason?: string
  imageUrl?: string
  source?: Source | 'match'
  travelMinutes?: number
}

export interface SafetyInfo {
  kickoff?: string | null
  recommendedArrival?: string | null
  latestDepartureToStadium?: string | null
  warningMessage?: string | null
}

export interface DayPlan {
  title: string
  summary: string
  mode: Mode
  matchId?: string
  steps: PlanStep[]
  safety?: SafetyInfo
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  needsClarification?: boolean
  clarificationQuestion?: string
  quickReplies?: string[]
  hasResults?: boolean
}

export interface ConversationMemory {
  budget?: Budget
  time_available_minutes?: number
  ambiance?: string
  group_type?: 'family' | 'couple' | 'friends' | 'solo'
  requested_place_type?: string
  nightlife_explicit?: boolean
  has_ticket?: boolean
  preferences?: string[]
  last_intent?: string
  city?: string
}
