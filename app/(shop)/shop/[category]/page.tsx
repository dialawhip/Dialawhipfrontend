import { notFound } from "next/navigation";
import Link from "next/link";
import { apiServer } from "@/lib/api-server";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "@/components/shop/product-card";
import { Eyebrow } from "@/components/shop/eyebrow";

type Params = Promise<{ category: string }>;

export default async function CategoryPage({ params }: { params: Params }) {
  const { category: slug } = await params;

  const [cats, prods] = await Promise.all([
    apiServer<{ data: Category[] }>("/api/v1/categories", { auth: false, cache: "no-store" }).catch(() => ({ data: [] })),
    apiServer<{ data: Product[] }>("/api/v1/products", {
      auth: false,
      cache: "no-store",
      query: { limit: 200, category: slug, sort: "oldest" },
    }).catch(() => ({ data: [] })),
  ]);

  const category = cats.data.find((c) => c.slug === slug);
  if (!category) return notFound();

  return (
    <>
      <section className="border-b-2 border-ink bg-yellow">
        <div className="mx-auto max-w-[1280px] px-6 py-12 md:py-16">
          <nav className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-ink/75">
            <Link href="/shop" className="transition-colors hover:text-brand">Shop</Link>
            <span aria-hidden>·</span>
            <span className="text-ink">{category.name}</span>
          </nav>

          <div className="mt-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Eyebrow>{prods.data.length} in stock</Eyebrow>
              <h1 className="mt-5 font-display text-[44px] font-bold leading-[1] tracking-tight text-ink md:text-[68px]">
                {category.name}.
              </h1>
              <p className="mt-4 max-w-lg text-[14px] font-medium leading-relaxed text-ink/85 md:text-[15px]">
                All {prods.data.length} {category.name.toLowerCase()} we stock, sorted by popularity. 20-minute delivery across Newcastle.
              </p>
            </div>

            <Link
              href="/shop"
              className="inline-flex h-11 items-center rounded-full border-2 border-ink bg-paper px-5 text-[12px] font-bold text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              ← All categories
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-6 py-12">
        {prods.data.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-yellow p-12 text-center ring-2 ring-ink">
            <p className="font-display text-[28px] font-bold text-ink">Nothing in stock right now.</p>
            <p className="mt-2 text-[14px] font-medium text-ink/75">Check back soon — we restock weekly.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {prods.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
