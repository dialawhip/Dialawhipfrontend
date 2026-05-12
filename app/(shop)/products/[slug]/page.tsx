import { notFound } from "next/navigation";
import Link from "next/link";
import { apiServer, ApiRequestError, getCurrentUser } from "@/lib/api-server";
import type { Product } from "@/lib/types";
import { Money } from "@/components/ui/money";
import { ProductBuyBox } from "@/components/shop/product-buy-box";
import { ProductGallery } from "@/components/shop/product-gallery";
import { Eyebrow } from "@/components/shop/eyebrow";
import { ProductTabs } from "@/components/shop/product-tabs";
import { leadPrice } from "@/lib/sale-price";

type Params = Promise<{ slug: string }>;

const SPEC_LABEL: Record<string, string> = {
  purity: "Purity",
  capacity_g: "Capacity",
  capacity_l: "Capacity",
  equivalent_chargers: "≈ chargers",
  pack_count: "Pack count",
  tanks: "Tanks included",
  casing: "Casing",
  edition: "Edition",
  gas: "Gas",
  material: "Material",
  diameter_in: "Diameter",
  size_in: "Size",
  size: "Size",
  volume_ml: "Volume",
  volume_oz: "Volume",
  weight_g: "Weight",
  weight_kg: "Weight",
  form: "Form",
  count: "Count",
  flavour: "Flavour",
  badge: "Highlight",
};

