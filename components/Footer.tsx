import Link from "next/link";
import { Wordmark } from "./Wordmark";

export function Footer({ fulfillment }: { fulfillment: "printful" | "sample" }) {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Wordmark />
          <p>100% cotton gym wear. Printed to order and shipped to the United Kingdom and the United States.</p>
        </div>
        <nav aria-label="Shop">
          <p className="footer-title">Shop</p>
          <Link href="/shop">Shop all</Link>
          <Link href="/men">Men</Link>
          <Link href="/women">Women</Link>
        </nav>
        <nav aria-label="Information">
          <p className="footer-title">Info</p>
          <Link href="/about">About the cloth</Link>
          <Link href="/cart">Bag</Link>
          <Link href="/checkout">Checkout</Link>
        </nav>
      </div>
      <div className="shell footer-base">
        <span>© {new Date().getFullYear()} Cotton Gym Wear</span>
        <span>
          Prices in GBP ·{" "}
          {fulfillment === "printful" ? "Fulfilled by Printful" : "Preview catalog, Printful not yet connected"}
        </span>
      </div>
    </footer>
  );
}
