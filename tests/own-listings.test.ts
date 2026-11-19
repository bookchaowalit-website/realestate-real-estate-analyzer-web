// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import type { Listing } from "@/lib/realestate";
import { STORAGE_KEY, getSnapshot, resetOwnListings, setOwnListings, subscribe } from "@/lib/own-listings";

const flat = (id: string): Listing => ({ id, own: true, district: "Your listing", type: "Added by you", note: "", name: id, price: 1_200_000, rent: 10_000, area: 25 });

beforeEach(() => {
  localStorage.clear();
  resetOwnListings();
});

describe("own listings store across tabs", () => {
  it("adds on top of what another tab saved, never over it", () => {
    expect(getSnapshot().listings).toEqual([]); // this tab's copy is now cached
    localStorage.setItem(STORAGE_KEY, JSON.stringify([flat("own-tab1")])); // the other tab adds
    setOwnListings((latest) => [...latest, flat("own-tab2")]);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!).map((l: { id: string }) => l.id);
    expect(saved).toEqual(["own-tab1", "own-tab2"]);
    expect(getSnapshot().listings.map((l) => l.id)).toEqual(["own-tab1", "own-tab2"]);
  });

  it("follows another tab's change through the storage event", () => {
    let calls = 0;
    const stop = subscribe(() => { calls += 1; });
    expect(getSnapshot().listings).toEqual([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([flat("own-other")]));
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    expect(calls).toBe(1);
    expect(getSnapshot().listings.map((l) => l.id)).toEqual(["own-other"]);
    window.dispatchEvent(new StorageEvent("storage", { key: "something-else" }));
    expect(calls).toBe(1);
    stop();
  });
});
