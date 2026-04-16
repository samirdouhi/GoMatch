import { authFetch } from "@/lib/authApi";

const GATEWAY_BASE_URL =
  (process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:5266").replace(/\/$/, "");

function buildGatewayUrl(path: string): string {
  if (!path.startsWith("/")) return `${GATEWAY_BASE_URL}/${path}`;
  return `${GATEWAY_BASE_URL}${path}`;
}

export type PhotoCommerce = {
  id: string;
  commerceId: string;
  nomFichier: string;
  typeContenu: string;
  tailleFichier: number;
  ordre: number;
  dateAjout: string;
  urlImage: string;
};

export type HoraireCommerce = {
  id: string;
  commerceId: string;
  jourSemaine: number;
  heureOuverture: string;
  heureFermeture: string;
  estFerme: boolean;
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
  statut: string;
  raisonRejet?: string | null;
  dateCreation: string;
  categorieId: string;
  nomCategorie?: string | null;
  tagsCulturels: string[];
  horaires: HoraireCommerce[];
  photos: PhotoCommerce[];
};

export type CreerCommerceDto = {
  nom: string;
  description: string;
  adresse: string;
  latitude: number;
  longitude: number;
  categorieId: string;
};

export type ModifierCommerceDto = {
  nom: string;
  description: string;
  adresse: string;
  latitude: number;
  longitude: number;
  categorieId: string;
};

export type CreerHoraireDto = {
  jourSemaine: number;
  heureOuverture: string;
  heureFermeture: string;
  estFerme: boolean;
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

async function parseJsonSafe(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text().catch(() => "");
    return text ? { message: text } : null;
  }
  return res.json().catch(() => null);
}

/**
 * IMPORTANT:
 * - Les appels publics utilisent fetch() avec l'URL complète de la gateway
 *   pour éviter d'appeler localhost:3000 par erreur.
 * - Les appels authentifiés gardent authFetch(), en supposant qu'il ajoute déjà
 *   le token correctement. Si authFetch ne préfixe pas la gateway, il faudra
 *   l’aligner aussi.
 */

// ── Public ────────────────────────────────────────────────────────────────────

export async function getAllCommerces(): Promise<Commerce[]> {
  const url = buildGatewayUrl("/business/api/commerces");
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("getAllCommerces failed", {
      url,
      status: res.status,
      data,
    });
    throw new Error(extractMessage(data, "Erreur récupération commerces"));
  }

  return data as Commerce[];
}

export async function getCommerceById(id: string): Promise<Commerce | null> {
  const url = buildGatewayUrl(`/business/api/commerces/${id}`);
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (res.status === 404) return null;

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("getCommerceById failed", {
      url,
      status: res.status,
      data,
    });
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

  const url = buildGatewayUrl(`/business/api/commerces/proches?${params.toString()}`);
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("getCommercesProches failed", {
      url,
      status: res.status,
      data,
    });
    throw new Error(extractMessage(data, "Erreur commerces proches"));
  }

  return data as Commerce[];
}

// ── Commerçant ────────────────────────────────────────────────────────────────

export async function getMyCommerce(): Promise<Commerce | null> {
  const res = await authFetch("/business/api/commerces/me");

  if (res.status === 404) return null;

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("getMyCommerce failed", {
      status: res.status,
      data,
    });
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

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("createCommerce failed", {
      status: res.status,
      data,
      dto,
    });
    throw new Error(extractMessage(data, "Erreur création commerce"));
  }

  return data as Commerce;
}

export async function updateCommerce(id: string, dto: ModifierCommerceDto): Promise<Commerce> {
  const res = await authFetch(`/business/api/commerces/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("updateCommerce failed", {
      commerceId: id,
      status: res.status,
      data,
      dto,
    });
    throw new Error(extractMessage(data, "Erreur modification commerce"));
  }

  return data as Commerce;
}

export async function addTagsToCommerce(commerceId: string, tagIds: string[]): Promise<Commerce> {
  const res = await authFetch(`/business/api/commerces/${commerceId}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tagIds),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("addTagsToCommerce failed", {
      commerceId,
      status: res.status,
      data,
      tagIds,
    });
    throw new Error(extractMessage(data, "Erreur ajout des tags"));
  }

  return data as Commerce;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getAllCommercesAdmin(): Promise<Commerce[]> {
  const res = await authFetch("/business/api/commerces/admin/all");
  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("getAllCommercesAdmin failed", {
      status: res.status,
      data,
    });
    throw new Error(extractMessage(data, "Erreur commerces admin"));
  }

  return data as Commerce[];
}

