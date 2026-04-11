"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
} from "@/lib/authTokens";
import { buildUrl } from "@/lib/utils";

type DecodedJwt = {
  roles?: string[] | string;
  role?: string[] | string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?:
    | string[]
    | string;
  exp?: number;
};

type TokenResponse = {
  accessToken: string;
  expiresAtUtc: string;
  refreshToken: string;
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

function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<DecodedJwt>(token);
    if (!decoded.exp) return false;
    return decoded.exp <= Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

async function tryRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as TokenResponse | null;
    if (!data?.accessToken || !data?.expiresAtUtc) return null;

    setAuthTokens(data.accessToken, data.expiresAtUtc, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

/**
 * Composant silencieux (rendu invisible).
 * Au chargement de la page d'accueil, lit le localStorage :
 *  - token valide + rôle Admin   → redirige vers /admin
 *  - token expiré + refresh dispo → rafraîchit puis redirige si Admin
 *  - aucun token valide           → ne fait rien, la page reste visible
 */
export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function redirect() {
      let token = getAccessToken();

      if (!token) return;

      if (isTokenExpired(token)) {
        const refreshed = await tryRefresh();
        if (!refreshed) {
          clearAuthTokens();
          return;
        }
        token = refreshed;
      }

      if (cancelled) return;

      const roles = getRolesFromToken(token);
      if (roles.includes("Admin")) {
        router.replace("/admin");
      }
    }

    void redirect();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
