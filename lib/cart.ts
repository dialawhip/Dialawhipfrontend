"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  product_id: string;
  /** Optional variant id. If set, the line is keyed by product_id + variant_id. */
  variant_id?: string | null;
  /** Human-readable variant label, e.g. "2 tanks for £80". */
  variant_label?: string | null;
  slug: string;
  name: string;
  unit_price_pence: number;
  image_url: string | null;
  quantity: number;
  /** Buyer-declared category for the Statement of Use. */
  statement_category?: string | null;
}

interface CartState {
  items: CartItem[];
  postcode: string;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (product_id: string, variant_id?: string | null) => void;
  setQuantity: (product_id: string, quantity: number, variant_id?: string | null) => void;
  setPostcode: (postcode: string) => void;
  clear: () => void;
  subtotalPence: () => number;
  count: () => number;
}

/** Combined line key so a single product can exist with multiple variants in the cart. */
function lineKey(productId: string, variantId?: string | null): string {
  return variantId ? `${productId}::${variantId}` : productId;
}
function sameLine(a: CartItem, productId: string, variantId?: string | null): boolean {
  return lineKey(a.product_id, a.variant_id ?? null) === lineKey(productId, variantId ?? null);
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      postcode: "",
      add: (item, qty = 1) => {
        const existing = get().items.find((i) => sameLine(i, item.product_id, item.variant_id ?? null));
        if (existing) {
          set({
            items: get().items.map((i) =>
              sameLine(i, item.product_id, item.variant_id ?? null)
                ? { ...i, quantity: i.quantity + qty }
                : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: qty, variant_id: item.variant_id ?? null, variant_label: item.variant_label ?? null }] });
        }
      },
      remove: (id, variantId = null) =>
        set({ items: get().items.filter((i) => !sameLine(i, id, variantId)) }),
      setQuantity: (id, q, variantId = null) =>
        set({
          items: q <= 0
            ? get().items.filter((i) => !sameLine(i, id, variantId))
            : get().items.map((i) => (sameLine(i, id, variantId) ? { ...i, quantity: q } : i)),
        }),
      setPostcode: (postcode) => set({ postcode }),
      clear: () => set({ items: [], postcode: "" }),
      subtotalPence: () => get().items.reduce((s, i) => s + i.unit_price_pence * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: "catering-cart", storage: createJSONStorage(() => localStorage) },
  ),
);
