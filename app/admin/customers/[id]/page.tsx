import Link from "next/link";
import { notFound } from "next/navigation";
import { apiServer, ApiRequestError } from "@/lib/api-server";
import type { Order, User } from "@/lib/types";
import { Money } from "@/components/ui/money";
import { StatusBadge } from "@/components/ui/status-badge";
import { DateTime } from "@/components/ui/datetime";
import { Eyebrow } from "@/components/shop/eyebrow";
import { CustomerDeleteButton } from "@/components/admin/customer-delete-button";

type Params = Promise<{ id: string }>;

export default async function CustomerDetail({ params }: { params: Params }) {
  const { id } = await params;
  let data: { customer: User; orders: Order[]; lifetime_pence: number };
  try {
    const res = await apiServer<{ data: { customer: User; orders: Order[]; lifetime_pence: number } }>(`/api/v1/admin/customers/${id}`);
    data = res.data;
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) return notFound();
    throw e;
  }

  return (
    <div className="mx-auto max-w-[1280px] px-10 py-10">
      <Link href="/admin/customers" className="text-[12px] font-medium uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-forest">
        ← Customers
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr]">
        <aside className="h-fit rounded-lg border hairline bg-paper p-6">
          <Eyebrow>Profile</Eyebrow>
          <h1 className="mt-4 font-display text-[28px] leading-tight text-ink">{data.customer.name}</h1>
          <p className="mt-1 text-[13px] text-ink-muted">{data.customer.email}</p>
          {data.customer.phone ? <p className="text-[13px] text-ink-muted">{data.customer.phone}</p> : null}

          <div className="mt-6 space-y-4 border-t hairline pt-5">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Orders</div>
              <div className="mt-1 font-display text-[26px] text-forest">{data.orders.length}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">Lifetime value</div>
              <div className="mt-1 font-display text-[26px] text-forest"><Money pence={data.lifetime_pence} /></div>
            </div>
          </div>

          <div className="mt-6 border-t hairline pt-5">
            <CustomerDeleteButton
              id={data.customer.id}
              name={data.customer.name}
              redirectTo="/admin/customers"
              variant="button"
            />
          </div>
        </aside>

        <div>
          <h2 className="font-display text-[22px] text-ink">Order history</h2>
          <div className="mt-4 overflow-hidden rounded-lg border hairline bg-paper">
            <table className="w-full text-[13px]">
              <thead className="border-b hairline bg-cream-deep/50 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Placed</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline">
                {data.orders.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-cream-deep/40">
                    <td className="px-5 py-3.5 font-display text-[14px] text-ink">
                      <Link href={`/admin/orders/${o.id}`} className="hover:text-forest">{o.reference}</Link>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3.5 text-ink-muted"><DateTime iso={o.created_at} /></td>
                    <td className="px-5 py-3.5 text-right font-display text-[15px] text-forest"><Money pence={o.total_pence} /></td>
                  </tr>
                ))}
                {data.orders.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center italic text-ink-muted">No orders.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
