import { authFetch } from "@/lib/authApi";

type ApiObject = Record<string, unknown>;

export type CommercantProfileDto = {
  userProfile?: {
    userId?: string;
    prenom?: string | null;
    nom?: string | null;
    photoUrl?: string | null;
    isActive?: boolean;
  } | null;
  nomResponsable?: string | null;
  telephone?: string | null;
  emailProfessionnel?: string | null;
  ville?: string | null;
  adresseProfessionnelle?: string | null;
  typeActivite?: string | null;
  status?: string | null;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  submittedAt?: string | null;
  inscriptionTerminee?: boolean;
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

function pickObject(obj: ApiObject, keys: string[]): ApiObject | null {
  for (const key of keys) {
    const value = obj[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as ApiObject;
    }
  }
  return null;
}

async function readError(res: Response): Promise<string> {
  try {
    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = (await res.json()) as ApiObject;
      return (
        pickString(data, ["message", "Message"]) ||
        pickString(data, ["error", "Error"]) ||
        pickString(data, ["title", "Title"]) ||
        `HTTP ${res.status} (${res.statusText})`
      );
    }

    const text = await res.text();
    return text.trim() || `HTTP ${res.status} (${res.statusText})`;
  } catch {
    return `HTTP ${res.status} (${res.statusText})`;
  }
}

function normalizeProfile(data: ApiObject): CommercantProfileDto {
  const userProfileObj =
    pickObject(data, ["userProfile", "UserProfile"]) ??
    pickObject(data, ["data", "Data"]);

  let userProfile: CommercantProfileDto["userProfile"] = null;

  if (userProfileObj) {
    userProfile = {
      userId: pickString(userProfileObj, ["userId", "UserId"]),
      prenom: pickNullableString(userProfileObj, ["prenom", "Prenom"]),
      nom: pickNullableString(userProfileObj, ["nom", "Nom"]),
      photoUrl: pickNullableString(userProfileObj, ["photoUrl", "PhotoUrl"]),
      isActive: pickBoolean(userProfileObj, ["isActive", "IsActive"]),
    };
  }

  return {
    userProfile,
    nomResponsable: pickNullableString(data, ["nomResponsable", "NomResponsable"]),
    telephone: pickNullableString(data, ["telephone", "Telephone"]),
    emailProfessionnel: pickNullableString(data, ["emailProfessionnel", "EmailProfessionnel"]),
    ville: pickNullableString(data, ["ville", "Ville"]),
    adresseProfessionnelle: pickNullableString(data, ["adresseProfessionnelle", "AdresseProfessionnelle"]),
    typeActivite: pickNullableString(data, ["typeActivite", "TypeActivite"]),
    status: pickNullableString(data, ["status", "Status"]),
    rejectionReason: pickNullableString(data, ["rejectionReason", "RejectionReason"]),
    reviewedAt: pickNullableString(data, ["reviewedAt", "ReviewedAt"]),
    submittedAt: pickNullableString(data, ["submittedAt", "SubmittedAt"]),
    inscriptionTerminee: pickBoolean(data, ["inscriptionTerminee", "InscriptionTerminee"]),
  };
}

export async function getMyCommercantProfile(): Promise<CommercantProfileDto | null> {
  const candidateRoutes = [
    "/commercant-profile/me",
    "/api/commercant/profile/me",
  ];

  for (const route of candidateRoutes) {
    const res = await authFetch(route, {
      method: "GET",
      cache: "no-store",
    });

    if (res.status === 404) {
      continue;
    }

    if (!res.ok) {
      throw new Error(await readError(res));
    }

    const data = (await res.json()) as ApiObject;
    return normalizeProfile(data);
  }

  return null;
}