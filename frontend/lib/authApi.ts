import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
} from "./authTokens";
import { buildUrl } from "./utils";

export type TokenResponse = {
  accessToken: string;
  expiresAtUtc: string;
  refreshToken: string;
};

export type GoogleLoginRequestDto = {
  idToken: string;
};

export type GoogleLoginResponse = {
  requiresRegistration: boolean;
  email?: string | null;
  prenom?: string | null;
  nom?: string | null;
  login?: TokenResponse | null;
};

export type LoginRequestDto = {
  email: string;
  password: string;
};

type ApiMessageResponse = {
  message?: string;
  erreur?: string;
  error?: string;
  title?: string;
};

let refreshPromise: Promise<boolean> | null = null;

function getApiErrorMessage(data: unknown, fallback: string): string {
  if (typeof data !== "object" || data === null) {
    return fallback;
  }

  const d = data as ApiMessageResponse;

  return d.message || d.erreur || d.error || d.title || fallback;
}

async function refreshSession(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  const res = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
  });

  if (!res.ok) return false;

  const data = (await res.json().catch(() => null)) as TokenResponse | null;

  if (!data?.accessToken || !data?.expiresAtUtc) {
    return false;
  }

  setAuthTokens(data.accessToken, data.expiresAtUtc, data.refreshToken);
  return true;
}

async function ensureRefreshed(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function mergeHeaders(
  initHeaders: RequestInit["headers"],
  token?: string | null
): Headers {
  const headers = new Headers(initHeaders ?? undefined);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

export async function authFetch(path: string, init: RequestInit = {}) {
  const url = buildUrl(path);
  const token = getAccessToken();

  const first = await fetch(url, {
    ...init,
    headers: mergeHeaders(init.headers, token),
  });

  if (first.status !== 401) {
    return first;
  }

  const refreshed = await ensureRefreshed();

  if (!refreshed) {
    clearAuthTokens();
    return first;
  }

  const newToken = getAccessToken();

  return fetch(url, {
    ...init,
    headers: mergeHeaders(init.headers, newToken),
  });
}

export async function loginRequest(
  dto: LoginRequestDto
): Promise<TokenResponse> {
  const res = await fetch(buildUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  const data = (await res.json().catch(() => null)) as
    | (TokenResponse & ApiMessageResponse)
    | null;

  if (!res.ok) {
    throw new Error(getApiErrorMessage(data, "Connexion échouée."));
  }

  if (!data?.accessToken || !data?.expiresAtUtc || !data?.refreshToken) {
    throw new Error("Réponse invalide du serveur.");
  }

  return {
    accessToken: data.accessToken,
    expiresAtUtc: data.expiresAtUtc,
    refreshToken: data.refreshToken,
  };
}

export async function googleLogin(
  dto: GoogleLoginRequestDto
): Promise<GoogleLoginResponse> {
  const res = await fetch(buildUrl("/auth/google"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  const data = (await res.json().catch(() => null)) as
    | (GoogleLoginResponse & ApiMessageResponse)
    | null;

  if (!res.ok) {
    throw new Error(getApiErrorMessage(data, "Connexion Google échouée."));
  }

  if (!data || typeof data.requiresRegistration !== "boolean") {
    throw new Error("Réponse invalide du serveur.");
  }

  return data;
}

export async function confirmEmailRequest(token: string) {
  try {
    const res = await fetch(
      buildUrl(`/email/confirm?token=${encodeURIComponent(token)}`),
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const data = (await res.json().catch(() => null)) as ApiMessageResponse | null;

    if (!res.ok) {
      throw new Error(
        getApiErrorMessage(data, "Impossible de confirmer votre adresse email.")
      );
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Failed to fetch") {
        throw new Error("Impossible de contacter le serveur (Gateway).");
      }

      throw error;
    }

    throw new Error("Erreur réseau pendant la confirmation de l’email.");
  }
}

export async function resendConfirmationEmailRequest(email: string) {
  const res = await fetch(buildUrl("/email/resend-confirmation"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = (await res.json().catch(() => null)) as ApiMessageResponse | null;

  if (!res.ok) {
    throw new Error(
      getApiErrorMessage(data, "Impossible de renvoyer l’email de confirmation.")
    );
  }

  return data;
}

type ConfirmProfessionalEmailResponse = {
  message?: string;
  error?: string;
  title?: string;
};

export async function confirmProfessionalEmailRequest(token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_GATEWAY_BASE_URL}/commercant-profile/confirm-professional-email?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  let data: ConfirmProfessionalEmailResponse | null = null;

  try {
    data = (await res.json()) as ConfirmProfessionalEmailResponse;
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        data?.title ||
        "Erreur lors de la confirmation de l’email professionnel."
    );
  }

  return data;
}

export async function logoutRequest() {
  const rt = getRefreshToken();
  const at = getAccessToken();

  if (rt) {
    await fetch(buildUrl("/auth/logout"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(at ? { Authorization: `Bearer ${at}` } : {}),
      },
      body: JSON.stringify({ refreshToken: rt }),
    }).catch(() => {});
  }

  clearAuthTokens();
}