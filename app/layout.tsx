import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yield Line — Property Decision Desk",
  description: "A synthetic property ledger for comparing yield, cash, and payback.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
