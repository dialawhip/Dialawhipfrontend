import Link from "next/link";
import { apiServer } from "@/lib/api-server";
import type { User, Paginated } from "@/lib/types";
import { Eyebrow } from "@/components/shop/eyebrow";
import { CustomerDeleteButton } from "@/components/admin/customer-delete-button";

type SP = Promise<{ cursor?: string; search?: string }>;

export default async function CustomersList({ searchParams }: { searchParams: SP }) {
  const { cursor, search } = await searchParams;
  const res = await apiServer<Paginated<User & { orders_count?: number; lifetime_pence?: number }>>(
    "/api/v1/admin/customers",
    { query: { cursor, search, limit: 50 } },
  ).catch(() => ({ data: [], meta: { next_cursor: null, prev_cursor: null } }));

  return (
    <>
      <section className="border-b-2 border-ink bg-yellow">
        <div className="mx-auto max-w-[1280px] px-6 py-12 md:px-10 md:py-16">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Eyebrow>People</Eyebrow>
              <h1 className="mt-5 font-display text-[44px] font-bold leading-[1] tracking-tight text-ink md:text-[64px]">
                <span className="text-brand">Customers.</span>
              </h1>
            </div>
            <form action="/admin/customers" className="flex h-12 w-full max-w-sm items-center gap-2 rounded-full border-2 border-ink bg-paper pl-5 pr-1.5">
              <input
                name="search"
                defaultValue={search}
                placeholder="Search by name or email"
                className="h-full flex-1 bg-transparent text-[13px] font-medium text-ink placeholder:text-ink/40 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[12px] font-bold text-yellow"
              >
                Find
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10">
        <div className="overflow-x-auto rounded-2xl bg-paper ring-2 ring-ink/10">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead className="border-b-2 border-ink/10 bg-yellow text-left text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {res.data.map((c, idx) => (
                <tr key={c.id} className={(idx > 0 ? "border-t-2 border-ink/10 " : "") + "transition-colors hover:bg-yellow"}>
                  <td className="px-5 py-3.5 font-display text-[15px] font-bold text-ink">
                    <Link href={`/admin/customers/${c.id}`} className="hover:text-brand">{c.name}</Link>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-ink-muted">{c.email}</td>
                  <td className="px-5 py-3.5 font-medium text-ink-muted">{c.phone ?? "—"}</td>
                  <td className="px-5 py-3.5 text-right">
                    <CustomerDeleteButton id={c.id} name={c.name} />
                  </td>
                </tr>
              ))}
              {res.data.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center font-medium italic text-ink-muted">No customers found.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
