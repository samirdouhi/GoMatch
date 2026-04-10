import { authFetch } from "../authApi";
import { getAccessToken } from "../authTokens";
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
    const res = await authFetch("/profile/me", {
      method: "GET",
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      return "/signin";
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
    return "/signin";
  }
}