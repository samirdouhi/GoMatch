// src/lib/recoApi.ts
export type RecommendRequest = {
  latitude: number;
  longitude: number;
  available_minutes: number;
  budget?: number;
  access_token: string;
};

export async function getRecommendations(payload: RecommendRequest) {
  const res = await fetch("http://localhost:5266/reco/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "RecoService error");
  }

  return res.json();
}