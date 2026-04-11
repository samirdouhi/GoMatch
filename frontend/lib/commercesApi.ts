import { authFetch } from "@/lib/authApi";

export type Commerce = {
  id: string;
  nom: string;
  description: string;
  adresse: string;
  latitude: number;
  longitude: number;
  proprietaireUtilisateurId: string;
  proprietaireEmail?: string | null;
  estValide: boolean;
  /** EnAttente | Approuve | Rejete */
  statut: string;
  raisonRejet?: string | null;
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

// ── Public ────────────────────────────────────────────────────────────────────

export async function getAllCommerces(): Promise<Commerce[]> {
  const res = await fetch("/business/api/commerces", {
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur récupération commerces"));
  }

  return data as Commerce[];
}

export async function getCommerceById(id: string): Promise<Commerce | null> {
  const res = await fetch(`/business/api/commerces/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur récupération commerce"));
  }

  return data as Commerce;
}

export async function getCommercesProches(
  latitude: number,
  longitude: number,
  rayonKm: number
): Promise<Commerce[]> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    rayonKm: String(rayonKm),
  });

  const res = await fetch(`/business/api/commerces/proches?${params}`, {
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur commerces proches"));
  }

  return data as Commerce[];
}

// ── Commerçant ────────────────────────────────────────────────────────────────

export async function getMyCommerce(): Promise<Commerce | null> {
  const res = await authFetch("/business/api/commerces/me", {
    cache: "no-store",
  });

  if (res.status === 404) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur récupération commerce"));
  }

  return data as Commerce;
}

export async function createCommerce(dto: CreerCommerceDto): Promise<Commerce> {
  const res = await authFetch("/business/api/commerces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur création commerce"));
  }

  return data as Commerce;
}

export async function updateCommerce(
  id: string,
  dto: CreerCommerceDto
): Promise<Commerce> {
  const res = await authFetch(`/business/api/commerces/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur modification commerce"));
  }

  return data as Commerce;
}

export async function addTagsToCommerce(
  commerceId: string,
  tagIds: string[]
): Promise<Commerce> {
  const res = await authFetch(`/business/api/commerces/${commerceId}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tagIds),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur ajout des tags"));
  }

  return data as Commerce;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getAllCommercesAdmin(): Promise<Commerce[]> {
  const res = await authFetch("/business/api/commerces/admin/all", {
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur commerces admin"));
  }

  return data as Commerce[];
}

export async function getPendingCommerces(): Promise<Commerce[]> {
  const res = await authFetch("/business/api/commerces/admin/en-attente", {
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur commerces en attente"));
  }

  return data as Commerce[];
}

export async function validateCommerce(id: string): Promise<Commerce> {
  const res = await authFetch(`/business/api/commerces/${id}/valider`, {
    method: "PATCH",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur validation commerce"));
  }

  return data as Commerce;
}

export async function rejectCommerce(
  id: string,
  raison: string
): Promise<Commerce> {
  const res = await authFetch(`/business/api/commerces/${id}/rejeter`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raison }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractMessage(data, "Erreur rejet commerce"));
  }

  return data as Commerce;
}