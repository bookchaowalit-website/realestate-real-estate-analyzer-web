import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("home page", () => {
  it("renders the ledger with every sample record, the default scenario and the limits notice", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("yield line.");
    for (const name of ["North Pier Residence", "Soi Pradu House", "Station Room 08", "Market Court"]) expect(html).toContain(name);
    expect(html).toContain("6.83<!-- -->%");
    expect(html).toContain("DOWN PAYMENT <b>30<!-- -->%");
    expect(html).toContain("ignores vacancy, financing, fees, tax, and maintenance");
    expect(html).toContain("DEMO DATA · NO BROKER OR INVESTMENT ADVICE");
  });
});
