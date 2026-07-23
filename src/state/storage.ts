/**
 * Safe localStorage access. Every read/write is wrapped; when storage is
 * unavailable (private browsing, full, disabled) the game continues with
 * in-memory values and the UI shows one calm notice.
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

let cached: { storage: StorageLike; persistent: boolean } | null = null;

/** Returns a working storage plus whether it actually persists. */
export function getStorage(): { storage: StorageLike; persistent: boolean } {
  if (cached) return cached;
  try {
    const probeKey = "blockReef.probe";
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    cached = { storage: window.localStorage, persistent: true };
  } catch {
    cached = { storage: new MemoryStorage(), persistent: false };
  }
  return cached;
}

/** Read + JSON-parse a key, returning null on any failure. */
export function readJson<T>(storage: StorageLike, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** JSON-stringify + write a key; returns false on any failure. */
export function writeJson(storage: StorageLike, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Test helper. */
export function resetStorageCache(): void {
  cached = null;
}
