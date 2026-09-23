import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { BagDrawer } from "@/components/BagDrawer";
import { CartProvider } from "@/components/CartProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSiteUrl, printfulConfigured } from "@/lib/site";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#fafaf8",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Cotton Gym Wear",
    template: "%s — Cotton Gym Wear",
  },
  description:
    "Cotton Gym Wear, sold direct. Tees, tanks, and long sleeves in 100% cotton solids for lifting and light training. Ships to the UK and the US.",
  openGraph: {
    title: "Cotton Gym Wear",
    description: "100% cotton solids for lifting and gym-to-street. Ships to the UK and the US.",
    siteName: "Cotton Gym Wear",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={GeistSans.variable}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="page-shell">
          <CartProvider>
            <Header />
            <main id="main">{children}</main>
            <Footer fulfillment={printfulConfigured() ? "printful" : "sample"} />
            <BagDrawer />
          </CartProvider>
        </div>
      </body>
    </html>
  );
}
