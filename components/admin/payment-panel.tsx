"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiRequestError, randomIdempotencyKey } from "@/lib/api-client";
import { Money } from "@/components/ui/money";
import type { OrderPayment } from "@/lib/types";

const BRAND_LABEL: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  jcb: "JCB",
  diners: "Diners Club",
  unionpay: "UnionPay",
  unknown: "Card",
};

export function PaymentPanel({
  orderId,
  payment,
}: {
  orderId: string;
  payment?: OrderPayment | null;
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!payment) {
    return (
      <div className="rounded-lg border hairline bg-paper p-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Payment</div>
        <p className="mt-3 text-[13px] italic text-ink-muted">No payment data on this order.</p>
      </div>
    );
  }

  const status = payment.status;
  const tone =
    status === "paid"
      ? { bg: "bg-[#DCE6DB]", text: "text-forest-deep", ring: "ring-moss/40", label: "Paid" }
      : status === "refunded"
      ? { bg: "bg-cream-deep", text: "text-ink-muted", ring: "ring-line", label: "Refunded" }
      : { bg: "bg-[#F3D4CC]", text: "text-[#8B2A1D]", ring: "ring-[#C87863]/40", label: "Unpaid" };

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      await apiClient(`/api/v1/admin/orders/${orderId}/payment/refresh`, {
        method: "POST",
        idempotencyKey: randomIdempotencyKey(),
      });
      router.refresh();
    } catch (e) {
      if (e instanceof ApiRequestError) setError(e.body.message);
      else setError("Failed to refresh.");
    } finally {
      setRefreshing(false);
    }
  }

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 1500);
    } catch {
      // ignore
    }
  }

  const brand = payment.card_brand ? BRAND_LABEL[payment.card_brand.toLowerCase()] ?? capitalise(payment.card_brand) : null;
  const currency = (payment.currency ?? "GBP").toUpperCase();

  return (
    <div className="rounded-lg border hairline bg-paper">
      <div className="flex items-start justify-between gap-3 border-b hairline px-6 py-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Payment</div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ring-1 ring-inset ${tone.bg} ${tone.text} ${tone.ring}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {tone.label}
            </span>
            <span className="text-[11px] text-ink-muted">via Stripe</span>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex h-8 items-center rounded-full border hairline bg-paper px-3 text-[11px] font-medium text-ink-soft transition-colors hover:border-forest hover:text-forest disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-px bg-line">
        <Cell label="Amount paid">
          {payment.amount_paid_pence !== null ? (
            <span className="font-display text-[18px] text-forest">
              <Money pence={payment.amount_paid_pence} /> {currency}
            </span>
          ) : (
            "—"
          )}
        </Cell>
        <Cell label="Paid at">{payment.paid_at ? formatDateTime(payment.paid_at) : "—"}</Cell>
        <Cell label="Method">
          {brand ? (
            <span className="inline-flex items-center gap-2">
              <CardGlyph brand={payment.card_brand ?? ""} />
              <span className="font-medium text-ink">{brand}</span>
              {payment.card_last4 ? <span className="number text-ink-muted">···· {payment.card_last4}</span> : null}
            </span>
          ) : payment.method ? (
            <span className="capitalize">{payment.method}</span>
          ) : (
            "—"
          )}
        </Cell>
        <Cell label="Currency">{currency}</Cell>

        {payment.is_refunded ? (
          <>
            <Cell label="Refunded">
              {payment.amount_refunded_pence !== null ? (
                <span className="font-display text-[16px] text-ink">
                  <Money pence={payment.amount_refunded_pence} /> {currency}
                </span>
              ) : (
                "—"
              )}
            </Cell>
            <Cell label="Refunded at">{payment.refunded_at ? formatDateTime(payment.refunded_at) : "—"}</Cell>
          </>
        ) : null}
      </dl>

      <div className="space-y-2.5 px-6 py-5 text-[12px]">
        <IdRow label="Stripe session" value={payment.stripe_session_id} onCopy={copy} copied={copied === "session"} copyKey="session" />
        <IdRow label="Payment intent" value={payment.stripe_payment_intent_id} onCopy={copy} copied={copied === "pi"} copyKey="pi" />
        <IdRow label="Charge" value={payment.stripe_charge_id} onCopy={copy} copied={copied === "charge"} copyKey="charge" />
        <IdRow label="Transaction" value={payment.stripe_balance_transaction_id} onCopy={copy} copied={copied === "txn"} copyKey="txn" />
        {payment.refund_id ? (
          <IdRow label="Refund" value={payment.refund_id} onCopy={copy} copied={copied === "refund"} copyKey="refund" />
        ) : null}
      </div>

      {payment.receipt_url ? (
        <div className="border-t hairline bg-cream-deep/40 px-6 py-3 text-[12px]">
          <a
            href={payment.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-forest underline-offset-4 hover:text-forest-deep hover:underline"
          >
            View Stripe receipt →
          </a>
        </div>
      ) : null}

      {error ? <p className="border-t hairline px-6 py-2 text-[11px] text-[#8B2A1D]">{error}</p> : null}
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper px-6 py-4">
      <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">{label}</dt>
      <dd className="mt-1 text-[13px] text-ink">{children}</dd>
    </div>
  );
}

function IdRow({
  label, value, onCopy, copied, copyKey,
}: {
  label: string;
  value: string | null;
  onCopy: (v: string, k: string) => void;
  copied: boolean;
  copyKey: string;
}) {
  if (!value) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</span>
        <span className="text-ink-muted/60">—</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-2">
        <code className="truncate rounded bg-cream-deep px-2 py-0.5 font-mono text-[11px] text-ink">{value}</code>
        <button
          type="button"
          onClick={() => onCopy(value, copyKey)}
          className="text-[11px] font-medium text-forest transition-colors hover:text-forest-deep"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </span>
    </div>
  );
}

function CardGlyph({ brand }: { brand: string }) {
  // Tiny inline brand chip — no external icon library required.
  const b = brand.toLowerCase();
  const palette: Record<string, string> = {
    visa: "#1a1f71",
    mastercard: "#eb001b",
    amex: "#2e77bb",
    discover: "#ff6000",
    jcb: "#0e4c96",
    diners: "#0079be",
    unionpay: "#01798a",
  };
  const colour = palette[b] ?? "#0B1D3A";
  return (
    <span
      className="inline-flex h-6 w-9 items-center justify-center rounded text-[9px] font-bold tracking-tight text-white"
      style={{ backgroundColor: colour }}
      aria-hidden
    >
      {brand.slice(0, 4).toUpperCase()}
    </span>
  );
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
