"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "cgw-cart-v1";

export type CartLine = { sku: string; quantity: number };

type CartContextValue = {
  ready: boolean;
  lines: CartLine[];
  count: number;
  add: (sku: string, quantity?: number) => void;
  setQuantity: (sku: string, quantity: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  bagOpen: boolean;
  openBag: () => void;
  closeBag: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function sanitize(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const merged = new Map<string, number>();
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const sku = "sku" in entry && typeof entry.sku === "string" ? entry.sku : "";
    const quantity = "quantity" in entry ? Number(entry.quantity) : 0;
    if (!sku || !Number.isInteger(quantity) || quantity < 1) continue;
    merged.set(sku, Math.min(8, (merged.get(sku) ?? 0) + quantity));
  }
  return [...merged.entries()].map(([sku, quantity]) => ({ sku, quantity }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setLines(sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")));
    } catch {
      setLines([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const add = useCallback((sku: string, quantity = 1) => {
    setLines((current) => {
      const next = current.map((line) => ({ ...line }));
      const existing = next.find((line) => line.sku === sku);
      if (existing) existing.quantity = Math.min(8, existing.quantity + quantity);
      else next.push({ sku, quantity: Math.min(8, quantity) });
      return next;
    });
  }, []);

  const setQuantity = useCallback((sku: string, quantity: number) => {
    setLines((current) =>
      quantity < 1
        ? current.filter((line) => line.sku !== sku)
        : current.map((line) =>
            line.sku === sku ? { ...line, quantity: Math.min(8, quantity) } : line,
          ),
    );
  }, []);

  const remove = useCallback((sku: string) => {
    setLines((current) => current.filter((line) => line.sku !== sku));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const [bagOpen, setBagOpen] = useState(false);
  const openBag = useCallback(() => setBagOpen(true), []);
  const closeBag = useCallback(() => setBagOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    return { ready, lines, count, add, setQuantity, remove, clear, bagOpen, openBag, closeBag };
  }, [lines, ready, add, setQuantity, remove, clear, bagOpen, openBag, closeBag]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
