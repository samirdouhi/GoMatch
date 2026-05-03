import { authFetch } from "@/lib/authApi";

export type AdminUserItem = {
  userId: string;
  prenom: string | null;
  nom: string | null;
  isActive: boolean;
  createdAt: string;
  profileType: string;
};

export type AdminBroadcast = {
  id: string;
  title: string;
  message: string;
  targetRole: string;
  sentAt: string;
  sentByUserId: string;
};

type ApiObj = Record<string, unknown>;

function str(o: ApiObj, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string") return v;
  }
  return "";
}
function nullStr(o: ApiObj, keys: string[]): string | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string") return v;
  }
  return null;
}
function bool(o: ApiObj, keys: string[]): boolean {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "boolean") return v;
  }
  return true;
}

async function readErr(res: Response, fallback: string): Promise<string> {
  try {
    const d = (await res.json()) as ApiObj;
    return str(d, ["message", "Message", "title"]) || fallback;
  } catch {
    return fallback;
  }
}

function mapUser(raw: ApiObj): AdminUserItem {
  return {
    userId:      str(raw,  ["userId",      "UserId"]),
    prenom:      nullStr(raw, ["prenom",   "Prenom"]),
    nom:         nullStr(raw, ["nom",       "Nom"]),
    isActive:    bool(raw, ["isActive",    "IsActive"]),
    createdAt:   str(raw,  ["createdAt",   "CreatedAt"]),
    profileType: str(raw,  ["profileType", "ProfileType"]),
  };
}

function mapBroadcast(raw: ApiObj): AdminBroadcast {
  return {
    id:          str(raw, ["id",          "Id"]),
    title:       str(raw, ["title",       "Title"]),
    message:     str(raw, ["message",     "Message"]),
    targetRole:  str(raw, ["targetRole",  "TargetRole"]),
    sentAt:      str(raw, ["sentAt",      "SentAt"]),
    sentByUserId:str(raw, ["sentByUserId","SentByUserId"]),
  };
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUsersAdmin(): Promise<AdminUserItem[]> {
  const res = await authFetch("/admin-profile/users", { cache: "no-store" });
  if (!res.ok) throw new Error(await readErr(res, "Erreur récupération utilisateurs"));
  const data = (await res.json()) as unknown[];
  return Array.isArray(data) ? data.map((u) => mapUser(u as ApiObj)) : [];
}

export async function toggleUserActive(userId: string): Promise<void> {
  const res = await authFetch(`/admin-profile/users/${userId}/toggle-active`, { method: "PATCH" });
  if (!res.ok) throw new Error(await readErr(res, "Erreur toggle activation"));
}

// ── Broadcasts ────────────────────────────────────────────────────────────────

export async function getBroadcastsAdmin(): Promise<AdminBroadcast[]> {
  const res = await authFetch("/notifications/api/notifications/admin/broadcasts", { cache: "no-store" });
  if (!res.ok) throw new Error(await readErr(res, "Erreur récupération broadcasts"));
  const data = (await res.json()) as unknown[];
  return Array.isArray(data) ? data.map((b) => mapBroadcast(b as ApiObj)) : [];
}

export async function sendBroadcast(
  title: string,
  message: string,
  targetRole: string
): Promise<void> {
  const res = await authFetch("/notifications/api/notifications/admin/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, message, targetRole }),
  });
  if (!res.ok) throw new Error(await readErr(res, "Erreur envoi notification"));
}
