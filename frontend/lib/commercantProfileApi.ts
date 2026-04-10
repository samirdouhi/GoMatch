import { authFetch } from "@/lib/authApi";

type ApiObject = Record<string, unknown>;

export type CommercantProfileDto = {
  status: string;
  rejectionReason: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  inscriptionTerminee: boolean;
};

function pickString(obj: ApiObject, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string") return value;
  }
  return "";
}

function pickNullableString(obj: ApiObject, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string") return value;
  }
  return null;
}

function pickBoolean(obj: ApiObject, keys: string[]): boolean {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "boolean") return value;
  }
  return false;
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiObject;
    return (
      pickString(data, ["message", "Message"]) ||
      pickString(data, ["error", "Error"]) ||
      pickString(data, ["title", "Title"]) ||
      `HTTP ${res.status}`
    );
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function getMyCommercantProfile(): Promise<CommercantProfileDto | null> {
  const res = await authFetch("/commercant-profile/me", {
    method: "GET",
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(await readError(res));
  }

  const data = (await res.json()) as ApiObject;

  return {
    status: pickString(data, ["status", "Status"]),
    rejectionReason: pickNullableString(data, ["rejectionReason", "RejectionReason"]),
    reviewedAt: pickNullableString(data, ["reviewedAt", "ReviewedAt"]),
    submittedAt: pickNullableString(data, ["submittedAt", "SubmittedAt"]),
    inscriptionTerminee: pickBoolean(data, ["inscriptionTerminee", "InscriptionTerminee"]),
  };
}