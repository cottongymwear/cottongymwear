"use client";

import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";

export function ClearBag() {
  const { clear, ready } = useCart();
  const done = useRef(false);

  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    clear();
  }, [ready, clear]);

  return null;
}
