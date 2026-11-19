"use client";

import { type FormEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DashFoot, DashTop, Pill, Stat } from "@/components/dashboard-shell";
import { getServerSnapshot, getSnapshot, setOwnListings, subscribe } from "@/lib/own-listings";
import {
  DOWN_PAYMENT, YIELD_BAR_FULL, type DraftErrors, type ListingDraft, computeMetrics, downPaymentAdjustment, draftToListing, emptyDraft,
  findListing, grossYield, isDownPayment, listings as samples, money, snapDownPayment, validateDraft, yieldBarWidth,
} from "@/lib/realestate";

const FIELDS: { key: keyof ListingDraft; label: string; inputMode: "text" | "numeric" | "decimal"; placeholder: string }[] = [
  { key: "name", label: "Name", inputMode: "text", placeholder: "e.g. Ari Park Condo" },
  { key: "price", label: "Asking price, ฿", inputMode: "numeric", placeholder: "e.g. 3,500,000" },
  { key: "rent", label: "Monthly rent, ฿", inputMode: "numeric", placeholder: "e.g. 17,000" },
  { key: "area", label: "Floor area, m²", inputMode: "decimal", placeholder: "e.g. 35" },
];

export default function Home() {
  const own = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const all = useMemo(() => [...samples, ...own.listings], [own.listings]);
  const [selectedId, setSelectedId] = useState("river");
  const [downPayment, setDownPayment] = useState(30);
  // What is in the number box while someone types; null means it shows the slider's value.
  const [typed, setTyped] = useState<string | null>(null);
  // Why the last committed value differs from what was typed (clamped or rounded), said under the box.
  const [adjusted, setAdjusted] = useState<string | null>(null);
  // Said by the live region only when the listing changes, never while the down payment moves.
  const [announcement, setAnnouncement] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<ListingDraft>(emptyDraft);
  const [errors, setErrors] = useState<DraftErrors>({});
  const addButton = useRef<HTMLButtonElement>(null);
  const form = useRef<HTMLFormElement>(null);

  const selected = findListing(selectedId, all);
  const metrics = useMemo(() => computeMetrics(selected, downPayment), [downPayment, selected]);
  // Leaving the box or pressing Enter commits what was typed, clamped to the range and a whole percent.
  const commitTyped = () => {
    if (typed !== null && typed.trim() !== "") {
      const value = Number(typed);
      const used = snapDownPayment(value);
      setDownPayment(used);
      setAdjusted(downPaymentAdjustment(value, used));
    }
    setTyped(null);
  };

  const select = (id: string, message?: string) => {
    const listing = findListing(id, all);
    setSelectedId(listing.id);
    setAnnouncement(message ?? `${listing.name} selected: gross yield ${grossYield(listing).toFixed(1)}%.`);
  };

  const openForm = () => {
    setAdding(true);
    setErrors({});
    // Focus the first field once the form is drawn.
    requestAnimationFrame(() => form.current?.querySelector<HTMLInputElement>("input")?.focus());
  };
  const closeForm = () => {
    setAdding(false);
    setDraft(emptyDraft);
    setErrors({});
    requestAnimationFrame(() => addButton.current?.focus());
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateDraft(draft);
    setErrors(found);
    const first = FIELDS.find((field) => found[field.key]);
    if (first) {
      form.current?.querySelector<HTMLInputElement>(`#add-${first.key}`)?.focus();
      return;
    }
    const listing = draftToListing(draft, `own-${Date.now().toString(36)}`);
    setOwnListings([...own.listings, listing]);
    setSelectedId(listing.id);
    setAnnouncement(`Added ${listing.name} and selected it: gross yield ${grossYield(listing).toFixed(1)}%.`);
    closeForm();
  };
  const remove = () => {
    const name = selected.name;
    setOwnListings(own.listings.filter((listing) => listing.id !== selected.id));
    setSelectedId(samples[0].id);
    setAnnouncement(`Removed ${name}. ${samples[0].name} selected.`);
    requestAnimationFrame(() => addButton.current?.focus());
  };

  return (
    <div className="ds">
      <a className="ds-skip" href="#main">Skip to content</a>
      <DashTop name="Real estate analyzer" tagline="Gross yield and payback" />

      <main id="main" tabIndex={-1} className="ds-main">
        <div className="ds-head">
          <div>
            <h1>Rental yield</h1>
            <p>{selected.name} · gross figures in Thai baht (฿) {selected.own ? <Pill tone="grey">Your figures</Pill> : <Pill tone="grey">Sample data</Pill>}</p>
          </div>
        </div>

        <ul className="ds-stats" aria-label={`${selected.name} at a glance`}>
          <Stat label="Asking price" value={money.format(selected.price)} note={`${selected.area} m²`} />
          <Stat label="Monthly rent" value={money.format(selected.rent)} note="before any costs" />
          <Stat label="Gross yield" value={`${metrics.yieldRate.toFixed(2)}%`} note="yearly rent ÷ price" />
          <Stat label="Gross payback" value={metrics.payback.toFixed(1)} unit="yrs" note={`on ${downPayment}% down`} />
        </ul>

        <div className="ds-grid">
          <section className="ds-panel ds-phone-first" aria-labelledby="listings-heading">
            <div className="ds-panel-head">
              <div>
                <h2 id="listings-heading">Listings</h2>
                <p>Gross yield; the bar is full at {YIELD_BAR_FULL}%</p>
              </div>
              {!adding && (
                <button ref={addButton} type="button" className="ds-button" aria-expanded={false} aria-controls="add-listing" onClick={openForm}>
                  Add your listing
                </button>
              )}
            </div>
            <ul className="ds-rows">
              {all.map((listing) => (
                <li key={listing.id}>
                  <button type="button" className="ds-row" aria-pressed={listing.id === selected.id} onClick={() => select(listing.id)}>
                    <span className="ds-row-name">{listing.name}</span>
                    <span className="ds-row-detail">{listing.district} · {listing.type}</span>
                    <span className="ds-row-value">{grossYield(listing).toFixed(1)}%</span>
                    <span className="ds-meter" aria-hidden="true"><span style={{ width: `${yieldBarWidth(grossYield(listing))}%` }} /></span>
                  </button>
                </li>
              ))}
            </ul>
            {own.listings.length === 0 && !adding && (
              <p className="re-empty">No listings of your own yet. Add one with its price, rent and area to compare it with the samples.</p>
            )}
            {own.saveFailed && (
              <p className="re-error" role="status">This browser would not save your listings, so they last only until you leave the page.</p>
            )}

            {adding && (
              <form ref={form} id="add-listing" className="ds-form re-add" aria-labelledby="add-heading" noValidate onSubmit={submit}>
                <h3 id="add-heading">Add your listing</h3>
                <div className="re-fields">
                  {FIELDS.map((field) => (
                    <div key={field.key} className="ds-field">
                      <label htmlFor={`add-${field.key}`}>{field.label}</label>
                      <input
                        id={`add-${field.key}`}
                        className="ds-input"
                        type="text"
                        inputMode={field.inputMode}
                        autoComplete="off"
                        placeholder={field.placeholder}
                        value={draft[field.key]}
                        aria-invalid={errors[field.key] ? true : undefined}
                        aria-describedby={errors[field.key] ? `add-${field.key}-error` : undefined}
                        onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                      />
                      {errors[field.key] && <p id={`add-${field.key}-error`} className="re-error">{errors[field.key]}</p>}
                    </div>
                  ))}
                </div>
                <div className="re-actions">
                  <button type="submit" className="ds-button">Add listing</button>
                  <button type="button" className="ds-plain" onClick={closeForm}>Cancel</button>
                </div>
              </form>
            )}

            {/* Under the list, so on phones the selection's details appear right where it was picked. */}
            <div className="ds-callout">
              <strong>{selected.name}</strong>
              <span>{selected.district} · {selected.type} · {selected.area} m². {selected.note}</span>
              {selected.own && <span><button type="button" className="ds-plain" onClick={remove}>Remove this listing</button></span>}
            </div>
            <p className="ds-sr" aria-live="polite">{announcement}</p>
          </section>

          <section className="ds-panel" aria-labelledby="scenario-heading">
            <div className="ds-panel-head">
              <div>
                <h2 id="scenario-heading">Down payment</h2>
                <p>How long your first cash takes to come back as gross rent</p>
              </div>
            </div>
            <div className="ds-form">
              <div className="ds-field">
                <span className="ds-field-row">
                  <label htmlFor="down-payment-range">Share of the price paid up front</label>
                  <b><output htmlFor="down-payment-range down-payment-number">{downPayment}%</output></b>
                </span>
                <input id="down-payment-range" className="ds-range" type="range" min={DOWN_PAYMENT.min} max={DOWN_PAYMENT.max} step={DOWN_PAYMENT.step} value={downPayment} onChange={(event) => { setDownPayment(Number(event.target.value)); setTyped(null); setAdjusted(null); }} />
              </div>
              <div className="ds-field">
                <label htmlFor="down-payment-number">Or type it, %</label>
                <input
                  id="down-payment-number"
                  className="ds-input"
                  type="number"
                  inputMode="numeric"
                  min={DOWN_PAYMENT.min}
                  max={DOWN_PAYMENT.max}
                  step={DOWN_PAYMENT.step}
                  aria-describedby="down-payment-hint"
                  value={typed ?? String(downPayment)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setTyped(value);
                    setAdjusted(null);
                    if (value !== "" && isDownPayment(Number(value))) setDownPayment(Number(value));
                  }}
                  onBlur={commitTyped}
                  onKeyDown={(event) => { if (event.key === "Enter") commitTyped(); }}
                />
                <span id="down-payment-hint" className="re-hint">{adjusted ?? `Any whole number from ${DOWN_PAYMENT.min} to ${DOWN_PAYMENT.max}.`}</span>
              </div>
              <ul className="ds-rows">
                <li className="ds-row"><span className="ds-row-name">Initial cash</span><span className="ds-row-detail">{downPayment}% of {money.format(selected.price)}</span><span className="ds-row-value">{money.format(metrics.cash)}</span></li>
                <li className="ds-row"><span className="ds-row-name">Annual gross rent</span><span className="ds-row-detail">{money.format(selected.rent)} × 12</span><span className="ds-row-value">{money.format(metrics.gross)}</span></li>
                <li className="ds-row"><span className="ds-row-name">Gross payback</span><span className="ds-row-detail">initial cash ÷ annual gross rent</span><span className="ds-row-value">{metrics.payback.toFixed(1)} yrs</span></li>
              </ul>
            </div>
          </section>
        </div>

        <p className="ds-note">Four synthetic listings, not a listing feed; listings you add stay in this browser only. Gross figures only: vacancy, financing, fees, tax and maintenance are left out. Not broker or investment advice.</p>
      </main>

      <DashFoot source="https://github.com/bookchaowalit-website/realestate-real-estate-analyzer-web" />
    </div>
  );
}
