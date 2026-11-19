// The visitor's own listings, kept in localStorage when the browser allows it. Read through
// useSyncExternalStore, so the server render (and the first client render) starts with none.
import { type Listing, parseSaved } from "@/lib/realestate";

export const STORAGE_KEY = "realestate-own-listings";
export type OwnState = { listings: Listing[]; saveFailed: boolean };

const SERVER: OwnState = { listings: [], saveFailed: false };
let state: OwnState | null = null;
const listeners = new Set<() => void>();

// Another tab saved a change: forget this tab's copy and re-read storage, so every tab shows the same list.
function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  state = null;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): OwnState {
  if (state === null) {
    try {
      state = { listings: parseSaved(window.localStorage.getItem(STORAGE_KEY)), saveFailed: false };
    } catch {
      state = { listings: [], saveFailed: true };
    }
  }
  return state;
}

export function getServerSnapshot(): OwnState {
  return SERVER;
}

/**
 * Changes the list with `update`, applied to the latest saved list (so a tab with a stale copy adds
 * to or removes from what another tab saved, never overwrites it). When this visit could not save,
 * storage is behind, so the in-memory list is the latest. The result stays in memory for this
 * visit even when the browser refuses to save it.
 */
export function setOwnListings(update: (latest: Listing[]) => Listing[]): void {
  const current = getSnapshot();
  let latest = current.listings;
  if (!current.saveFailed) {
    try {
      latest = parseSaved(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      // Storage became unreadable: keep working on this tab's copy.
    }
  }
  const listings = update(latest);
  let saveFailed = false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  } catch {
    saveFailed = true;
  }
  state = { listings, saveFailed };
  listeners.forEach((listener) => listener());
}

/** Forgets the in-memory copy so the next read goes back to storage (tests). */
export function resetOwnListings(): void {
  state = null;
}
