// Property ledger data and pure maths shared by the page. Four synthetic listings, not a feed or advice.

export type Listing = { id: string; district: string; name: string; type: string; price: number; rent: number; area: number; note: string; own?: boolean };

export const listings: Listing[] = [
  { id: "river", district: "Riverside", name: "North Pier Residence", type: "1-bed condo", price: 3250000, rent: 18500, area: 34, note: "Strong transit access; compact floor plan." },
  { id: "old-town", district: "Old Town", name: "Soi Pradu House", type: "Townhouse", price: 4890000, rent: 24000, area: 96, note: "Wider footprint; slower rental turn." },
  { id: "green-line", district: "Green Line", name: "Station Room 08", type: "Studio condo", price: 2190000, rent: 14000, area: 28, note: "Small ticket, commuter-led demand." },
  { id: "east-market", district: "East Market", name: "Market Court", type: "Shop-house", price: 6750000, rent: 36000, area: 124, note: "Commercial frontage; higher upkeep." },
];

// Thai baht with the ฿ sign (narrowSymbol), e.g. ฿3,250,000; the page copy stays English.
export const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "THB", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 });

// Whole percent steps, so the number box takes any value the slider can show.
export const DOWN_PAYMENT = { min: 10, max: 80, step: 1 } as const;

export type Metrics = { gross: number; yieldRate: number; cash: number; payback: number };

export function findListing(id: string, from: readonly Listing[] = listings): Listing {
  return from.find((listing) => listing.id === id) ?? from[0] ?? listings[0];
}

// Annual gross rent as a percentage of the asking price.
export function grossYield(listing: Pick<Listing, "price" | "rent">): number {
  return listing.price > 0 ? ((listing.rent * 12) / listing.price) * 100 : 0;
}

// Gross figures only: no vacancy, financing, fees, tax or maintenance.
export function computeMetrics(listing: Pick<Listing, "price" | "rent">, downPaymentPct: number): Metrics {
  const gross = listing.rent * 12;
  const cash = listing.price * (downPaymentPct / 100);
  return { gross, yieldRate: grossYield(listing), cash, payback: gross > 0 ? cash / gross : Infinity };
}

/** Gross yield, in percent, that fills the yield bar. */
export const YIELD_BAR_FULL = 10;

// Width of the yield bar in percent: YIELD_BAR_FULL (10% gross yield) fills it, clamped to 0–100.
export function yieldBarWidth(yieldRate: number): number {
  return Math.max(0, Math.min((yieldRate / YIELD_BAR_FULL) * 100, 100));
}

/** Snaps a typed down payment onto the slider's scale: clamped to min–max and rounded to a whole percent. */
export function snapDownPayment(value: number): number {
  const { min, max, step } = DOWN_PAYMENT;
  if (!Number.isFinite(value)) return min;
  const snapped = min + Math.round((value - min) / step) * step;
  return Math.max(min, Math.min(snapped, max));
}

/** True when a typed value can be used as is: a number on the slider's scale. */
export function isDownPayment(value: number): boolean {
  return Number.isFinite(value) && snapDownPayment(value) === value;
}

/** Why a committed value differs from what was typed, or null when it was used as is. */
export function downPaymentAdjustment(typed: number, used: number): string | null {
  if (!Number.isFinite(typed) || typed === used) return null;
  if (typed < DOWN_PAYMENT.min) return `Raised to ${used}%, the lowest this tool takes.`;
  if (typed > DOWN_PAYMENT.max) return `Lowered to ${used}%, the highest this tool takes.`;
  return `Rounded to ${used}%, a whole percent.`;
}

// "Add your listing" form: the raw text of each field, checked before it becomes a Listing.
export type ListingDraft = { name: string; price: string; rent: string; area: string };
export type DraftErrors = Partial<Record<keyof ListingDraft, string>>;
export const emptyDraft: ListingDraft = { name: "", price: "", rent: "", area: "" };

// Accepts "3250000", "3,250,000" or "3 250 000" (thousands groups of exactly three digits), an
// optional ฿ in front and a dot for decimals. The format is checked before separators are dropped,
// so a typo like "3,250,00" or "35,5" is refused instead of silently becoming another number.
function amount(text: string): number {
  const trimmed = text.trim().replace(/^฿\s*/, "");
  const valid = /^(\d+|\d{1,3}(,\d{3})+|\d{1,3}( \d{3})+)(\.\d+)?$/.test(trimmed);
  return valid ? Number(trimmed.replace(/[, ]/g, "")) : Number.NaN;
}

export function validateDraft(draft: ListingDraft): DraftErrors {
  const errors: DraftErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = "Enter a name, such as the building or street.";
  else if (name.length > 60) errors.name = "Keep the name to 60 characters or fewer.";
  const price = amount(draft.price);
  if (!draft.price.trim()) errors.price = "Enter the asking price in baht.";
  else if (!(price >= 100_000)) errors.price = "Enter a price of at least ฿100,000, digits only.";
  const rent = amount(draft.rent);
  if (!draft.rent.trim()) errors.rent = "Enter the monthly rent in baht.";
  else if (!(rent > 0)) errors.rent = "Enter a monthly rent above ฿0, digits only.";
  else if (rent * 12 > price) errors.rent = "A year of rent is above the price; check both figures.";
  const area = amount(draft.area);
  if (!draft.area.trim()) errors.area = "Enter the floor area in m².";
  else if (!(area > 0 && area <= 10_000)) errors.area = "Enter an area between 1 and 10,000 m², with a dot for decimals.";
  return errors;
}

/** A checked draft as a listing of the visitor's own. Call only when validateDraft found no errors. */
export function draftToListing(draft: ListingDraft, id: string): Listing {
  return { id, own: true, district: "Your listing", name: draft.name.trim(), type: "Added by you", price: amount(draft.price), rent: amount(draft.rent), area: amount(draft.area), note: "Figures you entered; kept only in this browser." };
}

/** Reads saved own listings, dropping anything malformed. */
export function parseSaved(raw: string | null): Listing[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((item): item is Listing => {
      const l = item as Listing;
      return typeof l === "object" && l !== null && typeof l.id === "string" && typeof l.name === "string" && [l.price, l.rent, l.area].every((n) => typeof n === "number" && n > 0);
    }).map((l) => draftToListing({ name: l.name, price: String(l.price), rent: String(l.rent), area: String(l.area) }, l.id));
  } catch {
    return [];
  }
}
