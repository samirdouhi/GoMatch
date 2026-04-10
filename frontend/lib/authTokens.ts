const ACCESS_KEY = "gomatch_access_token";
const REFRESH_KEY = "gomatch_refresh_token";
const EXPIRES_KEY = "gomatch_expiresAtUtc";

const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";
const EXPIRES_COOKIE = "expiresAtUtc";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function setCookie(name: string, value: string, expiresAtUtc?: string) {
  if (!isBrowser()) return;

  let cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;

  if (expiresAtUtc) {
    const expiresDate = new Date(expiresAtUtc);
    if (!Number.isNaN(expiresDate.getTime())) {
      cookie += `; expires=${expiresDate.toUTCString()}`;
    }
  }

  if (window.location.protocol === "https:") {
    cookie += "; Secure";
  }

  document.cookie = cookie;
}

function getCookie(name: string): string | null {
  if (!isBrowser()) return null;

  const prefix = `${name}=`;
  const cookies = document.cookie.split(";");

  for (const rawCookie of cookies) {
    const cookie = rawCookie.trim();
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.substring(prefix.length));
    }
  }

  return null;
}

function deleteCookie(name: string) {
  if (!isBrowser()) return;

  let cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;

  if (window.location.protocol === "https:") {
    cookie += "; Secure";
  }

  document.cookie = cookie;
}

export function setAuthTokens(
  accessToken: string,
  expiresAtUtc: string,
  refreshToken?: string
) {
  if (!isBrowser()) return;

  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(EXPIRES_KEY, expiresAtUtc);

  setCookie(ACCESS_COOKIE, accessToken, expiresAtUtc);
  setCookie(EXPIRES_COOKIE, expiresAtUtc, expiresAtUtc);

  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
    setCookie(REFRESH_COOKIE, refreshToken, expiresAtUtc);
  }

  window.dispatchEvent(new Event("gomatch-auth-changed"));
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_KEY) || getCookie(ACCESS_COOKIE);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_KEY) || getCookie(REFRESH_COOKIE);
}

export function getExpiresAtUtc(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(EXPIRES_KEY) || getCookie(EXPIRES_COOKIE);
}

export function clearAuthTokens() {
  if (!isBrowser()) return;

  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_KEY);

  deleteCookie(ACCESS_COOKIE);
  deleteCookie(REFRESH_COOKIE);
  deleteCookie(EXPIRES_COOKIE);

  window.dispatchEvent(new Event("gomatch-auth-changed"));
}