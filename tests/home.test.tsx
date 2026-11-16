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
// Intl puts a no-break space after the currency code.
const text = (el: Element | null | undefined) => el?.textContent?.replace(/\u00a0/g, " ");
const stats = () => [...host.querySelectorAll(".ds-stat")].map(text);
function slide(value: number) {
  const input = host.querySelector('input[type="range"]') as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => { setter.call(input, String(value)); input.dispatchEvent(new Event("input", { bubbles: true })); });
}

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
    expect(stats()).toEqual(["Asking price3,250,000THB34 m²", "Monthly rent18,500THBTHB 222,000 a year", "Gross yield6.83%yearly rent ÷ price", "Gross payback4.4yrson 30% down"]);
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
    expect(stats()[0]).toBe("Asking price6,750,000THB124 m²");
    expect(stats()[2]).toBe("Gross yield6.40%yearly rent ÷ price");
    expect(host.querySelector(".ds-callout")?.textContent).toContain("Commercial frontage; higher upkeep.");
  });

  it("moves the down payment and the payback follows", () => {
    slide(50);
    expect(host.querySelector(".ds-field-row b")?.textContent).toBe("50%");
    expect(stats()[3]).toBe("Gross payback7.3yrson 50% down");
    expect(text(host.querySelector(".ds-rows .ds-row-value"))).toBe("THB 1,625,000");
  });
});
