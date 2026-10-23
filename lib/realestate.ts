// Property ledger data and pure maths shared by the page. Four synthetic listings, not a feed or advice.

export type Listing = { id: string; district: string; name: string; type: string; price: number; rent: number; area: number; note: string };

export const listings: Listing[] = [
  { id: "river", district: "Riverside", name: "North Pier Residence", type: "1-bed condo", price: 3250000, rent: 18500, area: 34, note: "Strong transit access; compact floor plan." },
  { id: "old-town", district: "Old Town", name: "Soi Pradu House", type: "Townhouse", price: 4890000, rent: 24000, area: 96, note: "Wider footprint; slower rental turn." },
  { id: "green-line", district: "Green Line", name: "Station Room 08", type: "Studio condo", price: 2190000, rent: 14000, area: 28, note: "Small ticket, commuter-led demand." },
  { id: "east-market", district: "East Market", name: "Market Court", type: "Shop-house", price: 6750000, rent: 36000, area: 124, note: "Commercial frontage; higher upkeep." },
];

export const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "THB", maximumFractionDigits: 0 });

export const DOWN_PAYMENT = { min: 10, max: 80, step: 5 } as const;

export type Metrics = { gross: number; yieldRate: number; cash: number; payback: number };

export function findListing(id: string): Listing {
  return listings.find((listing) => listing.id === id) ?? listings[0];
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

// Width of the yield bar: 6.25% gross yield fills it.
export function yieldBarWidth(yieldRate: number): number {
  return Math.max(0, Math.min(yieldRate * 16, 100));
}
