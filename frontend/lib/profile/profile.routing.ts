import { getAccessToken } from "../authTokens";
import { buildUrl } from "../utils";
import { jwtDecode } from "jwt-decode";

type ProfileRouteResponse = {
  inscriptionTerminee?: boolean;
  InscriptionTerminee?: boolean;
  firstLoginOnboardingDone?: boolean;
  onboardingCompleted?: boolean;
};

type DecodedJwt = {
  roles?: string[] | string;
  role?: string[] | string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?:
    | string[]
    | string;
};

function normalizeRoles(value: string[] | string | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getRolesFromToken(token: string): string[] {
  try {
    const decoded = jwtDecode<DecodedJwt>(token);

    const roles = [
      ...normalizeRoles(decoded.roles),
      ...normalizeRoles(decoded.role),
      ...normalizeRoles(
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
      ),
    ];

    return [...new Set(roles.filter(Boolean))];
  } catch {
    return [];
  }
}

function isOnboardingDone(profile: ProfileRouteResponse | null): boolean {
  if (!profile) return false;

  return (
    profile.inscriptionTerminee ??
    profile.InscriptionTerminee ??
    profile.firstLoginOnboardingDone ??
    profile.onboardingCompleted ??
    false
  );
}

export async function getFirstRoute(): Promise<string> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return "/signin";
  }

  const roles = getRolesFromToken(accessToken);

  if (roles.includes("Admin")) {
    return "/admin";
  }

  try {
    // On utilise fetch directement (pas authFetch) pour éviter d'effacer les tokens
    // si le profile service retourne 401 temporairement après un login tout frais
    const url = buildUrl("/profile/me");
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      // Le token vient d'être émis — si le profile service le rejette c'est un problème
      // de configuration. On envoie vers onboarding plutôt que de bloquer sur signin.
      return "/onboarding";
    }

    if (res.status === 404) {
      return "/onboarding";
    }

    if (!res.ok) {
      return "/onboarding";
    }

    const profile = (await res.json()) as ProfileRouteResponse;

    return isOnboardingDone(profile) ? "/dashboard" : "/onboarding";
  } catch {
    // Erreur réseau (ex : CORS, gateway indisponible) : l'utilisateur vient de se connecter,
    // on ne le renvoie pas sur signin — il verra l'erreur depuis onboarding si besoin.
    return "/onboarding";
  }
}
