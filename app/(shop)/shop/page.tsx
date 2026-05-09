import Link from "next/link";
import { apiServer } from "@/lib/api-server";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "@/components/shop/product-card";
import { Eyebrow } from "@/components/shop/eyebrow";

export const metadata = { title: "Shop · Dialawhip" };

type Search = { search?: string };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const search = (params.search ?? "").trim();

  const [cats, prods] = await Promise.all([
    apiServer<{ data: Category[] }>("/api/v1/categories", { auth: false, cache: "no-store" }).catch(() => ({ data: [] })),
    apiServer<{ data: Product[] }>("/api/v1/products", {
      auth: false,
      cache: "no-store",
      query: { limit: 100, search: search || undefined },
    }).catch(() => ({ data: [] })),
  ]);

  const byCategory = new Map<string, Product[]>();
  for (const p of prods.data) {
    const slug = p.category?.slug ?? "other";
    if (!byCategory.has(slug)) byCategory.set(slug, []);
    byCategory.get(slug)!.push(p);
  }

  return (
    <>
      {/* Page hero strip */}
      <section className="border-b-2 border-ink bg-yellow">
        <div className="mx-auto max-w-[1280px] px-6 py-12 md:py-16">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Eyebrow>The catalogue</Eyebrow>
              <h1 className="mt-5 font-display text-[44px] font-bold leading-[1] tracking-tight text-ink md:text-[68px]">
                The whole shelf.
              </h1>
              <p className="mt-4 max-w-xl text-[14px] font-medium leading-relaxed text-ink/85 md:text-[15px]">
                {prods.data.length} products in stock across {cats.data.length} categories.
                20-minute delivery across Tyneside.
              </p>
            </div>

            <form
              action="/shop"
              method="get"
              className="flex h-12 w-full max-w-sm items-center gap-2 rounded-full border-2 border-ink bg-paper pl-5 pr-1.5 focus-within:bg-yellow-soft"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-ink">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3-3" strokeLinecap="round" />
              </svg>
              <input
                name="search"
                defaultValue={search}
                placeholder="Search brands, packs, sizes…"
                className="h-full flex-1 bg-transparent text-[14px] font-medium placeholder:text-ink/40 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[12px] font-bold text-paper"
              >
                Find
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <nav className="flex flex-wrap gap-2 border-b-2 border-ink/10 pb-5">
          <Link
            href="/shop"
            className="rounded-full bg-ink px-4 py-1.5 text-[12px] font-bold text-paper"
          >
            All
          </Link>
          {cats.data.map((c) => (
            <Link
              key={c.id}
              href={`/shop/${c.slug}`}
              className="rounded-full border-2 border-ink/15 bg-paper px-4 py-1.5 text-[12px] font-bold text-ink transition-colors hover:border-ink hover:bg-yellow"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        {prods.data.length === 0 ? (
          <div className="mt-16 rounded-3xl bg-yellow p-12 text-center ring-2 ring-ink">
            <p className="font-display text-[28px] font-bold text-ink">
              {search ? `No products match "${search}".` : "Nothing here yet."}
            </p>
            <p className="mt-2 text-[14px] font-medium text-ink/75">
              Try a broader term, or browse a category above.
            </p>
          </div>
        ) : (
          <div className="mt-12 space-y-20">
            {cats.data.map((c) => {
              const list = byCategory.get(c.slug);
              if (!list || list.length === 0) return null;
              return (
                <section key={c.id}>
                  <div className="flex items-end justify-between">
                    <div>
                      <Eyebrow>{c.name}</Eyebrow>
                      <h2 className="mt-4 font-display text-[32px] font-bold tracking-tight text-ink sm:text-[40px]">
                        {c.name}
                      </h2>
                    </div>
                    <Link
                      href={`/shop/${c.slug}`}
                      className="hidden items-center gap-1.5 text-[13px] font-bold text-brand transition-colors hover:text-brand-deep md:inline-flex"
                    >
                      See all {list.length}
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                  <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {list.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
