// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Home from "@/app/page";

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

beforeEach(() => {
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
    expect(stats()).toEqual(["Asking price฿3,250,00034 m²", "Monthly rent฿18,500฿222,000 a year", "Gross yield6.83%yearly rent ÷ price", "Gross payback4.4yrson 30% down"]);
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
    expect(callout?.previousElementSibling?.classList.contains("ds-rows")).toBe(true);
    expect(callout?.textContent).toContain("Gross yield 6.40% · payback");
    expect(host.querySelector("#scenario-heading")?.closest("section")?.querySelector(".ds-callout")).toBeNull();
  });

  it("moves the down payment and the payback follows", () => {
    slide(50);
    expect(host.querySelector(".ds-field-row output")?.textContent).toBe("50%");
    expect(box().value).toBe("50");
    expect(stats()[3]).toBe("Gross payback7.3yrson 50% down");
    expect(text(host.querySelector(".ds-rows .ds-row-value"))).toBe("฿1,625,000");
  });

  it("ties the shown value to the slider and the number box with an output", () => {
    const output = host.querySelector("output")!;
    expect(output.getAttribute("for")).toBe("down-payment-range down-payment-number");
    expect(host.querySelector('label[for="down-payment-range"]')?.textContent).toBe("Share of the price paid up front");
    expect(box().labels?.[0]?.textContent).toContain("Or type it, % (10–80, steps of 5)");
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
    expect(range().value).toBe("60");
    blur(box());
    expect(range().value).toBe("35");
    expect(box().value).toBe("35");
    setValue(box(), "120");
    blur(box());
    expect(box().value).toBe("80");
    setValue(box(), "");
    blur(box());
    expect(box().value).toBe("80");
  });

  it("scales each yield bar to a full mark of 10%", () => {
    expect(host.querySelector("#listings-heading + p")?.textContent).toBe("Gross yield; the bar is full at 10%");
    const widths = [...host.querySelectorAll<HTMLElement>("button.ds-row .ds-meter span")].map((bar) => Number.parseFloat(bar.style.width));
    expect(widths.map(Math.round)).toEqual([68, 59, 77, 64]);
    expect(widths.every((width) => width < 100)).toBe(true);
  });
});
