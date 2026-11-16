import { describe, expect, it } from "vitest";
import { computeMetrics, findListing, grossYield, isDownPayment, listings, money, snapDownPayment, yieldBarWidth } from "@/lib/realestate";

describe("listings", () => {
  it("holds four synthetic records and falls back to the first", () => {
    expect(listings.map((l) => l.id)).toEqual(["river", "old-town", "green-line", "east-market"]);
    expect(findListing("old-town").name).toBe("Soi Pradu House");
    expect(findListing("missing").id).toBe("river");
  });
});

describe("grossYield", () => {
  it("is annual rent over asking price, as a percentage", () => {
    expect(grossYield({ price: 1_200_000, rent: 10_000 })).toBe(10);
    expect(grossYield(findListing("river"))).toBeCloseTo(6.83, 2);
  });

  it("is zero rather than Infinity for a zero price", () => {
    expect(grossYield({ price: 0, rent: 10_000 })).toBe(0);
  });
});

describe("computeMetrics", () => {
  it("derives initial cash and gross payback from the down payment", () => {
    const m = computeMetrics({ price: 3_000_000, rent: 25_000 }, 30);
    expect(m.gross).toBe(300_000);
    expect(m.cash).toBe(900_000);
    expect(m.payback).toBe(3);
  });

  it("reports an infinite payback when there is no rent", () => {
    expect(computeMetrics({ price: 1_000_000, rent: 0 }, 20).payback).toBe(Infinity);
  });
});

describe("yieldBarWidth", () => {
  it("scales 10% to a full bar and clamps both ends", () => {
    expect(yieldBarWidth(10)).toBe(100);
    expect(yieldBarWidth(12)).toBe(100);
    expect(yieldBarWidth(6.25)).toBe(62.5);
    expect(yieldBarWidth(3)).toBe(30);
    expect(yieldBarWidth(-1)).toBe(0);
  });
});

describe("down payment input", () => {
  it("snaps a typed value onto the slider's 10–80 scale in steps of 5", () => {
    expect(snapDownPayment(33)).toBe(35);
    expect(snapDownPayment(32)).toBe(30);
    expect(snapDownPayment(2)).toBe(10);
    expect(snapDownPayment(500)).toBe(80);
    expect(snapDownPayment(Number.NaN)).toBe(10);
  });

  it("accepts only values already on the scale", () => {
    expect(isDownPayment(45)).toBe(true);
    expect(isDownPayment(44)).toBe(false);
    expect(isDownPayment(5)).toBe(false);
    expect(isDownPayment(Number.NaN)).toBe(false);
  });
});

describe("money", () => {
  it("formats baht with the ฿ sign and no decimals", () => {
    expect(money.format(3_250_000)).toBe("฿3,250,000");
    expect(money.format(18_500.4)).toBe("฿18,500");
  });
});
