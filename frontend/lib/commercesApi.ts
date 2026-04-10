import { authFetch } from "@/lib/authApi";

export type Commerce = {
  id: string;
  nom: string;
  description: string;
  adresse: string;
  latitude: number;
  longitude: number;
  proprietaireUtilisateurId: string;
  estValide: boolean;
  dateCreation: string;
  categorieId: string;
  nomCategorie?: string | null;
  tagsCulturels: string[];
  horaires: HoraireCommerce[];
};

export type HoraireCommerce = {
  id: string;
  commerceId: string;
  jourSemaine: number;
  heureOuverture: string;
  heureFermeture: string;
  estFerme: boolean;
};

export type CreerCommerceDto = {
  nom: string;
  description: string;
  adresse: string;
  latitude: number;
  longitude: number;
  categorieId: string;
};

type ApiMessage = {
  message?: string;
  erreur?: string;
  error?: string;
  title?: string;
};

function extractMessage(data: unknown, fallback: string): string {
  if (typeof data !== "object" || data === null) return fallback;

  const d = data as ApiMessage;
  return d.message || d.erreur || d.error || d.title || fallback;
}

export async function getMyCommerce(): Promise<Commerce | null> {
  const res = await authFetch("/business/api/commerces/me");

  if (res.status === 404) {
    return null;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur récupération commerce"));
  }

  return data as Commerce;
}

export async function createCommerce(dto: CreerCommerceDto) {
  const res = await authFetch("/business/api/commerces", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur création commerce"));
  }

  return data;
}

export async function addTagsToCommerce(commerceId: string, tagIds: string[]) {
  const res = await authFetch(`/business/api/commerces/${commerceId}/tags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tagIds),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur ajout des tags"));
  }

  return data;
}