import Link from "next/link";
import { apiServer } from "@/lib/api-server";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "@/components/shop/product-card";
import { Eyebrow } from "@/components/shop/eyebrow";

type SP = Promise<{ category?: string; q?: string }>;

export default async function MenuPage({ searchParams }: { searchParams: SP }) {
  const { category, q } = await searchParams;

  const [cats, prods] = await Promise.all([
    apiServer<{ data: Category[] }>("/api/v1/categories", { auth: false }).catch(() => ({ data: [] })),
    apiServer<{ data: Product[] }>("/api/v1/products", {
      auth: false,
      query: { "filter[category]": category, "filter[search]": q, limit: 100 },
    }).catch(() => ({ data: [] })),
  ]);

  const activeCat = cats.data.find((c) => c.slug === category);

  return (
    <>
      <section className="border-b hairline">
        <div className="mx-auto max-w-[1280px] px-6 pt-16 pb-12">
          <Eyebrow>The full menu</Eyebrow>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h1 className="font-display text-[56px] leading-[0.95] text-ink md:text-[80px]">
              {activeCat ? (
                <>
                  <span className="italic font-light text-forest">{activeCat.name}</span>
                </>
              ) : (
                <>
                  Our <span className="italic font-light text-forest">kitchen</span>
                </>
              )}
            </h1>
            <p className="max-w-sm text-[15px] leading-relaxed text-ink-soft">
              {activeCat?.description ??
                "Cooked fresh each morning, packed with care, and delivered across the North East."}
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-18 z-30 border-b hairline bg-cream/85 backdrop-blur-md">
        <div className="mx-auto max-w-[1280px] px-6 py-4">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
            <FilterPill href="/menu" active={!category}>All dishes</FilterPill>
            {cats.data.map((c) => (
              <FilterPill key={c.id} href={`/menu?category=${c.slug}`} active={category === c.slug}>
                {c.name}
              </FilterPill>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-16">
        {prods.data.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-[28px] italic text-ink-muted">Nothing to show here yet.</p>
            <p className="mt-3 text-[14px] text-ink-muted">Try another category or check back soon.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between text-[13px] text-ink-muted">
              <span>{prods.data.length} {prods.data.length === 1 ? "dish" : "dishes"}</span>
              {q ? <span className="italic">Matching "{q}"</span> : null}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {prods.data.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "inline-flex shrink-0 items-center rounded-full bg-forest px-4 py-2 text-[13px] font-medium text-cream"
          : "inline-flex shrink-0 items-center rounded-full border hairline bg-paper px-4 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:border-forest hover:text-forest"
      }
    >
      {children}
    </Link>
  );
}
