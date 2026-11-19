import { describe, expect, it } from "vitest";
import { computeMetrics, exactMoney, downPaymentAdjustment, draftToListing, emptyDraft, findListing, grossYield, isDownPayment, listings, money, parseSaved, snapDownPayment, validateDraft, yieldBarWidth } from "@/lib/realestate";

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
  it("snaps a typed value onto the slider's 10–80 scale in whole percent", () => {
    expect(snapDownPayment(33)).toBe(33);
    expect(snapDownPayment(32.4)).toBe(32);
    expect(snapDownPayment(2)).toBe(10);
    expect(snapDownPayment(500)).toBe(80);
    expect(snapDownPayment(Number.NaN)).toBe(10);
  });

  it("accepts only values already on the scale", () => {
    expect(isDownPayment(45)).toBe(true);
    expect(isDownPayment(44)).toBe(true);
    expect(isDownPayment(44.5)).toBe(false);
    expect(isDownPayment(5)).toBe(false);
    expect(isDownPayment(Number.NaN)).toBe(false);
  });
});

describe("downPaymentAdjustment", () => {
  it("explains a clamp or a rounding, and is null when the value was used", () => {
    expect(downPaymentAdjustment(33, 33)).toBeNull();
    expect(downPaymentAdjustment(Number.NaN, 10)).toBeNull();
    expect(downPaymentAdjustment(5, 10)).toBe("Raised to 10%, the lowest this tool takes.");
    expect(downPaymentAdjustment(90, 80)).toBe("Lowered to 80%, the highest this tool takes.");
    expect(downPaymentAdjustment(33.4, 33)).toBe("Rounded to 33%, a whole percent.");
  });
});

describe("own listings", () => {
  const good = { name: " Ari Park ", price: "฿3,000,000", rent: "25000", area: "40" };
  it("accepts a sensible draft and turns it into a listing", () => {
    expect(validateDraft(good)).toEqual({});
    expect(draftToListing(good, "own-1")).toMatchObject({ id: "own-1", own: true, name: "Ari Park", price: 3_000_000, rent: 25_000, area: 40 });
  });

  it("names each problem", () => {
    expect(Object.keys(validateDraft(emptyDraft))).toEqual(["name", "price", "rent", "area"]);
    expect(validateDraft({ ...good, name: "x".repeat(61) }).name).toBe("Keep the name to 60 characters or fewer.");
    expect(validateDraft({ ...good, price: "50000" }).price).toContain("at least");
    expect(validateDraft({ ...good, rent: "-5" }).rent).toContain("above ฿0");
    expect(validateDraft({ ...good, area: "20000" }).area).toContain("between");
  });

  it("checks the number format before dropping thousands separators", () => {
    for (const bad of ["3,250,00", "1,2,3", "1.2.3", "35,5", ",100000", "100000,"]) {
      expect(validateDraft({ ...good, price: bad }).price, bad).toBeDefined();
    }
    expect(validateDraft({ ...good, area: "35,5" }).area).toBeDefined();
    expect(validateDraft({ ...good, price: "3,250,000" })).toEqual({});
    expect(validateDraft({ ...good, price: " ฿ 3 250 000 " })).toEqual({});
    expect(validateDraft({ ...good, area: "35.5" })).toEqual({});
    expect(draftToListing({ ...good, price: "1,250,000.50" }, "x").price).toBe(1_250_000.5);
  });

  it("parses saved listings and drops anything malformed", () => {
    expect(parseSaved(null)).toEqual([]);
    expect(parseSaved("{bad")).toEqual([]);
    expect(parseSaved("{}")).toEqual([]);
    expect(parseSaved(JSON.stringify([null, { id: "a", name: "A", price: 1, rent: 0, area: 1 }, { id: "b", name: "B", price: 900000, rent: 5000, area: 20 }])).map((l) => l.id)).toEqual(["b"]);
  });

  it("keeps saved numbers exactly, including ones that do not round-trip as typed text", () => {
    const [l] = parseSaved(JSON.stringify([{ id: "c", name: "C", price: 1e21, rent: 12.345, area: 0.5 }]));
    expect([l.price, l.rent, l.area]).toEqual([1e21, 12.345, 0.5]);
  });

  it("finds a listing in a given list, falling back to its first", () => {
    const mine = [draftToListing(good, "own-1")];
    expect(findListing("own-1", [...listings, ...mine]).name).toBe("Ari Park");
    expect(findListing("nope", mine).id).toBe("own-1");
    expect(findListing("nope", []).id).toBe("river");
  });
});

describe("money", () => {
  it("prints typed figures with satang only when they have them", () => {
    expect([exactMoney.format(18_500), exactMoney.format(10_000.49), exactMoney.format(10_000.5)]).toEqual(["฿18,500", "฿10,000.49", "฿10,000.50"]);
  });
  it("formats baht with the ฿ sign and no decimals", () => {
    expect(money.format(3_250_000)).toBe("฿3,250,000");
    expect(money.format(18_500.4)).toBe("฿18,500");
  });
});
