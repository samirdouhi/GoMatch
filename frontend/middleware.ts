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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token =
    request.cookies.get("accessToken")?.value ||
    request.cookies.get("authToken")?.value ||
    request.cookies.get("token")?.value;

  const isAuthPage =
    pathname.startsWith("/signin") || pathname.startsWith("/Register");
  const isAdminPage = pathname.startsWith("/admin");

  if (!token) {
    if (isAdminPage) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    return NextResponse.next();
  }

  if (isTokenExpired(token)) {
    if (isAuthPage) {
      const response = NextResponse.next();
      clearAuthCookies(response);
      return response;
    }

    const response = NextResponse.redirect(new URL("/signin", request.url));
    clearAuthCookies(response);
    return response;
  }

  const roles = getRolesFromToken(token);

  if (isAdminPage && !roles.includes("Admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthPage) {
    if (roles.includes("Admin")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/signin", "/Register"],
};