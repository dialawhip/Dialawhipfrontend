"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input, Label, Textarea, FieldError } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { useCart } from "@/lib/cart";
import { apiClient, ApiRequestError, randomIdempotencyKey } from "@/lib/api-client";
import type { Address, DeliveryTier, PricingResult, User } from "@/lib/types";
import { Eyebrow } from "@/components/shop/eyebrow";

const PRIORITY_AUTO_UPGRADE_PENCE = 15000;

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const subtotalPence = useCart((s) => s.subtotalPence());
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [tier, setTier] = useState<DeliveryTier>(
    subtotalPence >= PRIORITY_AUTO_UPGRADE_PENCE ? "priority" : "standard",
  );
  const [tierManuallySet, setTierManuallySet] = useState(false);
  const [statementAccepted, setStatementAccepted] = useState(false);
  const [n2oAccepted, setN2oAccepted] = useState(false);
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const [shopClosed, setShopClosed] = useState<{ message: string } | null>(null);
  const [newAddr, setNewAddr] = useState(false);
  const [addr, setAddr] = useState({ label: "Kitchen", line1: "", line2: "", city: "Newcastle upon Tyne", postcode: "" });

  const requiresId = pricing?.requires_id_verification ?? false;
  const isVerified = user?.verification_status === "verified";

  useEffect(() => {
    apiClient<{ data: User }>("/api/v1/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => setUser(null));

    apiClient<{ data: Address[] }>("/api/v1/me/addresses")
      .then((r) => {
        setAddresses(r.data);
        const def = r.data.find((a) => a.is_default) ?? r.data[0];
        if (def) setSelectedAddress(def.id);
        else setNewAddr(true);
      })
      .catch(() => setNewAddr(true));
  }, []);

  useEffect(() => {
    if (tierManuallySet) return;
    if (subtotalPence >= PRIORITY_AUTO_UPGRADE_PENCE && tier === "standard") {
      setTier("priority");
    } else if (subtotalPence < PRIORITY_AUTO_UPGRADE_PENCE && tier === "priority") {
      setTier("standard");
    }
  }, [subtotalPence, tier, tierManuallySet]);

  useEffect(() => {
    if (items.length === 0) return;
    const address = addresses.find((a) => a.id === selectedAddress);
    apiClient<{ data: PricingResult }>("/api/v1/checkout/preview", {
      method: "POST",
      json: {
        items: items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id ?? null,
          quantity: i.quantity,
          statement_category: i.statement_category ?? null,
        })),
        postcode: address?.postcode ?? null,
        delivery_tier: tier,
      },
    })
      .then((r) => { setPricing(r.data); setError(null); setShopClosed(null); })
      .catch((e: unknown) => {
        if (e instanceof ApiRequestError) {
          if (e.body.code === "shop_closed") {
            setShopClosed({ message: e.body.message || "We are not accepting orders right now." });
            setError(null);
          } else {
            setShopClosed(null);
            setError(e.body.message);
          }
        }
      });
  }, [items, addresses, selectedAddress, tier]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setError(null);

    if (requiresId && !isVerified) {
      setError("Please complete ID verification before ordering age-restricted items.");
      return;
    }
    if (requiresId && (!statementAccepted || !n2oAccepted)) {
      setError("Please accept the statement of use and N₂O agreement.");
      return;
    }

    setPending(true);
    try {
      let addressId = selectedAddress;
      if (newAddr) {
        const created = await apiClient<{ data: Address }>("/api/v1/me/addresses", {
          method: "POST",
          json: addr,
          idempotencyKey: randomIdempotencyKey(),
        });
        addressId = created.data.id;
      }
      const res = await apiClient<{ data: { checkout_url: string; stripe_session_id: string } }>(
        "/api/v1/checkout/session",
        {
          method: "POST",
          idempotencyKey: randomIdempotencyKey(),
          json: {
            items: items.map((i) => ({
              product_id: i.product_id,
              variant_id: i.variant_id ?? null,
              quantity: i.quantity,
              statement_category: i.statement_category ?? null,
            })),
            address_id: addressId,
            delivery_tier: tier,
            statement_of_use_accepted: statementAccepted,
            n2o_agreement_accepted: n2oAccepted,
            customer_notes: notes || null,
          },
        },
      );
      window.location.href = res.data.checkout_url;
    } catch (e: unknown) {
      if (e instanceof ApiRequestError) {
        if (e.body.code === "shop_closed") {
          setShopClosed({ message: e.body.message || "We are not accepting orders right now." });
          setError(null);
        } else {
          setErrors(e.body.errors ?? {});
          setError(e.body.message);
        }
      } else {
        setError("Unable to start checkout.");
      }
    } finally {
      setPending(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="rounded-3xl bg-yellow p-12 ring-2 ring-ink">
          <h1 className="font-display text-[44px] font-bold tracking-tight text-ink sm:text-[60px]">
            Your bag is empty.
          </h1>
          <Link
            href="/shop"
            className="mt-8 inline-flex h-13 items-center rounded-full bg-ink px-8 text-[14px] font-bold text-yellow transition-transform hover:-translate-y-0.5"
          >
            Browse the shop →
          </Link>
        </div>
      </div>
    );
  }

  const tierEtas = pricing?.service_area;
  const etaStd = tierEtas?.eta_standard_minutes ?? null;
  const etaPri = tierEtas?.eta_priority_minutes ?? null;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      <Eyebrow>Step 2 of 2</Eyebrow>
      <h1 className="mt-3 font-display text-[44px] font-bold leading-[1] tracking-tight text-ink sm:text-[60px]">
        Almost <span className="text-brand">there.</span>
      </h1>

      {shopClosed ? (
        <div className="mt-8 rounded-2xl bg-yellow p-5 ring-2 ring-ink" role="alert">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-yellow">!</span>
            <div>
              <strong className="block font-display text-[16px] font-bold text-ink">Shop is currently closed</strong>
              <span className="mt-1 block text-[13px] font-medium text-ink/80">{shopClosed.message}</span>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Section step="01" title="Where should we deliver?">
            {addresses.length > 0 && !newAddr ? (
              <div className="space-y-2.5">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl p-5 transition-all ${
                      selectedAddress === a.id
                        ? "bg-yellow ring-2 ring-ink"
                        : "bg-paper ring-2 ring-ink/15 hover:ring-ink/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="addr"
                      value={a.id}
                      checked={selectedAddress === a.id}
                      onChange={(e) => setSelectedAddress(e.target.value)}
                      className="mt-1 accent-brand"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-ink">{a.label ?? "Address"}</span>
                        {a.is_default ? <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Default</span> : null}
                      </div>
                      <div className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                        {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
                        {a.city}, {a.postcode}
                      </div>
                    </div>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setNewAddr(true)}
                  className="mt-2 text-[13px] font-semibold text-brand transition-colors hover:text-brand-deep"
                >
                  + Add new address
                </button>
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl bg-paper p-6 ring-2 ring-ink/15">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Label">
                    <Input value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} />
                  </Field>
                  <Field label="Postcode">
                    <Input value={addr.postcode} onChange={(e) => setAddr({ ...addr, postcode: e.target.value.toUpperCase() })} required />
                  </Field>
                </div>
                <Field label="Address line 1">
                  <Input value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} required />
                </Field>
                <Field label="Address line 2">
                  <Input value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} />
                </Field>
                <Field label="City">
                  <Input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} required />
                </Field>
                {addresses.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setNewAddr(false)}
                    className="text-[13px] font-semibold text-brand hover:text-brand-deep"
                  >
                    ← Choose existing
                  </button>
                ) : null}
              </div>
            )}
          </Section>

          <Section step="02" title="How fast?">
            {subtotalPence >= PRIORITY_AUTO_UPGRADE_PENCE ? (
              <div className="mb-3 rounded-lg border-2 border-brand/30 bg-brand/5 px-4 py-2.5 text-[12px] font-semibold text-brand">
                ✓ Priority delivery added free on orders over £150.
              </div>
            ) : null}
            <div className="grid gap-2.5 sm:grid-cols-3">
              <TierCard
                tier="standard"
                current={tier}
                onSelect={(t) => { setTierManuallySet(true); setTier(t); }}
                name="Standard"
                price={0}
                eta={etaStd ? `${etaStd} min` : "18–35 min"}
                blurb="Our default."
              />
              <TierCard
                tier="priority"
                current={tier}
                onSelect={(t) => { setTierManuallySet(true); setTier(t); }}
                name="Priority"
                price={subtotalPence >= PRIORITY_AUTO_UPGRADE_PENCE ? 0 : (tierEtas?.priority_fee_pence ?? 500)}
                eta={etaPri ? `${etaPri} min` : "10–20 min"}
                blurb={subtotalPence >= PRIORITY_AUTO_UPGRADE_PENCE ? "Free over £150." : "Jumps the queue."}
                highlighted
              />
              <TierCard
                tier="super"
                current={tier}
                onSelect={(t) => { setTierManuallySet(true); setTier(t); }}
                name="Super"
                price={tierEtas?.super_fee_pence ?? 1500}
                eta="8–15 min"
                blurb="Dedicated rider."
              />
            </div>
          </Section>

          {requiresId ? (
            <Section step="03" title="ID & compliance">
              <div className="space-y-4 rounded-2xl bg-paper p-6 ring-2 ring-ink/15">
                {!user ? (
                  <div className="rounded-lg bg-surface p-4 text-[13px] text-ink-soft">
                    Your bag contains age-restricted items.{" "}
                    <Link href="/login?next=/checkout" className="font-semibold text-brand underline underline-offset-2">Sign in</Link>
                    {" or "}
                    <Link href="/register" className="font-semibold text-brand underline underline-offset-2">register</Link>{" "}
                    to continue.
                  </div>
                ) : !isVerified ? (
                  <div className="rounded-lg border border-yellow/60 bg-yellow-soft p-4 text-[13px]">
                    <div className="font-bold text-ink">ID verification required</div>
                    <div className="mt-1 text-ink-soft">
                      Upload a government-issued ID once — approved inside ten minutes.{" "}
                      <Link href="/account/verification" className="font-semibold text-brand underline underline-offset-2">
                        Start verification →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg bg-success-soft px-4 py-3 text-success">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-success text-[12px] font-bold text-paper">✓</span>
                    <div className="text-[13px] font-semibold">Your account is verified</div>
                  </div>
                )}

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border hairline bg-surface/60 p-4 text-[13px] text-ink-soft">
                  <input
                    type="checkbox"
                    checked={statementAccepted}
                    onChange={(e) => setStatementAccepted(e.target.checked)}
                    className="mt-1 accent-brand"
                  />
                  <span>
                    <strong className="text-ink">Statement of use.</strong> I confirm I am purchasing these products
                    exclusively for use in the preparation of food and beverages. I am 18 or older. I will not
                    consume, inhale, resell or otherwise misuse the product.
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border hairline bg-surface/60 p-4 text-[13px] text-ink-soft">
                  <input
                    type="checkbox"
                    checked={n2oAccepted}
                    onChange={(e) => setN2oAccepted(e.target.checked)}
                    className="mt-1 accent-brand"
                  />
                  <span>
                    I have read and agree to the{" "}
                    <Link href="/legal/n2o-agreement" target="_blank" className="font-semibold text-brand underline underline-offset-2">
                      N₂O chargers agreement
                    </Link>{" "}
                    and accept its binding terms.
                  </span>
                </label>
              </div>
            </Section>
          ) : null}

          <Section step={requiresId ? "04" : "03"} title="Anything we should know?">
            <div className="rounded-2xl bg-paper p-6 ring-2 ring-ink/15">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate codes, buzzer details, doorman instructions…" />
            </div>
          </Section>

          {error ? (
            <div className="rounded-2xl bg-danger-soft p-4 text-[13px] font-medium text-danger ring-1 ring-danger/30">
              {error}
            </div>
          ) : null}
        </div>

        <aside className="h-fit space-y-5 lg:sticky lg:top-24">
          <div className="rounded-2xl bg-paper p-6 ring-2 ring-ink">
            <h2 className="font-display text-[20px] font-bold text-ink">Your order</h2>
            <ul className="mt-5 space-y-3 text-[13px]">
              {items.map((i) => (
                <li key={`${i.product_id}::${i.variant_id ?? ""}`} className="space-y-0.5">
                  <div className="flex justify-between gap-4">
                    <span className="font-medium text-ink-soft">
                      <span className="font-display font-bold text-ink">{i.quantity} ×</span> {i.name}
                      {i.variant_label ? (
                        <span className="ml-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">· {i.variant_label}</span>
                      ) : null}
                    </span>
                    <Money pence={i.unit_price_pence * i.quantity} className="shrink-0 font-bold text-ink" />
                  </div>
                  {i.statement_category ? (
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                      Use · {i.statement_category}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-2 border-t-2 border-ink/10 pt-5 text-[13px]">
              <Row label="Subtotal"><Money pence={pricing?.subtotal_pence ?? 0} /></Row>
              <Row label={`Delivery (${tier})`}><Money pence={pricing?.delivery_fee_pence ?? 0} /></Row>
              {pricing && pricing.vat_pence > 0 ? <Row label="VAT"><Money pence={pricing.vat_pence} /></Row> : null}
            </div>

            <div className="mt-5 flex items-baseline justify-between border-t-2 border-ink/15 pt-5">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Total</span>
              <Money pence={pricing?.total_pence ?? 0} className="font-display text-[32px] font-bold text-ink" />
            </div>

            <button
              type="submit"
              disabled={pending || !pricing || !!shopClosed || (requiresId && !isVerified)}
              className="mt-6 inline-flex h-13 w-full items-center justify-center rounded-full bg-ink px-6 text-[14px] font-bold text-yellow transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {pending
                ? "Starting secure checkout…"
                : shopClosed
                ? "Shop closed — try again later"
                : "Pay securely →"}
            </button>
            <p className="mt-3 text-center text-[11px] font-medium text-ink-muted">
              Powered by Stripe · Klarna · Apple Pay · Cash on delivery
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function TierCard({
  tier, current, onSelect, name, price, eta, blurb, highlighted,
}: {
  tier: DeliveryTier;
  current: DeliveryTier;
  onSelect: (t: DeliveryTier) => void;
  name: string;
  price: number;
  eta: string;
  blurb: string;
  highlighted?: boolean;
}) {
  const active = current === tier;
  return (
    <button
      type="button"
      onClick={() => onSelect(tier)}
      className={`relative rounded-2xl p-5 text-left transition-all ${
        active
          ? "bg-yellow ring-2 ring-ink"
          : "bg-paper ring-2 ring-ink/15 hover:ring-ink/40"
      }`}
    >
      {highlighted && !active ? (
        <span className="absolute -top-3 left-5 rounded-full bg-ink px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-yellow">
          Popular
        </span>
      ) : null}
      <div className="flex items-baseline justify-between">
        <span className="font-display text-[18px] font-bold text-ink">{name}</span>
        <span className="text-[13px] font-bold text-brand">
          {price === 0 ? "Free" : <>+<Money pence={price} /></>}
        </span>
      </div>
      <div className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/60">
        {eta}
      </div>
      <p className="mt-3 text-[12px] font-medium leading-relaxed text-ink-muted">{blurb}</p>
    </button>
  );
}

function Section({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-4">
        <span className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-yellow">
          № {step}
        </span>
        <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink">{children}</span>
    </div>
  );
}
