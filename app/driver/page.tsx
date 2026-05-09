import Link from "next/link";
import { apiServer } from "@/lib/api-server";
import type { Order, Paginated } from "@/lib/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { Eyebrow } from "@/components/shop/eyebrow";

export default async function DriverDashboard() {
  const res = await apiServer<Paginated<Order>>("/api/v1/driver/deliveries").catch(() => ({
    data: [],
    meta: { next_cursor: null, prev_cursor: null },
  }));

  const active = res.data.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled" && o.status !== "refunded",
  );
  const done = res.data.filter((o) => o.status === "delivered");

  return (
    <div>
      {/* Yellow stat strip */}
      <div className="rounded-3xl bg-yellow p-6 ring-2 ring-ink">
        <Eyebrow>Today</Eyebrow>
        <h1 className="mt-4 font-display text-[40px] font-bold leading-[1] tracking-tight text-ink">
          Your <span className="text-brand">runs.</span>
        </h1>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat n={active.length} label="Active" />
          <Stat n={done.length} label="Delivered" />
        </div>
      </div>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand">Active runs</h2>
        </div>
        <ul className="mt-4 space-y-3">
          {active.length === 0 ? (
            <li className="rounded-2xl bg-paper p-8 text-center ring-2 ring-ink/15">
              <p className="font-display text-[18px] font-bold text-ink">All clear.</p>
              <p className="mt-1 text-[12px] font-medium text-ink-muted">
                No active deliveries - sit tight.
              </p>
            </li>
          ) : null}
          {active.map((o) => (
            <li key={o.id}>
              <Link
                href={`/driver/deliveries/${o.id}`}
                className="block rounded-2xl bg-paper p-5 ring-2 ring-ink/15 transition-all hover:ring-ink active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-display text-[20px] font-bold text-ink">{o.reference}</div>
                    {o.address ? (
                      <div className="mt-2 text-[13px] font-medium leading-relaxed text-ink-soft">
                        {o.address.line1}
                        {o.address.line2 ? <>, {o.address.line2}</> : null}
                        <br />
                        <span className="number font-bold text-brand">{o.address.postcode}</span>
                        <span className="ml-1 text-ink-muted"> · {o.address.city}</span>
                      </div>
                    ) : null}
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t-2 border-ink/10 pt-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                    {o.items?.length ?? 0} {o.items?.length === 1 ? "item" : "items"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[12px] font-bold text-ink transition-colors group-hover:text-brand">
                    Open run <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {done.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink-muted">Completed today</h2>
          <ul className="mt-3 space-y-2">
            {done.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/driver/deliveries/${o.id}`}
                  className="flex items-center justify-between rounded-xl bg-paper px-4 py-3 text-[13px] opacity-75 ring-2 ring-ink/10 transition-opacity hover:opacity-100"
                >
                  <span className="font-display text-[15px] font-bold text-ink">{o.reference}</span>
                  <StatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl bg-ink p-4 text-paper">
      <div className="font-display text-[36px] font-bold leading-none text-yellow">{n}</div>
      <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-paper/70">{label}</div>
    </div>
  );
}