export async function getPendingCommerces(): Promise<Commerce[]> {
  const res = await authFetch("/business/api/commerces/admin/en-attente");
  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("getPendingCommerces failed", {
      status: res.status,
      data,
    });
    throw new Error(extractMessage(data, "Erreur commerces en attente"));
  }

  return data as Commerce[];
}

export async function validateCommerce(id: string): Promise<Commerce> {
  const res = await authFetch(`/business/api/commerces/${id}/valider`, {
    method: "PATCH",
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("validateCommerce failed", {
      commerceId: id,
      status: res.status,
      data,
    });
    throw new Error(extractMessage(data, "Erreur validation commerce"));
  }

  return data as Commerce;
}

export async function rejectCommerce(id: string, raison: string): Promise<Commerce> {
  const res = await authFetch(`/business/api/commerces/${id}/rejeter`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raison }),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("rejectCommerce failed", {
      commerceId: id,
      status: res.status,
      data,
      raison,
    });
    throw new Error(extractMessage(data, "Erreur rejet commerce"));
  }

  return data as Commerce;
}

// ── Photos ────────────────────────────────────────────────────────────────────

export function photoUrl(urlImage: string): string {
  if (!urlImage) return "";

  if (urlImage.startsWith("http://") || urlImage.startsWith("https://")) {
    return urlImage;
  }

  return buildGatewayUrl(`/business${urlImage}`);
}

export async function getPhotos(commerceId: string): Promise<PhotoCommerce[]> {
  const url = buildGatewayUrl(`/business/api/commerces/${commerceId}/photos`);
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("getPhotos failed", {
      url,
      commerceId,
      status: res.status,
      data,
    });
    throw new Error(extractMessage(data, "Erreur récupération photos"));
  }

  return data as PhotoCommerce[];
}

export async function uploadPhoto(commerceId: string, file: File): Promise<PhotoCommerce> {
  const form = new FormData();
  form.append("fichier", file);

  const res = await authFetch(`/business/api/commerces/${commerceId}/photos`, {
    method: "POST",
    body: form,
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("uploadPhoto failed", {
      commerceId,
      status: res.status,
      data,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    throw new Error(extractMessage(data, "Erreur upload photo"));
  }

  return data as PhotoCommerce;
}

export async function deletePhoto(commerceId: string, photoId: string): Promise<void> {
  const res = await authFetch(`/business/api/commerces/${commerceId}/photos/${photoId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await parseJsonSafe(res);
    console.error("deletePhoto failed", {
      commerceId,
      photoId,
      status: res.status,
      data,
    });
    throw new Error(extractMessage(data, "Erreur suppression photo"));
  }
}

// ── Horaires ──────────────────────────────────────────────────────────────────

export async function getHoraires(commerceId: string): Promise<HoraireCommerce[]> {
  const url = buildGatewayUrl(`/business/api/commerces/${commerceId}/horaires`);
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("getHoraires failed", {
      url,
      commerceId,
      status: res.status,
      data,
    });
    throw new Error(extractMessage(data, "Erreur récupération horaires"));
  }

  return data as HoraireCommerce[];
}

export async function createHoraire(
  commerceId: string,
  dto: CreerHoraireDto
): Promise<HoraireCommerce> {
  const res = await authFetch(`/business/api/commerces/${commerceId}/horaires`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("createHoraire failed", {
      commerceId,
      status: res.status,
      data,
      dto,
    });
    throw new Error(extractMessage(data, "Erreur création horaire"));
  }

  return data as HoraireCommerce;
}

export async function updateHoraire(
  commerceId: string,
  horaireId: string,
  dto: CreerHoraireDto
): Promise<HoraireCommerce> {
  const res = await authFetch(`/business/api/commerces/${commerceId}/horaires/${horaireId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    console.error("updateHoraire failed", {
      commerceId,
      horaireId,
      status: res.status,
      data,
      dto,
    });
    throw new Error(extractMessage(data, "Erreur modification horaire"));
  }

  return data as HoraireCommerce;
}

export async function deleteHoraire(commerceId: string, horaireId: string): Promise<void> {
  const res = await authFetch(`/business/api/commerces/${commerceId}/horaires/${horaireId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await parseJsonSafe(res);
    console.error("deleteHoraire failed", {
      commerceId,
      horaireId,
      status: res.status,
      data,
    });
    throw new Error(extractMessage(data, "Erreur suppression horaire"));
  }
}