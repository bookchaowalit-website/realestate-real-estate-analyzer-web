"use client";

import { useMemo, useState } from "react";
import { DashFoot, DashTop, Pill, Stat } from "@/components/dashboard-shell";
import { DOWN_PAYMENT, computeMetrics, findListing, grossYield, listings, money, yieldBarWidth } from "@/lib/realestate";

const baht = (n: number) => Math.round(n).toLocaleString("en-US");

export default function Home() {
  const [selectedId, setSelectedId] = useState("river");
  const [downPayment, setDownPayment] = useState(30);
  const selected = findListing(selectedId);
  const metrics = useMemo(() => computeMetrics(selected, downPayment), [downPayment, selected]);

  return (
    <div className="ds">
      <a className="ds-skip" href="#main">Skip to content</a>
      <DashTop name="Rental yield" tagline="Four sample listings" />

      <main id="main" tabIndex={-1} className="ds-main">
        <div className="ds-head">
          <div>
            <h1>Rental yield</h1>
            <p>{selected.name} · gross figures in THB <Pill tone="grey">Sample data</Pill></p>
          </div>
        </div>

        <ul className="ds-stats" aria-label={`${selected.name} at a glance`}>
          <Stat label="Asking price" value={baht(selected.price)} unit="THB" note={`${selected.area} m²`} />
          <Stat label="Monthly rent" value={baht(selected.rent)} unit="THB" note={`${money.format(metrics.gross)} a year`} />
          <Stat label="Gross yield" value={`${metrics.yieldRate.toFixed(2)}%`} note="yearly rent ÷ price" />
          <Stat label="Gross payback" value={metrics.payback.toFixed(1)} unit="yrs" note={`on ${downPayment}% down`} />
        </ul>

        <div className="ds-grid">
          <section className="ds-panel" aria-labelledby="scenario-heading">
            <div className="ds-panel-head">
              <div>
                <h2 id="scenario-heading">Down payment</h2>
                <p>How long your first cash takes to come back as gross rent</p>
              </div>
            </div>
            <div className="ds-form">
              <label className="ds-field">
                <span className="ds-field-row">Share of the price paid up front <b>{downPayment}%</b></span>
                <input className="ds-range" type="range" min={DOWN_PAYMENT.min} max={DOWN_PAYMENT.max} step={DOWN_PAYMENT.step} value={downPayment} onChange={(event) => setDownPayment(Number(event.target.value))} />
              </label>
              <ul className="ds-rows">
                <li className="ds-row"><span className="ds-row-name">Initial cash</span><span className="ds-row-detail">{downPayment}% of {money.format(selected.price)}</span><span className="ds-row-value">{money.format(metrics.cash)}</span></li>
                <li className="ds-row"><span className="ds-row-name">Annual gross rent</span><span className="ds-row-detail">{money.format(selected.rent)} × 12</span><span className="ds-row-value">{money.format(metrics.gross)}</span></li>
                <li className="ds-row"><span className="ds-row-name">Gross payback</span><span className="ds-row-detail">initial cash ÷ annual gross rent</span><span className="ds-row-value">{metrics.payback.toFixed(1)} yrs</span></li>
              </ul>
            </div>
            <div className="ds-callout" aria-live="polite">
              <strong>{selected.name}</strong>
              <span>{selected.district} · {selected.type} · {selected.area} m². {selected.note}</span>
            </div>
          </section>

          <section className="ds-panel" aria-labelledby="listings-heading">
            <div className="ds-panel-head">
              <div>
                <h2 id="listings-heading">Listings</h2>
                <p>Gross yield; the bar is full at 6.25%</p>
              </div>
            </div>
            <ul className="ds-rows">
              {listings.map((listing) => (
                <li key={listing.id}>
                  <button type="button" className="ds-row" aria-pressed={listing.id === selected.id} onClick={() => setSelectedId(listing.id)}>
                    <span className="ds-row-name">{listing.name}</span>
                    <span className="ds-row-detail">{listing.district} · {listing.type}</span>
                    <span className="ds-row-value">{grossYield(listing).toFixed(1)}%</span>
                    <span className="ds-meter" aria-hidden="true"><span style={{ width: `${yieldBarWidth(grossYield(listing))}%` }} /></span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="ds-note">Four synthetic listings, not a listing feed. Gross figures only: vacancy, financing, fees, tax and maintenance are left out. Not broker or investment advice.</p>
      </main>

      <DashFoot source="https://github.com/bookchaowalit-website/realestate-real-estate-analyzer-web" />
    </div>
  );
}
