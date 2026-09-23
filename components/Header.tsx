"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { BagIcon, CloseIcon, MenuIcon } from "./Icons";
import { Wordmark } from "./Wordmark";

const LINKS = [
  { href: "/shop", label: "Shop all" },
  { href: "/men", label: "Men" },
  { href: "/women", label: "Women" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const { count, ready, openBag } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  const bagCount = ready ? count : 0;

  useEffect(() => {
    const node = menu.current;
    if (!node) return;
    if (menuOpen && !node.open) node.showModal();
    if (!menuOpen && node.open) node.close();
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <button
          type="button"
          className="icon-btn header-menu"
          aria-label="Open menu"
          aria-haspopup="dialog"
          onClick={() => setMenuOpen(true)}
        >
          <MenuIcon size={22} />
        </button>
        <Wordmark />
        <nav className="nav" aria-label="Primary">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="icon-btn bag-btn"
          onClick={openBag}
          aria-haspopup="dialog"
          aria-label={bagCount ? `Bag, ${bagCount} ${bagCount === 1 ? "item" : "items"}` : "Bag, empty"}
        >
          <BagIcon size={22} />
          {bagCount ? <span className="bag-count">{bagCount}</span> : null}
        </button>
      </div>

      <dialog
        ref={menu}
        className="sheet"
        aria-label="Menu"
        onClose={() => setMenuOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setMenuOpen(false);
        }}
      >
        <div className="sheet-panel">
          <div className="sheet-head">
            <Wordmark onClick={() => setMenuOpen(false)} />
            <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
              <CloseIcon size={22} />
            </button>
          </div>
          <nav className="sheet-nav" aria-label="Menu">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="sheet-foot">100% cotton solids. Printed to order. Ships to the UK and the US.</p>
        </div>
      </dialog>
    </header>
  );
}
