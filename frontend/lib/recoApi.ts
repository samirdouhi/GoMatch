// lib/recoApi.ts — GoMatch RecoService client (spec v3)

const RECO_BASE = `${process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:5006"}/reco`;

// ── Shared types ──────────────────────────────────────────────────────────────

export type ConversationMemory = {
  budget?: "low" | "medium" | "high" | null;
  time_available_minutes?: number | null;
  ambiance?: string | null;
  group_type?: string | null;
  requested_place_type?: string | null;
  nightlife_explicit?: boolean;
  clarification_needed?: boolean;
  clarification_question?: string | null;
  city?: string | null;
  last_intent?: string | null;
  has_ticket?: boolean | null;
  preferences?: string[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// ── Score breakdown (spec v3) ─────────────────────────────────────────────────

export type ScoreBreakdown = {
  distanceScore: number;
  intentMatchScore: number;
  contextMatchScore: number;
  ratingScore: number;
  openingScore: number;
  diversityScore: number;
  localImpactScore: number;
};

// ── Recommendation item (spec v3) ─────────────────────────────────────────────

export type RecommendationItemDto = {
  id: string;
  source: "business" | "discovery" | "event" | "culture";
  type: string;
  name: string;
  description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  estimatedTravelMinutes?: number | null;
  imageUrl?: string | null;
  category?: string | null;
  tags: string[];
  noteGlobale?: number | null;     // Only for source === "business"
  nombreAvis?: number | null;      // Only for source === "business"
  isOpen?: boolean | null;
  scoreTotal: number;              // 0-100 scale
  scoreBreakdown: ScoreBreakdown;
  reason: string;
  callToAction: string;
};

// ── Legacy card (spec v2 / backward compat) ───────────────────────────────────

export type RecommendationCard = {
  id: string;
  source: string;
  type: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_text?: string | null;
  price_level?: string | null;
  rating?: number | null;
  review_count?: number | null;
  tags: string[];
  reason?: string | null;
  actions: string[];
  photo_url?: string | null;
};

export type ProgramSlot = {
  slot_key: string;
  time_str: string;
  end_time_str?: string | null;
  duration_min: number;
  duration_label?: string | null;
  label: string;
  emoji: string;
  tip?: string | null;
  is_match: boolean;
  card?: RecommendationCard | null;
};

export type DayProgram = {
  match_team1?: string | null;
  match_team2?: string | null;
  match_kickoff?: string | null;
  match_date?: string | null;
  match_city?: string | null;
  match_stadium?: string | null;
  match_stadium_address?: string | null;
  slots: ProgramSlot[];
};

export type PlanStep = {
  startTime: string;
  endTime: string;
  type: string;
  title: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceFromUserKm?: number | null;
  distanceToStadiumKm?: number | null;
  estimatedDurationMinutes: number;
  reason?: string;
  photo_url?: string | null;
  address?: string | null;
  source?: string | null;
};

export type SafetyInfo = {
  kickoff?: string | null;
  recommendedArrival?: string | null;
  latestDepartureToStadium?: string | null;
  warningMessage?: string | null;
};

export type DayPlan = {
  date?: string | null;
  label: string;
  type: string;
  plan: PlanStep[];
  route: [number, number][];
  safety?: SafetyInfo | null;
  match_info?: Record<string, unknown> | null;
};

// ── Main response (spec v3 + legacy) ─────────────────────────────────────────

export type ConversationResponse = {
  // Spec v3
  intent: string;
  mode?: string;
  summary?: string;
  safety?: SafetyInfo | null;
  primaryRecommendations?: RecommendationItemDto[];
  alternativeRecommendations?: RecommendationItemDto[];
  plan?: PlanStep[];
  days?: DayPlan[];
  route?: [number, number][];
  followUpQuestion?: string | null;
  followUpQuestions?: string[];
  // Legacy
  recommendations?: RecommendationCard[];
  message: string;
  cards: RecommendationCard[];
  followups: string[];
  alternatives: RecommendationCard[];
  program?: DayProgram | null;
  needs_clarification?: boolean;
  clarification_question?: string | null;
  memory_updates?: ConversationMemory;
};

// ── Request types ─────────────────────────────────────────────────────────────

export type ConversationRequest = {
  message: string;
  access_token?: string;
  user_id?: string;
  latitude?: number | null;
  longitude?: number | null;
  language?: string;
  current_match_id?: string | null;
  excluded_ids?: string[];
  session_recommended_ids?: string[];
  conversation_memory?: ConversationMemory;
  conversation_history?: ChatMessage[];
};

export type RecoChatRequest = {
  message: string;
  userLatitude?: number | null;
  userLongitude?: number | null;
  userId?: string | null;
  selectedMatchId?: string | null;
  hasTicket?: boolean | null;
  availableMinutes?: number | null;
  budget?: "low" | "medium" | "high" | null;
  preferences?: string[];
  excludedIds?: string[];
  accessToken?: string;
  conversationHistory?: ChatMessage[];
  conversationMemory?: ConversationMemory;
  language?: string;
};

export type MatchContextRequest = {
  userLatitude?: number | null;
  userLongitude?: number | null;
  userId?: string | null;
  matchId?: string | null;
  hasTicket?: boolean | null;
  availableMinutes?: number | null;
  budget?: "low" | "medium" | "high" | null;
  preferences?: string[];
  excludedIds?: string[];
  accessToken?: string;
  language?: string;
};

export type DayPlanRequest = {
  userLatitude?: number | null;
  userLongitude?: number | null;
  userId?: string | null;
  city?: string;
  matchId?: string | null;
  hasTicket?: boolean | null;
  budget?: "low" | "medium" | "high" | null;
  preferences?: string[];
  groupType?: "family" | "couple" | "friends" | "solo" | null;
  excludedIds?: string[];
  accessToken?: string;
  language?: string;
};

// ── API helpers ───────────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${RECO_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `RecoService error on ${path}`);
  }
  return res.json() as Promise<T>;
}

