// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { STORAGE_KEY, resetOwnListings } from "@/lib/own-listings";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
const button = (text: string) => [...host.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith(text)) as HTMLButtonElement;
const press = (el: Element) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
const text = (el: Element | null | undefined) => el?.textContent;
const stats = () => [...host.querySelectorAll(".ds-stat")].map(text);
const range = () => host.querySelector("#down-payment-range") as HTMLInputElement;
const box = () => host.querySelector("#down-payment-number") as HTMLInputElement;
function setValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => { setter.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); });
}
const slide = (value: number) => setValue(range(), String(value));
const blur = (input: HTMLInputElement) => act(() => { input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })); });
const scenario = (selector: string) => host.querySelector("#scenario-heading")?.closest("section")?.querySelector(selector);
const hint = () => host.querySelector("#down-payment-hint")?.textContent;
const field = (id: string) => host.querySelector(`#add-${id}`) as HTMLInputElement;
const submit = () => act(() => { host.querySelector("#add-listing")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
const live = () => host.querySelector(".ds-sr[aria-live]")?.textContent;
const key = (input: HTMLInputElement, name: string) => act(() => { input.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true })); });

beforeEach(() => {
  localStorage.clear();
  resetOwnListings();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(<Home />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("rental yield page", () => {
  it("opens on North Pier Residence at 30% down", () => {
    expect(host.querySelector("h1")?.textContent).toBe("Rental yield");
    expect(stats()).toEqual(["Asking price฿3,250,00034 m²", "Monthly rent฿18,500before any costs", "Gross yield6.83%yearly rent ÷ price", "Gross payback4.4yrson 30% down"]);
    expect(button("North Pier Residence").getAttribute("aria-pressed")).toBe("true");
    expect(host.querySelector(".ds-pill")?.textContent).toBe("Sample data");
    expect(host.textContent).toContain("Not broker or investment advice");
  });

  it("lists all four listings with their gross yield", () => {
    expect([...host.querySelectorAll("button.ds-row")].map((row) => [row.querySelector(".ds-row-name")?.textContent, row.querySelector(".ds-row-value")?.textContent])).toEqual([
      ["North Pier Residence", "6.8%"], ["Soi Pradu House", "5.9%"], ["Station Room 08", "7.7%"], ["Market Court", "6.4%"],
    ]);
  });

  it("selects another listing and recomputes every figure", () => {
    press(button("Market Court"));
    expect(button("Market Court").getAttribute("aria-pressed")).toBe("true");
    expect(stats()[0]).toBe("Asking price฿6,750,000124 m²");
    expect(stats()[2]).toBe("Gross yield6.40%yearly rent ÷ price");
    expect(host.querySelector(".ds-callout")?.textContent).toContain("Commercial frontage; higher upkeep.");
    // The details sit under the listings (not above them in the down-payment panel), with the key figures.
    const callout = host.querySelector("#listings-heading")?.closest("section")?.querySelector(".ds-callout");
    const rows = callout?.parentElement?.querySelector(".ds-rows");
    expect(rows && callout && rows.compareDocumentPosition(callout) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The callout no longer repeats the payback, and it is not a live region (the down payment would re-read it).
    expect(callout?.textContent).not.toContain("payback");
    expect(callout?.hasAttribute("aria-live")).toBe(false);
    expect(host.querySelector("#scenario-heading")?.closest("section")?.querySelector(".ds-callout")).toBeNull();
  });

  it("moves the down payment and the payback follows", () => {
    slide(50);
    expect(host.querySelector(".ds-field-row output")?.textContent).toBe("50%");
    expect(box().value).toBe("50");
    expect(stats()[3]).toBe("Gross payback7.3yrson 50% down");
    expect(text(scenario(".ds-rows .ds-row-value"))).toBe("฿1,625,000");
  });

  it("ties the shown value to the slider and the number box with an output", () => {
    const output = host.querySelector("output")!;
    expect(output.getAttribute("for")).toBe("down-payment-range down-payment-number");
    expect(host.querySelector('label[for="down-payment-range"]')?.textContent).toBe("Share of the price paid up front");
    expect(box().labels?.[0]?.textContent).toBe("Or type it, %");
    expect(host.querySelector(`#${box().getAttribute("aria-describedby")}`)?.textContent).toBe("Any whole number from 10 to 80.");
    expect([box().min, box().max, box().step]).toEqual([range().min, range().max, range().step]);
  });

  it("takes a typed down payment and keeps the slider in step", () => {
    setValue(box(), "6");
    expect(range().value).toBe("30");
    setValue(box(), "60");
    expect(range().value).toBe("60");
    expect(host.querySelector("output")?.textContent).toBe("60%");
    expect(stats()[3]).toBe("Gross payback8.8yrson 60% down");
    setValue(box(), "33");
    expect(range().value).toBe("33");
    expect(stats()[3]).toBe("Gross payback4.8yrson 33% down");
    setValue(box(), "33.6");
    blur(box());
    expect(range().value).toBe("34");
    expect(box().value).toBe("34");
    expect(hint()).toBe("Rounded to 34%, a whole percent.");
    setValue(box(), "120");
    blur(box());
    expect(box().value).toBe("80");
    expect(hint()).toBe("Lowered to 80%, the highest this tool takes.");
    setValue(box(), "2");
    blur(box());
    expect(box().value).toBe("10");
    expect(hint()).toBe("Raised to 10%, the lowest this tool takes.");
    slide(40);
    expect(hint()).toBe("Any whole number from 10 to 80.");
    setValue(box(), "80");
    setValue(box(), "");
    blur(box());
    expect(box().value).toBe("80");
  });

  it("commits a typed down payment on Enter, rounded like on blur, and every figure follows", () => {
    setValue(box(), "34.7");
    expect(stats()[3]).toBe("Gross payback4.4yrson 30% down");
    key(box(), "a");
    expect(box().value).toBe("34.7");
    key(box(), "Enter");
    expect(box().value).toBe("35");
    expect(range().value).toBe("35");
    expect(host.querySelector("output")?.textContent).toBe("35%");
    expect(stats()[3]).toBe("Gross payback5.1yrson 35% down");
    expect(scenario(".ds-rows .ds-row-detail")?.textContent).toBe("35% of ฿3,250,000");
    setValue(box(), "");
    key(box(), "Enter");
    expect(box().value).toBe("35");
  });

  it("scales each yield bar to a full mark of 10%", () => {
    expect(host.querySelector("#listings-heading + p")?.textContent).toBe("Gross yield; the bar is full at 10%");
    const widths = [...host.querySelectorAll<HTMLElement>("button.ds-row .ds-meter span")].map((bar) => Number.parseFloat(bar.style.width));
    expect(widths.map(Math.round)).toEqual([68, 59, 77, 64]);
    expect(widths.every((width) => width < 100)).toBe(true);
  });

  it("puts the listings before the down payment, so phones see the choice first", () => {
    const sections = [...host.querySelectorAll(".ds-grid > section")].map((section) => section.getAttribute("aria-labelledby"));
    expect(sections).toEqual(["listings-heading", "scenario-heading"]);
    // DOM order is the order on every screen (no CSS reordering), so Tab order matches what is seen.
    expect(host.querySelector(".ds-phone-first")).toBeNull();
  });

  it("announces a listing change but not a down-payment move", () => {
    expect(live()).toBe("");
    press(button("Soi Pradu House"));
    expect(live()).toBe("Soi Pradu House selected: gross yield 5.9%.");
    slide(55);
    expect(live()).toBe("Soi Pradu House selected: gross yield 5.9%.");
    expect(host.querySelectorAll("[aria-live]")).toHaveLength(1);
  });

  it("names the app in the top bar and the question in the h1, not the same words twice", () => {
    expect(host.querySelector(".ds-brand")?.textContent).not.toContain("Rental yield");
    expect(host.textContent?.split("฿222,000")).toHaveLength(2);
  });

  it("shows an empty state, then checks and adds a listing of your own", () => {
    expect(host.querySelector(".re-empty")?.textContent).toContain("No listings of your own yet");
    press(button("Add your listing"));
    expect(host.querySelector(".re-empty")).toBeNull();
    submit();
    expect(field("name").getAttribute("aria-invalid")).toBe("true");
    expect(host.querySelector(`#${field("name").getAttribute("aria-describedby")}`)?.textContent).toBe("Enter a name, such as the building or street.");
    expect(host.querySelectorAll(".re-error")).toHaveLength(4);
    setValue(field("name"), "Ari Park Condo");
    setValue(field("price"), "50,000");
    setValue(field("rent"), "500000");
    setValue(field("area"), "0");
    submit();
    expect(field("name").hasAttribute("aria-invalid")).toBe(false);
    expect([...host.querySelectorAll(".re-error")].map(text)).toEqual(["Enter a price of at least ฿100,000, digits only.", "A year of rent is above the price; check both figures.", "Enter an area between 1 and 10,000 m²."]);
    setValue(field("price"), "3,000,000");
    setValue(field("rent"), "25,000");
    setValue(field("area"), "40");
    submit();
    expect(host.querySelector("#add-listing")).toBeNull();
    expect(button("Ari Park Condo").getAttribute("aria-pressed")).toBe("true");
    expect(stats()[2]).toBe("Gross yield10.00%yearly rent ÷ price");
    expect(host.querySelector(".ds-head .ds-pill")?.textContent).toBe("Your figures");
    expect(live()).toBe("Added Ari Park Condo and selected it: gross yield 10.0%.");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toHaveLength(1);
    expect(host.querySelector(".re-empty")).toBeNull();
  });

  it("cancels the form and removes an added listing", () => {
    press(button("Add your listing"));
    press(button("Cancel"));
    expect(host.querySelector("#add-listing")).toBeNull();
    press(button("Add your listing"));
    setValue(field("name"), "Soi 5 Loft");
    setValue(field("price"), "2000000");
    setValue(field("rent"), "12000");
    setValue(field("area"), "30");
    submit();
    press(button("Remove this listing"));
    expect(button("Soi 5 Loft")).toBeUndefined();
    expect(button("North Pier Residence").getAttribute("aria-pressed")).toBe("true");
    expect(live()).toBe("Removed Soi 5 Loft. North Pier Residence selected.");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([]);
  });
});

describe("rental yield page with stored and refused storage", () => {
  it("reads saved listings back on load", () => {
    act(() => root.unmount());
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: "own-1", name: "Saved Flat", price: 1_200_000, rent: 10_000, area: 25 }, { bad: true }]));
    resetOwnListings();
    root = createRoot(host);
    act(() => root.render(<Home />));
    expect(button("Saved Flat").textContent).toContain("10.0%");
    expect(host.querySelector(".re-empty")).toBeNull();
  });

  it("keeps an added listing for the visit and says so when the browser will not save", () => {
    const spy = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("quota"); });
    try {
      press(button("Add your listing"));
      setValue(field("name"), "No Save House");
      setValue(field("price"), "1500000");
      setValue(field("rent"), "9000");
      setValue(field("area"), "50");
      submit();
      expect(button("No Save House").getAttribute("aria-pressed")).toBe("true");
      expect(host.querySelector('.re-error[role="status"]')?.textContent).toContain("would not save");
    } finally {
      spy.mockRestore();
    }
  });
});
