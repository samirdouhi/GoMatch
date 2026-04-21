// src/lib/recoApi.ts

export type ConversationMemory = {
  budget?: "low" | "medium" | "high" | null;
  time_available_minutes?: number | null;
  ambiance?: string | null;
  group_type?: string | null;
  requested_place_type?: string | null;
  nightlife_explicit?: boolean;
  clarification_needed?: boolean;
  clarification_question?: string | null;
};

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
};

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
};

export type ConversationResponse = {
  intent: string;
  message: string;
  cards: RecommendationCard[];
  followups: string[];
  alternatives: RecommendationCard[];
  needs_clarification?: boolean;
  clarification_question?: string | null;
  memory_updates?: ConversationMemory;
};

export async function sendConversationMessage(
  payload: ConversationRequest
): Promise<ConversationResponse> {
  const res = await fetch("http://localhost:5266/reco/conversation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "RecoService error");
  }

  return res.json();
}