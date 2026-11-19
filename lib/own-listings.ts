// The visitor's own listings, kept in localStorage when the browser allows it. Read through
// useSyncExternalStore, so the server render (and the first client render) starts with none.
import { type Listing, parseSaved } from "@/lib/realestate";

export const STORAGE_KEY = "realestate-own-listings";
export type OwnState = { listings: Listing[]; saveFailed: boolean };

const SERVER: OwnState = { listings: [], saveFailed: false };
let state: OwnState | null = null;
const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
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

/** Replaces the list; it stays in memory for this visit even when the browser refuses to save it. */
export function setOwnListings(listings: Listing[]): void {
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