// ── Public API functions ──────────────────────────────────────────────────────

/** Main chat endpoint (spec v3). */
export async function sendChat(
  payload: RecoChatRequest
): Promise<ConversationResponse> {
  return post<ConversationResponse>("/api/reco/chat", payload);
}

/** Direct recommendation without conversation context. */
export async function sendRecommend(
  payload: RecoChatRequest
): Promise<ConversationResponse> {
  return post<ConversationResponse>("/api/reco/recommend", payload);
}

/** Full day-plan generation. */
export async function requestDayPlan(
  payload: DayPlanRequest
): Promise<ConversationResponse> {
  return post<ConversationResponse>("/api/reco/day-plan", payload);
}

/** Pre-match recommendations. */
export async function requestBeforeMatch(
  payload: MatchContextRequest
): Promise<ConversationResponse> {
  return post<ConversationResponse>("/api/reco/before-match", payload);
}

/** Post-match recommendations. */
export async function requestAfterMatch(
  payload: MatchContextRequest
): Promise<ConversationResponse> {
  return post<ConversationResponse>("/api/reco/after-match", payload);
}

/** Legacy /conversation endpoint for backward compat. */
export async function sendConversationMessage(
  payload: ConversationRequest
): Promise<ConversationResponse> {
  const res = await fetch(`${RECO_BASE}/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: payload.message,
      context: {
        access_token: payload.access_token ?? "",
        user_id: payload.user_id ?? null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        language: payload.language ?? "fr",
      },
      current_match_id: payload.current_match_id ?? null,
      excluded_ids: payload.excluded_ids ?? [],
      session_recommended_ids: payload.session_recommended_ids ?? [],
      conversation_memory: payload.conversation_memory ?? {},
      conversation_history: payload.conversation_history ?? [],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "RecoService error");
  }

  return res.json();
}

// ── Util: extract all cards from a response ───────────────────────────────────

export function getDisplayCards(res: ConversationResponse): RecommendationCard[] {
  // Prefer legacy cards array (already deduplicated by backend)
  if (res.cards?.length) return res.cards;
  if (res.recommendations?.length) return res.recommendations;
  return [];
}

export function getPrimaryItems(res: ConversationResponse): RecommendationItemDto[] {
  return res.primaryRecommendations ?? [];
}

export function getAlternativeItems(res: ConversationResponse): RecommendationItemDto[] {
  return res.alternativeRecommendations ?? [];
}
