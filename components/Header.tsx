"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { Wordmark } from "./Wordmark";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const cartLabel = ready && count > 0 ? `Bag, ${count} items` : "Bag";

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Wordmark />
        <nav className="nav" aria-label="Primary">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/cart" aria-current={pathname === "/cart" ? "page" : undefined} aria-label={cartLabel}>
            Bag{ready && count > 0 ? ` (${count})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}
