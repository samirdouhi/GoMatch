import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const GATEWAY_BASE_URL = process.env.NEXT_PUBLIC_GATEWAY_BASE_URL?.trim();

export function buildUrl(path: string): string {
  if (!GATEWAY_BASE_URL) {
    throw new Error("NEXT_PUBLIC_GATEWAY_BASE_URL is not defined");
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedBase = GATEWAY_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

/**
 * Route par défaut après authentification.
 * La logique métier réelle doit maintenant être décidée
 * après un appel backend (profil existant, onboarding requis, etc.).
 */
export function getFirstRoute(): string {
  return "/dashboard";
}