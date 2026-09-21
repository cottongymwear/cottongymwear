import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/CartProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSiteUrl, printfulConfigured } from "@/lib/site";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#fbfbf9",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Cotton Gym Wear",
    template: "%s — Cotton Gym Wear",
  },
  description:
    "Cotton gym wear, sold direct. Tees and tanks in 100% cotton solids for lifting and light training. Ships to the UK and the US.",
  openGraph: {
    title: "Cotton Gym Wear",
    description: "100% cotton solids for lifting and gym-to-street. Ships to the UK and the US.",
    siteName: "Cotton Gym Wear",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="page-shell">
          <CartProvider>
            <Header />
            <main id="main">{children}</main>
            <Footer fulfillment={printfulConfigured() ? "printful" : "sample"} />
          </CartProvider>
        </div>
      </body>
    </html>
  );
}
