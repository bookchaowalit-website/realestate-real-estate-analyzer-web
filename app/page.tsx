"use client";

import { useMemo, useState } from "react";

type Listing = { id: string; district: string; name: string; type: string; price: number; rent: number; area: number; note: string };

const listings: Listing[] = [
  { id: "river", district: "Riverside", name: "North Pier Residence", type: "1-bed condo", price: 3250000, rent: 18500, area: 34, note: "Strong transit access; compact floor plan." },
  { id: "old-town", district: "Old Town", name: "Soi Pradu House", type: "Townhouse", price: 4890000, rent: 24000, area: 96, note: "Wider footprint; slower rental turn." },
  { id: "green-line", district: "Green Line", name: "Station Room 08", type: "Studio condo", price: 2190000, rent: 14000, area: 28, note: "Small ticket, commuter-led demand." },
  { id: "east-market", district: "East Market", name: "Market Court", type: "Shop-house", price: 6750000, rent: 36000, area: 124, note: "Commercial frontage; higher upkeep." },
];

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "THB", maximumFractionDigits: 0 });

export default function Home() {
  const [selectedId, setSelectedId] = useState("river");
  const [downPayment, setDownPayment] = useState(30);
  const selected = listings.find((listing) => listing.id === selectedId) ?? listings[0];
  const metrics = useMemo(() => {
    const gross = selected.rent * 12;
    const yieldRate = (gross / selected.price) * 100;
    const cash = selected.price * (downPayment / 100);
    return { gross, yieldRate, cash, payback: cash / gross };
  }, [downPayment, selected]);

  return (
    <main className="ledger-page">
      <div className="ledger-frame">
        <header className="ledger-masthead"><span className="ledger-mark">RA / 01</span><span>PROPERTY DECISION DESK</span><span className="ledger-status"><i /> SYNTHETIC LEDGER</span></header>
        <section className="ledger-hero"><div><p className="ledger-kicker">compare the number behind the feeling</p><h1>Find the<br /><em>yield line.</em></h1><p className="ledger-deck">A small property ledger for comparing asking price, monthly rent, and the time your cash stays in the building.</p></div><div className="ledger-stamp"><span>NOT A LISTING FEED</span><strong>04</strong><small>sample records<br />for study</small></div></section>

        <section className="ledger-workbench" aria-label="Property comparison workspace">
          <aside className="property-index"><div className="section-label"><span>INDEX</span><span>{listings.length} records</span></div>{listings.map((listing, index) => <button type="button" key={listing.id} className={`property-row ${selected.id === listing.id ? "is-active" : ""}`} onClick={() => setSelectedId(listing.id)}><span className="row-number">0{index + 1}</span><span><strong>{listing.name}</strong><small>{listing.district} · {listing.type}</small></span><b>{(listing.rent * 12 / listing.price * 100).toFixed(1)}%</b></button>)}</aside>
          <article className="property-sheet"><div className="sheet-top"><div><p className="section-label">SELECTED RECORD</p><h2>{selected.name}</h2><p>{selected.district} / {selected.type} / {selected.area} m²</p></div><span className="sheet-id">{selected.id.toUpperCase()}</span></div><div className="number-grid"><div><span>ASKING PRICE</span><strong>{money.format(selected.price)}</strong></div><div><span>MONTHLY RENT</span><strong>{money.format(selected.rent)}</strong></div><div className="number-accent"><span>GROSS YIELD</span><strong>{metrics.yieldRate.toFixed(2)}%</strong></div></div><div className="sheet-note"><span>FIELD NOTE</span><p>{selected.note}</p></div><div className="yield-bar" aria-label={`${metrics.yieldRate.toFixed(2)} percent gross yield`}><span style={{ width: `${Math.min(metrics.yieldRate * 16, 100)}%` }} /></div><p className="yield-caption">Annual gross rent / asking price · ignores vacancy, financing, fees, tax, and maintenance.</p></article>
        </section>

        <section className="scenario" aria-labelledby="scenario-title"><div className="scenario-heading"><p className="section-label">SCENARIO / CASH AT RISK</p><h2 id="scenario-title">Move the deposit, keep the record.</h2><p>See how the headline payback changes when your initial cash changes.</p></div><label className="range-field"><span>DOWN PAYMENT <b>{downPayment}%</b></span><input type="range" min="10" max="80" step="5" value={downPayment} onChange={(event) => setDownPayment(Number(event.target.value))} /></label><dl className="scenario-output"><div><dt>INITIAL CASH</dt><dd>{money.format(metrics.cash)}</dd></div><div><dt>ANNUAL GROSS</dt><dd>{money.format(metrics.gross)}</dd></div><div><dt>GROSS PAYBACK</dt><dd>{metrics.payback.toFixed(1)} yrs</dd></div></dl></section>
        <footer className="ledger-footer"><span>BOOKCHAOWALIT / REAL ESTATE ANALYZER</span><span>DEMO DATA · NO BROKER OR INVESTMENT ADVICE</span></footer>
      </div>
    </main>
  );
}
