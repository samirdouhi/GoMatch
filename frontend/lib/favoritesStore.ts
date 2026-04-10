const KEY = "gomatch_favorites_v1";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export function getFavoriteIds(): string[] {
  return readIds();
}

export function isFavorite(id: string): boolean {
  return readIds().includes(id);
}

export function addFavorite(id: string): void {
  const ids = readIds();
  if (!ids.includes(id)) writeIds([...ids, id]);
}

export function removeFavorite(id: string): void {
  writeIds(readIds().filter((x) => x !== id));
}

export function toggleFavorite(id: string): boolean {
  if (isFavorite(id)) {
    removeFavorite(id);
    return false;
  } else {
    addFavorite(id);
    return true;
  }
}
