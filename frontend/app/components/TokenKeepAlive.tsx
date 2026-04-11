"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
  getExpiresAtUtc,
} from "@/lib/authTokens";
import { buildUrl } from "@/lib/utils";

const CHECK_INTERVAL_MS  = 60_000;  // toutes les 60 secondes
const REFRESH_BEFORE_SEC = 120;     // rafraîchit si < 2 min restantes

type TokenResponse = {
  accessToken: string;
  expiresAtUtc: string;
  refreshToken: string;
};

function secondsUntilExpiry(): number {
  const expiresAt = getExpiresAtUtc();
  if (!expiresAt) return 0;
  const exp = new Date(expiresAt).getTime();
  return Math.floor((exp - Date.now()) / 1000);
}

async function silentRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  try {
    const res = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });

    if (!res.ok) return false;

    const data = (await res.json().catch(() => null)) as TokenResponse | null;
    if (!data?.accessToken || !data?.expiresAtUtc) return false;

    setAuthTokens(data.accessToken, data.expiresAtUtc, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export default function TokenKeepAlive() {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const token = getAccessToken();

      // Pas de token → pas connecté, rien à faire
      if (!token) return;

      const secs = secondsUntilExpiry();

      // Encore plus de 2 min → pas besoin de rafraîchir
      if (secs > REFRESH_BEFORE_SEC) return;

      // Token expiré ou bientôt expiré → refresh silencieux
      const ok = await silentRefresh();

      if (!ok) {
        // Refresh échoué (token révoqué ou expiré) → déconnecter
        clearAuthTokens();
        router.replace("/signin");
      }
    }

    // Vérification immédiate au montage
    void check();

    const id = setInterval(() => { void check(); }, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
