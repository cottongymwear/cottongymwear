"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { findVariant, formatGbp } from "@/lib/catalog";
import { BagLine } from "./BagLine";
import { useCart } from "./CartProvider";
import { BagIcon, CloseIcon } from "./Icons";

export function BagDrawer() {
  const { bagOpen, closeBag, lines, count, ready } = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  const detailed = useMemo(
    () =>
      lines.flatMap((line) => {
        const match = findVariant(line.sku);
        return match ? [{ ...line, ...match }] : [];
      }),
    [lines],
  );
  const subtotal = detailed.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (bagOpen && !node.open) node.showModal();
    if (!bagOpen && node.open) node.close();
  }, [bagOpen]);

  useEffect(() => {
    closeBag();
  }, [pathname, closeBag]);

  return (
    <dialog
      ref={dialog}
      className="drawer"
      aria-labelledby="bag-title"
      onClose={closeBag}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeBag();
      }}
    >
      <div className="drawer-panel">
        <div className="drawer-head">
          <h2 id="bag-title">
            Bag{ready && count ? <span className="drawer-count">{count}</span> : null}
          </h2>
          <button type="button" className="icon-btn" aria-label="Close bag" onClick={closeBag}>
            <CloseIcon size={22} />
          </button>
        </div>

        {detailed.length ? (
          <>
            <ul className="bag-lines drawer-body">
              {detailed.map((line) => (
                <BagLine
                  key={line.sku}
                  product={line.product}
                  variant={line.variant}
                  quantity={line.quantity}
                  onNavigate={closeBag}
                />
              ))}
            </ul>
            <div className="drawer-foot">
              <p className="total-row">
                <span>Subtotal</span>
                <strong>{formatGbp(subtotal)}</strong>
              </p>
              <p className="fine">Delivery to the UK or the US is calculated at checkout.</p>
              <Link className="btn btn--block" href="/checkout" onClick={closeBag}>
                Checkout
              </Link>
              <Link className="btn btn--secondary btn--block" href="/cart" onClick={closeBag}>
                View bag
              </Link>
            </div>
          </>
        ) : (
          <div className="empty-state drawer-empty">
            <span className="empty-icon">
              <BagIcon size={28} />
            </span>
            <p className="empty-title">Your bag is empty</p>
            <p className="muted">Tees, tanks, and long sleeves in 100% cotton.</p>
            <Link className="btn" href="/shop" onClick={closeBag}>
              Shop the rack
            </Link>
          </div>
        )}
      </div>
    </dialog>
  );
}