function formatSpecValue(key: string, v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (key === "capacity_g" && typeof v === "number") return `${v} g`;
  if (key === "capacity_l" && typeof v === "number") return `${v} L`;
  if (key === "diameter_in" && typeof v === "number") return `${v}"`;
  if (key === "size_in" && typeof v === "number") return `${v}"`;
  if (key === "volume_ml" && typeof v === "number") return `${v} ml`;
  if (key === "volume_oz" && typeof v === "number") return `${v} oz`;
  if (key === "weight_g" && typeof v === "number") return `${v} g`;
  if (key === "weight_kg" && typeof v === "number") return `${v} kg`;
  return String(v);
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;

  let product: Product;
  try {
    const res = await apiServer<{ data: Product }>(`/api/v1/products/${slug}`, { auth: false });
    product = res.data;
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) return notFound();
    throw e;
  }

  const user = await getCurrentUser().catch(() => null);
  const isVerified = user?.verification_status === "verified";

  const inStock = typeof product.stock_count === "number" ? product.stock_count > 0 : true;
  const lowStock = typeof product.stock_count === "number" && product.stock_count > 0 && product.stock_count < 10;

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-4 sm:px-6 sm:py-10">
      <nav className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted sm:mb-8 sm:text-[12px] sm:tracking-[0.16em]">
        <Link href="/shop" className="transition-colors hover:text-brand">Shop</Link>
        <span aria-hidden>·</span>
        {product.category ? (
          <>
            <Link href={`/shop/${product.category.slug}`} className="transition-colors hover:text-brand">
              {product.category.name}
            </Link>
            <span aria-hidden>·</span>
          </>
        ) : null}
        <span className="min-w-0 break-words text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:gap-16">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-2xl bg-yellow p-1.5 ring-2 ring-ink sm:rounded-3xl sm:p-2">
            <ProductGallery
              featured={product.image_url}
              gallery={product.gallery_urls ?? []}
              alt={product.name}
              fallbackLetter={(product.brand ?? product.name).charAt(0).toUpperCase()}
              fallbackBg="#f5eb12"
              fallbackInk="#000000"
              topLeftBadges={
                <>
                  {product.is_age_restricted ? (
                    <span className="inline-flex h-7 items-center rounded-full bg-ink px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-yellow">
                      18+ ID
                    </span>
                  ) : null}
                  {product.brand ? (
                    <span className="inline-flex h-7 items-center rounded-full bg-paper px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink ring-2 ring-ink">
                      {product.brand}
                    </span>
                  ) : null}
                </>
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] sm:mt-5 sm:gap-2 sm:tracking-[0.14em]">
            <span className={inStock ? "rounded-full bg-ink px-3 py-2 text-yellow" : "rounded-full bg-paper px-3 py-2 text-ink ring-2 ring-ink"}>
              {inStock ? "● In stock" : "Out of stock"}
            </span>
            <span className="rounded-full bg-paper px-3 py-2 text-ink ring-2 ring-ink">Newcastle · 20-min</span>
            <span className="rounded-full bg-paper px-3 py-2 text-ink ring-2 ring-ink">Live tracking</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          {product.category ? (
            <Eyebrow>{product.category.name}</Eyebrow>
          ) : null}
          <h1 className="mt-3 break-words font-display text-[30px] font-bold leading-[1.05] tracking-tight text-ink sm:mt-4 sm:text-[40px] md:text-[56px]">
            {product.name}
          </h1>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-2 sm:mt-6">
            {(() => {
              const { regular: lead, sale: leadSale } = leadPrice(product);
              const headlineFrom = !!product.variants && product.variants.filter((v) => v.is_active).length > 0;
              const onSale = leadSale !== null;
              return (
                <>
                  {headlineFrom ? (
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted sm:text-[12px]">from</span>
                  ) : null}
                  <Money
                    pence={onSale ? (leadSale as number) : lead}
                    className={`font-display ${headlineFrom ? "text-[34px] sm:text-[40px]" : "text-[36px] sm:text-[44px]"} font-bold leading-none ${onSale ? "text-[#c10b0b]" : "text-ink"}`}
                  />
                  {onSale ? (
                    <Money
                      pence={lead}
                      className="font-display text-[18px] text-ink-muted line-through decoration-ink-muted/60"
                    />
                  ) : null}
                  {onSale ? (
                    <span className="inline-flex h-7 items-center rounded-full bg-[#c10b0b] px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-paper">
                      Sale
                    </span>
                  ) : null}
                </>
              );
            })()}
            {lowStock ? (
              <span className="inline-flex h-7 items-center rounded-full bg-yellow px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink ring-2 ring-ink">
                Only {product.stock_count} left
              </span>
            ) : null}
          </div>

          {product.is_age_restricted ? (
            <div className="mt-6 rounded-2xl border border-danger/25 bg-danger-soft p-4 sm:mt-7 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger text-[12px] font-bold text-paper">18+</span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold text-ink">ID verification required</h3>
                  {isVerified ? (
                    <p className="mt-1 text-[13px] text-success">✓ Your account is verified. You can order this product.</p>
                  ) : user ? (
                    <p className="mt-1 text-[13px] text-ink-soft">
                      Your account is not yet verified.{" "}
                      <Link href="/account/verification" className="font-semibold text-brand underline underline-offset-2">
                        Upload your ID →
                      </Link>
                    </p>
                  ) : (
                    <p className="mt-1 text-[13px] text-ink-soft">
                      <Link href={`/login?next=/products/${product.slug}`} className="font-semibold text-brand underline underline-offset-2">
                        Sign in
                      </Link>{" "}
                      or{" "}
                      <Link href="/register" className="font-semibold text-brand underline underline-offset-2">
                        create an account
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 sm:mt-7">
            {inStock ? (
              <ProductBuyBox
                product={product}
                base={{
                  product_id: product.id,
                  slug: product.slug,
                  name: product.name,
                  image_url: product.image_url,
                }}
              />
            ) : (
              <div className="rounded-2xl border hairline bg-paper p-6 text-center">
                <p className="text-[16px] font-bold text-ink">Out of stock</p>
                <p className="mt-1 text-[13px] text-ink-muted">We&rsquo;ll restock within 48 hours.</p>
              </div>
            )}
          </div>

          <p className="mt-4 text-[12px] text-ink-muted sm:mt-5">
            Order before 03:00 for immediate Newcastle delivery. Free delivery NE1–NE4.
          </p>

          <div className="mt-7 h-px bg-line sm:mt-9" />

          {product.short_spec && Object.keys(product.short_spec).length > 0 ? (
            <div className="mt-6 overflow-hidden rounded-2xl border hairline bg-paper sm:mt-7">
              <div className="bg-surface px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted sm:px-5">
                Specs
              </div>
              <dl className="grid grid-cols-2 gap-px bg-line">
                {Object.entries(product.short_spec).map(([k, v]) => (
                  <div key={k} className="min-w-0 bg-paper px-4 py-3 sm:px-5 sm:py-4">
                    <dt className="break-words text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                      {SPEC_LABEL[k] ?? k.replace(/_/g, " ")}
                    </dt>
                    <dd className="mt-1 break-words text-[14px] font-bold text-ink sm:text-[15px]">{formatSpecValue(k, v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>

      <ProductTabs
        productSlug={product.slug}
        description={product.description}
        rating={product.rating}
        reviewCount={product.review_count}
      />
    </div>
  );
}
