import { authFetch } from "./authApi";

const GATEWAY = (
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ||
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  "http://localhost:5006"
).replace(/\/$/, "");

function url(path: string) {
  return `${GATEWAY}/culture${path.startsWith("/") ? path : `/${path}`}`;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(url(path), { cache: "no-store" });
  if (!res.ok) throw new Error(`Erreur culture API [${res.status}]`);
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MediaCulture = {
  id: string;
  url: string;
  type: "Image" | "Video" | "Lien";
  legende: string | null;
  ordre: number;
  dateAjout: string;
};

export type TraductionCulture = {
  id: string;
  langue: string;
  titre: string;
  corps: string;
  resume: string | null;
  dateCreation: string;
  dateMiseAJour: string | null;
};

export type ContenuCulturel = {
  id: string;
  titre: string;
  corps: string;
  resume: string | null;
  lieu: string | null;
  latitude: number | null;
  longitude: number | null;
  statut: string;
  langueOriginale: string;
  auteurId: string;
  dateCreation: string;
  datePublication: string | null;
  dateMiseAJour: string | null;
  categorieId: string;
  nomCategorie: string | null;
  tags: string[];
  medias: MediaCulture[];
  traductions: TraductionCulture[];
};

export type CategorieCulturelle = {
  id: string;
  nom: string;
  description: string | null;
  icone: string | null;
  dateCreation: string;
};

export type TagCulturel = {
  id: string;
  nom: string;
  dateCreation: string;
};

// ── API functions ─────────────────────────────────────────────────────────────

export function getAllContenus(): Promise<ContenuCulturel[]> {
  return get<ContenuCulturel[]>("/api/contenuCulturel");
}

export function getContenu(id: string): Promise<ContenuCulturel> {
  return get<ContenuCulturel>(`/api/contenuCulturel/${id}`);
}

export function getCategories(): Promise<CategorieCulturelle[]> {
  return get<CategorieCulturelle[]>("/api/categoriesCulturelles");
}

export function getTags(): Promise<TagCulturel[]> {
  return get<TagCulturel[]>("/api/tagsCulturels");
}

export function rechercherContenus(params: {
  titre?: string;
  categorieId?: string;
  tag?: string;
  langue?: string;
}): Promise<ContenuCulturel[]> {
  const q = new URLSearchParams();
  if (params.titre)      q.set("titre",      params.titre);
  if (params.categorieId) q.set("categorieId", params.categorieId);
  if (params.tag)        q.set("tag",        params.tag);
  if (params.langue)     q.set("langue",     params.langue);
  return get<ContenuCulturel[]>(`/api/contenuCulturel/recherche?${q.toString()}`);
}

// ── Admin DTOs ─────────────────────────────────────────────────────────────────

export type CreerContenuDto = {
  titre: string;
  corps: string;
  resume?: string;
  lieu?: string;
  latitude?: number;
  longitude?: number;
  langueOriginale: string;
  categorieId: string;
  tagIds: string[];
};

export type ModifierContenuDto = {
  titre: string;
  corps: string;
  resume?: string;
  lieu?: string;
  latitude?: number;
  longitude?: number;
  categorieId: string;
  tagIds: string[];
};

export type AjouterMediaDto = {
  url: string;
  type: "Image" | "Video" | "Lien";
  legende?: string;
  ordre: number;
};

export type CreerCategorieCultureDto = {
  nom: string;
  description?: string;
  icone?: string;
};

export type ModifierCategorieCultureDto = {
  nom: string;
  description?: string;
  icone?: string;
};

export type CreerTagCultureDto = { nom: string };
export type ModifierTagCultureDto = { nom: string };

// ── Admin helper ───────────────────────────────────────────────────────────────

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(`/culture${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = `Erreur ${res.status}`;
    try { msg = (JSON.parse(text) as { message?: string }).message ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Admin — Contenus ───────────────────────────────────────────────────────────

export function getAllContenusAdmin(): Promise<ContenuCulturel[]> {
  return adminFetch<ContenuCulturel[]>("/api/contenuCulturel/admin/all");
}

export function createContenu(dto: CreerContenuDto): Promise<ContenuCulturel> {
  return adminFetch<ContenuCulturel>("/api/contenuCulturel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export function updateContenu(id: string, dto: ModifierContenuDto): Promise<ContenuCulturel> {
  return adminFetch<ContenuCulturel>(`/api/contenuCulturel/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export function deleteContenu(id: string): Promise<void> {
  return adminFetch<void>(`/api/contenuCulturel/${id}`, { method: "DELETE" });
}

export function publierContenu(id: string): Promise<ContenuCulturel> {
  return adminFetch<ContenuCulturel>(`/api/contenuCulturel/${id}/publier`, { method: "PATCH" });
}

export function depublierContenu(id: string): Promise<ContenuCulturel> {
  return adminFetch<ContenuCulturel>(`/api/contenuCulturel/${id}/depublier`, { method: "PATCH" });
}

export function ajouterMedia(id: string, dto: AjouterMediaDto): Promise<MediaCulture> {
  return adminFetch<MediaCulture>(`/api/contenuCulturel/${id}/medias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export function supprimerMedia(id: string, mediaId: string): Promise<void> {
  return adminFetch<void>(`/api/contenuCulturel/${id}/medias/${mediaId}`, { method: "DELETE" });
}

// ── Admin — Catégories ─────────────────────────────────────────────────────────

export function createCategorieCulture(dto: CreerCategorieCultureDto): Promise<CategorieCulturelle> {
  return adminFetch<CategorieCulturelle>("/api/categoriesCulturelles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export function updateCategorieCulture(id: string, dto: ModifierCategorieCultureDto): Promise<CategorieCulturelle> {
  return adminFetch<CategorieCulturelle>(`/api/categoriesCulturelles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export function deleteCategorieCulture(id: string): Promise<void> {
  return adminFetch<void>(`/api/categoriesCulturelles/${id}`, { method: "DELETE" });
}

// ── Admin — Tags ───────────────────────────────────────────────────────────────

export function createTagCulture(dto: CreerTagCultureDto): Promise<TagCulturel> {
  return adminFetch<TagCulturel>("/api/tagsCulturels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export function updateTagCulture(id: string, dto: ModifierTagCultureDto): Promise<TagCulturel> {
  return adminFetch<TagCulturel>(`/api/tagsCulturels/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export function deleteTagCulture(id: string): Promise<void> {
  return adminFetch<void>(`/api/tagsCulturels/${id}`, { method: "DELETE" });
}
