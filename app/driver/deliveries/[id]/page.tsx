import Link from "next/link";
import { notFound } from "next/navigation";
import { apiServer, ApiRequestError } from "@/lib/api-server";
import type { Order } from "@/lib/types";
import { Money } from "@/components/ui/money";
import { StatusBadge } from "@/components/ui/status-badge";
import { DateTime } from "@/components/ui/datetime";
import { DeliveryActions } from "@/components/driver/delivery-actions";
import { MapPin, Phone, ShieldCheck } from "lucide-react";

type Params = Promise<{ id: string }>;

export default async function DeliveryDetail({ params }: { params: Params }) {
  const { id } = await params;
  let order: Order;
  try {
    order = (await apiServer<{ data: Order }>(`/api/v1/driver/deliveries/${id}`)).data;
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) return notFound();
    throw e;
  }

  const mapsQuery = order.address
    ? encodeURIComponent(`${order.address.line1}, ${order.address.city} ${order.address.postcode}`)
    : "";

  return (
    <div>
      <Link
        href="/driver"
        className="text-[12px] font-bold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-brand"
      >
        ← Runs
      </Link>

      <div className="mt-5 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand">Reference</div>
          <h1 className="mt-2 font-display text-[32px] font-bold leading-[1] tracking-tight text-ink">
            {order.reference}
          </h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Customer ID match card - age-restricted only */}
      {order.customer_id_card ? (
        <div className="mt-6 overflow-hidden rounded-2xl bg-yellow ring-2 ring-ink">
          <div className="flex items-center justify-between gap-3 border-b-2 border-ink px-5 py-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-ink" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
                Match the recipient · 18+
              </span>
            </div>
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-yellow capitalize">
              {order.customer_id_card.doc_type.replace(/_/g, " ")}
            </span>
          </div>
          <div className="bg-paper p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.customer_id_card.url}
              alt="Customer ID document"
              className="mx-auto max-h-72 w-auto rounded-xl object-contain ring-2 ring-ink/15"
            />
            <div className="mt-4 rounded-xl bg-ink p-4 text-paper">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow">Recipient</div>
              <div className="mt-1.5 font-display text-[20px] font-bold">
                {order.customer?.name ?? "-"}
              </div>
              <p className="mt-2 text-[12px] font-medium leading-relaxed text-paper/75">
                Confirm the photo, name and apparent age before handing over. Refuse delivery if unsure - log a reason in the note below.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {order.address ? (
        <div className="mt-3 rounded-2xl bg-paper p-5 ring-2 ring-ink/15">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Deliver to</div>
              <div className="mt-2.5 font-display text-[16px] font-bold leading-snug text-ink">
                {order.address.line1}
                {order.address.line2 ? <><br />{order.address.line2}</> : null}
                <br />
                {order.address.city},{" "}
                <span className="number font-bold text-brand">{order.address.postcode}</span>
              </div>
            </div>
            <a
              href={`https://maps.google.com/?q=${mapsQuery}`}
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-bold text-yellow transition-transform hover:-translate-y-0.5"
            >
              <MapPin className="h-4 w-4" /> Map
            </a>
          </div>
        </div>
      ) : null}

      {order.customer ? (
        <div className="mt-3 rounded-2xl bg-paper p-5 ring-2 ring-ink/15">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Customer</div>
              <div className="mt-2 font-display text-[18px] font-bold text-ink">{order.customer.name}</div>
              {order.customer.phone ? (
                <div className="mt-0.5 text-[13px] font-medium text-ink-soft">{order.customer.phone}</div>
              ) : null}
            </div>
            {order.customer.phone ? (
              <a
                href={`tel:${order.customer.phone}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-4 text-[13px] font-bold text-ink transition-colors hover:bg-yellow"
              >
                <Phone className="h-4 w-4" /> Call
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {order.delivery_window_start && order.delivery_window_end ? (
        <div className="mt-3 rounded-2xl bg-paper p-5 ring-2 ring-ink/15">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Delivery window</div>
          <div className="mt-2 font-display text-[16px] font-bold text-ink">
            <DateTime iso={order.delivery_window_start} mode="time" /> –{" "}
            <DateTime iso={order.delivery_window_end} mode="time" />
          </div>
        </div>
      ) : null}

      <div className="mt-3 rounded-2xl bg-paper p-5 ring-2 ring-ink/15">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Items</h2>
        <ul className="mt-3 space-y-2 text-[13px]">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span className="font-medium text-ink">
                <span className="font-display font-bold">{i.quantity}</span> × {i.name}
              </span>
              <Money pence={i.line_total_pence} className="font-bold text-ink" />
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t-2 border-ink/10 pt-3 text-[13px]">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Total</span>
          <Money pence={order.total_pence} className="font-display text-[22px] font-bold text-ink" />
        </div>
      </div>

      {order.customer_notes ? (
        <div className="mt-3 rounded-2xl bg-yellow p-5 ring-2 ring-ink">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Customer notes</div>
          <p className="mt-2 whitespace-pre-line text-[14px] font-medium leading-relaxed text-ink">
            {order.customer_notes}
          </p>
        </div>
      ) : null}

      <div className="mt-7">
        <DeliveryActions orderId={order.id} status={order.status} />
      </div>
    </div>
  );
}
