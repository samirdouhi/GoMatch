import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type DecodedJwt = {
  roles?: string[] | string;
  role?: string[] | string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?:
    | string[]
    | string;
  exp?: number;
};

function normalizeRoles(value: string[] | string | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function decodeJwtPayload(token: string): DecodedJwt | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as DecodedJwt;
  } catch {
    return null;
  }
}

function getRolesFromToken(token: string): string[] {
  const decoded = decodeJwtPayload(token);
  if (!decoded) return [];
  const roles = [
    ...normalizeRoles(decoded.roles),
    ...normalizeRoles(decoded.role),
    ...normalizeRoles(
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
    ),
  ];
  return [...new Set(roles.filter(Boolean))];
}

function isTokenExpired(token: string): boolean {
  const decoded = decodeJwtPayload(token);
  if (!decoded?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp <= now;
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  response.cookies.delete("expiresAtUtc");
  response.cookies.delete("authToken");
  response.cookies.delete("token");
}

// Routes always accessible without a token
const PUBLIC_ROUTES = [
  "/",
  "/signin",
  "/Register",
  "/a-propos",
  "/aide",
  "/contact",
  "/confirm-email",
  "/merchant/confirm-email",
  "/experience",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    r => pathname === r || (r !== "/" && pathname.startsWith(r + "/"))
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token =
    request.cookies.get("accessToken")?.value ||
    request.cookies.get("authToken")?.value ||
    request.cookies.get("token")?.value;

  const isAuthPage =
    pathname.startsWith("/signin") || pathname.startsWith("/Register");
  const isAdminPage = pathname.startsWith("/admin");
  const isCommercantPage = pathname.startsWith("/commercant");

  // ── No token ────────────────────────────────────────────────────────────────
  if (!token) {
    if (!isPublicRoute(pathname)) {
      // Admin pages always require a valid access token
      if (isAdminPage) {
        return NextResponse.redirect(new URL("/signin", request.url));
      }

      // For other protected pages, check if a refresh token exists.
      // If so, let the client-side TokenKeepAlive handle the silent refresh
      // instead of bouncing the user to signin prematurely.
      const refreshToken =
        request.cookies.get("refreshToken")?.value ||
        request.cookies.get("refresh_token")?.value;

      if (!refreshToken) {
        return NextResponse.redirect(new URL("/signin", request.url));
      }

      return NextResponse.next();
    }
    return NextResponse.next();
  }

  // ── Token expired ───────────────────────────────────────────────────────────
  if (isTokenExpired(token)) {
    const refreshToken =
      request.cookies.get("refreshToken")?.value ||
      request.cookies.get("refresh_token")?.value;

    if (isAuthPage) {
      const response = NextResponse.next();
      if (!refreshToken) clearAuthCookies(response);
      return response;
    }

    if (refreshToken) {
      // Access token expiré mais refresh valide → le client gère le refresh
      return NextResponse.next();
    }

    const response = NextResponse.redirect(new URL("/signin", request.url));
    clearAuthCookies(response);
    return response;
  }

  // ── Token valid ─────────────────────────────────────────────────────────────
  const roles = getRolesFromToken(token);

  if (isAdminPage && !roles.includes("Admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Admin is restricted to admin pages and public routes only
  if (roles.includes("Admin") && !isAdminPage && !isPublicRoute(pathname) && !isAuthPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isCommercantPage && !roles.includes("Commercant")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAuthPage) {
    if (roles.includes("Admin")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (roles.includes("Commercant")) {
      return NextResponse.redirect(new URL("/commercant", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on every page route, skip Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
