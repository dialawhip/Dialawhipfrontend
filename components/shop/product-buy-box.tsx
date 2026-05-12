"use client";

import { useMemo, useState } from "react";
import { useCart, type CartItem } from "@/lib/cart";
import { Minus, Plus } from "lucide-react";
import { Money } from "@/components/ui/money";
import type { Product, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/cn";
import { effectivePricePence, isOnSale } from "@/lib/sale-price";

type BaseItem = Omit<CartItem, "quantity" | "variant_id" | "variant_label" | "unit_price_pence" | "statement_category">;

const STATEMENT_CATEGORIES = [
  "Catering Use",
  "Catering / Single Event",
  "Catering / Multiple Event",
  "Home Use / Baking / Cooking",
  "Cafe / Business Use",
  "Restaurant / Business Use",
  "Bar / Business Use",
  "Erotic Use",
  "Other",
] as const;

export function ProductBuyBox({ product, base }: { product: Product; base: BaseItem }) {
  const variants: ProductVariant[] = useMemo(
    () => (product.variants ?? []).filter((v) => v.is_active).slice().sort((a, b) => a.sort_order - b.sort_order || a.price_pence - b.price_pence),
    [product.variants],
  );

  const [selectedId, setSelectedId] = useState<string | null>(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [statementCategory, setStatementCategory] = useState<string>("");
  const [showStatementError, setShowStatementError] = useState(false);
  const add = useCart((s) => s.add);

  const selected = selectedId ? variants.find((v) => v.id === selectedId) ?? null : null;
  const sourcePriceable = selected ?? product;
  const listPrice = sourcePriceable.price_pence;
  const unitPrice = effectivePricePence(sourcePriceable);
  const onSale = isOnSale(sourcePriceable);
  const lineTotal = unitPrice * qty;

  function onAdd() {
    if (!statementCategory) {
      setShowStatementError(true);
      return;
    }
    const cartItem: Omit<CartItem, "quantity"> = {
      ...base,
      unit_price_pence: unitPrice,
      variant_id: selected?.id ?? null,
      variant_label: selected?.label ?? null,
      statement_category: statementCategory,
    };
    add(cartItem, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-5">
      {variants.length > 0 ? (
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted">
            Pick an option
          </div>
          <div className="mt-3 grid gap-2.5">
            {variants.map((v) => {
              const isActive = v.id === selectedId;
              const outOfStock = typeof v.stock_count === "number" && v.stock_count <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => setSelectedId(v.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50",
                    isActive
                      ? "border-brand bg-paper shadow-[0_4px_14px_-8px_rgba(0,79,176,0.35)]"
                      : "hairline bg-paper hover:border-ink/25",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                        isActive ? "border-brand bg-brand" : "border-ink/25 bg-paper",
                      )}
                    >
                      {isActive ? <span className="h-2 w-2 rounded-full bg-paper" /> : null}
                    </span>
                    <div>
                      <div className="text-[15px] font-bold text-ink">{v.label}</div>
                      <div className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                        {v.qty_multiplier > 1 ? `${v.qty_multiplier} units` : "Single unit"}
                        {outOfStock ? " · Out of stock" : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    {isOnSale(v) ? (
                      <>
                        <Money pence={v.sale_price_pence as number} className="text-[18px] font-extrabold text-[#c10b0b]" />
                        <Money pence={v.price_pence} className="text-[12px] text-ink-muted line-through decoration-ink-muted/60" />
                      </>
                    ) : (
                      <Money pence={v.price_pence} className="text-[18px] font-extrabold text-ink" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div>
        <label
          htmlFor="statement-of-use"
          className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted"
        >
          Statement of Use
        </label>
        <div className="relative mt-3">
          <select
            id="statement-of-use"
            value={statementCategory}
            onChange={(e) => {
              setStatementCategory(e.target.value);
              if (e.target.value) setShowStatementError(false);
            }}
            className={cn(
              "block w-full appearance-none rounded-2xl border bg-paper px-4 py-3 pr-10 text-[15px] font-bold text-ink outline-none transition-colors focus:border-brand",
              showStatementError ? "border-danger" : "hairline",
            )}
          >
            <option value="">Please choose</option>
            {STATEMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-ink-soft"
          >
            ▾
          </span>
        </div>
        {showStatementError ? (
          <p className="mt-2 text-[12px] font-semibold text-danger">
            Please choose a statement of use.
          </p>
        ) : null}
      </div>

      <div className="flex items-stretch gap-2 sm:gap-3">
        <div className="flex h-12 shrink-0 items-center rounded-full border hairline bg-paper">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-12 w-10 items-center justify-center text-ink-soft transition-colors hover:text-brand sm:w-12"
            aria-label="Decrease"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-7 text-center text-[15px] font-bold tabular-nums sm:w-8">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="flex h-12 w-10 items-center justify-center text-ink-soft transition-colors hover:text-brand sm:w-12"
            aria-label="Increase"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-navy px-3 text-[13px] font-semibold text-paper transition-colors hover:bg-brand sm:gap-2 sm:px-7 sm:text-[14px]"
        >
          {added ? (
            <span>Added to bag ✓</span>
          ) : (
            <>
              <span className="truncate">Add {qty} to bag</span>
              <span className="opacity-70">·</span>
              {onSale ? (
                <span className="flex items-baseline gap-1.5">
                  <span className="font-extrabold">£{(lineTotal / 100).toFixed(2)}</span>
                  <span className="text-[11px] text-paper/60 line-through">£{((listPrice * qty) / 100).toFixed(2)}</span>
                </span>
              ) : (
                <span className="font-extrabold">£{(lineTotal / 100).toFixed(2)}</span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
