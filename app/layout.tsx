import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// The font variable sits on <html>: the Dashboard shell tokens live on :root and read it from there.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rental Yield | Bookchaowalit",
  description: "Compare gross rental yield and payback for four sample Bangkok listings, and move the down payment. Synthetic data, not advice.",
  metadataBase: new URL("https://real-estate.bookchaowalit.com"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
