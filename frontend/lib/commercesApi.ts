import { authFetch } from "@/lib/authApi";

export type PhotoCommerce = {
  id: string;
  commerceId: string;
  nomFichier: string;
  typeContenu: string;
  tailleFichier: number;
  ordre: number;
  dateAjout: string;
  /** URL relative : à préfixer de /business pour passer par le gateway */
  urlImage: string;
};

export type Commerce = {
  id: string;
  nom: string;
  description: string;
  adresse: string;
  latitude: number;
  longitude: number;
  proprietaireUtilisateurId: string;
  proprietaireEmail: string;
  estValide: boolean;
  /** EnAttente | Approuve | Rejete */
  statut: string;
  raisonRejet?: string | null;
  dateCreation: string;
  categorieId: string;
  nomCategorie?: string | null;
  tagsCulturels: string[];
  horaires: HoraireCommerce[];
  photos: PhotoCommerce[];
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
  const res  = await fetch("/business/api/commerces");
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur récupération commerces"));
  return data as Commerce[];
}

export async function getCommerceById(id: string): Promise<Commerce | null> {
  const res = await fetch(`/business/api/commerces/${id}`);
  if (res.status === 404) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur récupération commerce"));
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
  const res  = await fetch(`/business/api/commerces/proches?${params}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur commerces proches"));
  return data as Commerce[];
}

// ── Commerçant ────────────────────────────────────────────────────────────────

export async function getMyCommerce(): Promise<Commerce | null> {
  const res = await authFetch("/business/api/commerces/me");
  if (res.status === 404) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur récupération commerce"));
  return data as Commerce;
}

export async function createCommerce(dto: CreerCommerceDto): Promise<Commerce> {
  const res = await authFetch("/business/api/commerces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur création commerce"));
  return data as Commerce;
}

export async function updateCommerce(id: string, dto: CreerCommerceDto): Promise<Commerce> {
  const res = await authFetch(`/business/api/commerces/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur modification commerce"));
  return data as Commerce;
}

export async function addTagsToCommerce(commerceId: string, tagIds: string[]): Promise<Commerce> {
  const res = await authFetch(`/business/api/commerces/${commerceId}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tagIds),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur ajout des tags"));
  return data as Commerce;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getAllCommercesAdmin(): Promise<Commerce[]> {
  const res  = await authFetch("/business/api/commerces/admin/all");
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur commerces admin"));
  return data as Commerce[];
}

export async function getPendingCommerces(): Promise<Commerce[]> {
  const res  = await authFetch("/business/api/commerces/admin/en-attente");
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur commerces en attente"));
  return data as Commerce[];
}

/** Valider — déclenche email d'approbation côté backend */
export async function validateCommerce(id: string): Promise<Commerce> {
  const res  = await authFetch(`/business/api/commerces/${id}/valider`, { method: "PATCH" });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur validation commerce"));
  return data as Commerce;
}

/** Rejeter — déclenche email de rejet côté backend */
export async function rejectCommerce(id: string, raison: string): Promise<Commerce> {
  const res = await authFetch(`/business/api/commerces/${id}/rejeter`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raison }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur rejet commerce"));
  return data as Commerce;
}

// ── Photos ─────────────────────────────────────────────────────────────────────

/** Retourne l'URL complète (via gateway) d'une photo. */
export function photoUrl(urlImage: string): string {
  return `/business${urlImage}`;
}

export async function getPhotos(commerceId: string): Promise<PhotoCommerce[]> {
  const res  = await fetch(`/business/api/commerces/${commerceId}/photos`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur récupération photos"));
  return data as PhotoCommerce[];
}

export async function uploadPhoto(commerceId: string, file: File): Promise<PhotoCommerce> {
  const form = new FormData();
  form.append("fichier", file);

  const res  = await authFetch(`/business/api/commerces/${commerceId}/photos`, {
    method: "POST",
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur upload photo"));
  return data as PhotoCommerce;
}

export async function deletePhoto(commerceId: string, photoId: string): Promise<void> {
  const res = await authFetch(`/business/api/commerces/${commerceId}/photos/${photoId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(extractMessage(data, "Erreur suppression photo"));
  }
}

// ── Horaires ───────────────────────────────────────────────────────────────────

export type CreerHoraireDto = {
  jourSemaine: number;
  heureOuverture: string; // "HH:mm:ss"
  heureFermeture: string;
  estFerme: boolean;
};

export async function getHoraires(commerceId: string): Promise<HoraireCommerce[]> {
  const res  = await fetch(`/business/api/commerces/${commerceId}/horaires`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur récupération horaires"));
  return data as HoraireCommerce[];
}

export async function createHoraire(
  commerceId: string,
  dto: CreerHoraireDto
): Promise<HoraireCommerce> {
  const res  = await authFetch(`/business/api/commerces/${commerceId}/horaires`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur création horaire"));
  return data as HoraireCommerce;
}

export async function updateHoraire(
  commerceId: string,
  horaireId: string,
  dto: CreerHoraireDto
): Promise<HoraireCommerce> {
  const res  = await authFetch(`/business/api/commerces/${commerceId}/horaires/${horaireId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractMessage(data, "Erreur modification horaire"));
  return data as HoraireCommerce;
}

export async function deleteHoraire(commerceId: string, horaireId: string): Promise<void> {
  const res = await authFetch(
    `/business/api/commerces/${commerceId}/horaires/${horaireId}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(extractMessage(data, "Erreur suppression horaire"));
  }
}
