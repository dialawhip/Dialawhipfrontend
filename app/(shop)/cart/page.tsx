"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { Money } from "@/components/ui/money";
import { Input, Label } from "@/components/ui/input";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import { Trash2, Minus, Plus } from "lucide-react";
import type { PricingResult } from "@/lib/types";
import { Eyebrow } from "@/components/shop/eyebrow";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const postcode = useCart((s) => s.postcode);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const setPostcode = useCart((s) => s.setPostcode);
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shopClosed, setShopClosed] = useState<{ message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setPricing(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    apiClient<{ data: PricingResult }>("/api/v1/checkout/preview", {
      method: "POST",
      json: {
        items: items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id ?? null,
          quantity: i.quantity,
          statement_category: i.statement_category ?? null,
        })),
        postcode: postcode || null,
      },
      signal: ctrl.signal,
    })
      .then((r) => {
        if (ctrl.signal.aborted) return;
        setPricing(r.data); setError(null); setShopClosed(null);
      })
      .catch((e: unknown) => {
        // React strict-mode runs effects twice in dev; the cleanup aborts the
        // first fetch. Treat any abort as a no-op so it never surfaces.
        if (ctrl.signal.aborted) return;
        if (e instanceof ApiRequestError) {
          if (e.body.code === "shop_closed") {
            setShopClosed({ message: e.body.message || "We are not accepting orders right now." });
            setError(null);
          } else {
            setShopClosed(null);
            setError(e.body.message);
          }
        } else {
          setError("Could not price cart.");
        }
      })
      .finally(() => {
        if (ctrl.signal.aborted) return;
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [items, postcode]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 sm:py-24">
        <div className="rounded-3xl bg-yellow p-6 ring-2 ring-ink sm:p-12">
          <Eyebrow className="justify-center">Your bag</Eyebrow>
          <h1 className="mt-5 font-display text-[32px] font-bold tracking-tight text-ink sm:text-[60px]">
            Nothing here yet.
          </h1>
          <p className="mt-4 text-[14px] font-medium leading-relaxed text-ink/80 sm:text-[15px]">
            Your bag is empty. Pick something from the catalogue.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex h-13 items-center rounded-full bg-ink px-6 text-[13px] font-bold text-yellow transition-transform hover:-translate-y-0.5 sm:px-8 sm:text-[14px]"
          >
            Browse the catalogue →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-14">
      <Eyebrow>Your bag</Eyebrow>
      <h1 className="mt-4 font-display text-[32px] font-bold leading-[1.05] tracking-tight text-ink sm:text-[60px] sm:leading-[1]">
        Let&rsquo;s go over your order.
      </h1>

      {shopClosed ? (
        <div className="mt-6 rounded-2xl bg-yellow p-4 ring-2 ring-ink sm:mt-8 sm:p-5" role="alert">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-yellow">!</span>
            <div>
              <strong className="block font-display text-[16px] font-bold text-ink">Shop is currently closed</strong>
              <span className="mt-1 block text-[13px] font-medium text-ink/80">{shopClosed.message}</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 sm:mt-10 sm:gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="overflow-hidden rounded-2xl bg-paper ring-2 ring-ink/15">
          {items.map((i, idx) => (
            <li
              key={`${i.product_id}::${i.variant_id ?? ""}`}
              className={
                "p-4 sm:flex sm:items-center sm:gap-5 sm:p-5 " +
                (idx > 0 ? "border-t-2 border-ink/10" : "")
              }
            >
              <div className="flex items-start gap-4 sm:contents">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-yellow ring-2 ring-ink sm:h-20 sm:w-20">
                  <span className="font-display text-[16px] font-bold text-ink sm:text-[18px]">
                    {i.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${i.slug}`} className="block break-words font-display text-[15px] font-bold leading-tight text-ink hover:text-brand sm:text-[17px]">
                    {i.name}
                  </Link>
                  {i.variant_label ? (
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand sm:text-[11px]">
                      {i.variant_label}
                    </div>
                  ) : null}
                  <div className="mt-1 text-[12px] font-medium text-ink-muted sm:text-[13px]">
                    <Money pence={i.unit_price_pence} /> {i.variant_id ? "each" : "per item"}
                  </div>
                </div>
                <button
                  onClick={() => remove(i.product_id, i.variant_id ?? null)}
                  className="shrink-0 p-1 text-ink-muted transition-colors hover:text-danger sm:hidden"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 sm:mt-0 sm:contents">
                <div className="flex h-10 items-center rounded-full border-2 border-ink bg-paper">
                  <button
                    className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:bg-yellow"
                    onClick={() => setQuantity(i.product_id, i.quantity - 1, i.variant_id ?? null)}
                    aria-label="Decrease"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-7 text-center font-display text-[15px] font-bold tabular-nums">{i.quantity}</span>
                  <button
                    className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:bg-yellow"
                    onClick={() => setQuantity(i.product_id, i.quantity + 1, i.variant_id ?? null)}
                    aria-label="Increase"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Money pence={i.unit_price_pence * i.quantity} className="text-right font-display text-[16px] font-bold text-ink sm:w-20 sm:text-[17px]" />
                <button
                  onClick={() => remove(i.product_id, i.variant_id ?? null)}
                  className="hidden text-ink-muted transition-colors hover:text-danger sm:block"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-4">
          <div className="rounded-2xl bg-paper p-5 ring-2 ring-ink sm:p-6">
            <h2 className="font-display text-[20px] font-bold text-ink">Order summary</h2>

            <div className="mt-5 space-y-2">
              <Label htmlFor="postcode">Delivery postcode</Label>
              <Input
                id="postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                placeholder="NE1 4AB"
              />
              <p className="text-[12px] font-medium text-ink-muted">We&rsquo;ll check this postcode is in our delivery area.</p>
            </div>

            <div className="mt-6 space-y-2.5 text-[14px]">
              <Row label="Subtotal">
                <Money pence={pricing?.subtotal_pence ?? items.reduce((s, i) => s + i.unit_price_pence * i.quantity, 0)} />
              </Row>
              <Row label="Delivery">
                <Money pence={pricing?.delivery_fee_pence ?? 0} />
              </Row>
              {pricing && pricing.vat_pence > 0 ? (
                <Row label="VAT">
                  <Money pence={pricing.vat_pence} />
                </Row>
              ) : null}
            </div>

            <div className="mt-5 flex items-baseline justify-between border-t-2 border-ink/15 pt-5">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Total</span>
              <Money
                pence={pricing?.total_pence ?? items.reduce((s, i) => s + i.unit_price_pence * i.quantity, 0)}
                className="font-display text-[32px] font-bold text-ink"
              />
            </div>

            {error ? (
              <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2.5 text-[13px] font-medium text-danger ring-1 ring-danger/30">{error}</p>
            ) : null}
            {loading ? <p className="mt-4 text-[12px] font-medium text-ink-muted">Pricing…</p> : null}

            {shopClosed ? (
              <button
                type="button"
                disabled
                className="mt-6 inline-flex h-13 w-full cursor-not-allowed items-center justify-center rounded-full bg-stone-soft px-6 text-[13px] font-bold text-ink-muted"
              >
                Shop closed - try again later
              </button>
            ) : (
              <Link
                href="/checkout"
                className="mt-6 inline-flex h-13 w-full items-center justify-center rounded-full bg-ink px-6 text-[14px] font-bold text-yellow transition-transform hover:-translate-y-0.5 aria-disabled:opacity-50"
                aria-disabled={!pricing || !!error}
              >
                Continue to checkout →
              </Link>
            )}
          </div>

          <div className="rounded-2xl bg-yellow p-5 text-[12px] font-medium leading-relaxed text-ink ring-2 ring-ink">
            <strong className="block text-[11px] font-bold uppercase tracking-[0.16em] text-brand">A note</strong>
            <span className="mt-1 block">Orders require 24 hours&rsquo; notice. You&rsquo;ll pick your delivery window at checkout.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between font-medium">
      <span className="text-ink-muted">{label}</span>
      <span className="font-bold text-ink">{children}</span>
    </div>
  );
}
