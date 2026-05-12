import Link from "next/link";
import type { Product } from "@/lib/types";
import { Money } from "@/components/ui/money";
import { leadPrice, discountPercent } from "@/lib/sale-price";

function specHighlight(spec: Product["short_spec"]): string | null {
  if (!spec) return null;
  if (spec.equivalent_chargers) return `≈ ${spec.equivalent_chargers} chargers`;
  if (spec.capacity_g && typeof spec.capacity_g === "number" && spec.capacity_g >= 100) return `${spec.capacity_g}g tank`;
  if (spec.pack_count) return `Pack of ${spec.pack_count}`;
  if (spec.volume_ml) return `${spec.volume_ml}ml`;
  if (spec.weight_g) return `${spec.weight_g}g`;
  if (spec.weight_kg) return `${spec.weight_kg}kg`;
  if (spec.flavour) return String(spec.flavour);
  return null;
}

export function ProductCard({ product }: { product: Product; index?: number }) {
  const highlight = specHighlight(product.short_spec);
  const lowStock = typeof product.stock_count === "number" && product.stock_count > 0 && product.stock_count < 10;
  const { regular, sale } = leadPrice(product);
  const onSale = sale !== null;
  const off = onSale ? discountPercent({ price_pence: regular, sale_price_pence: sale }) : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-paper ring-2 ring-ink/10 transition-all hover:ring-brand"
    >
      <div className="relative aspect-[4/3] bg-yellow">
        {/* badges */}
        <div className="absolute left-3 top-3 z-10 flex gap-1.5">
          {onSale ? (
            <span className="inline-flex h-6 items-center rounded bg-[#c10b0b] px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-paper">
              {off > 0 ? `-${off}%` : "Sale"}
            </span>
          ) : null}
          {product.is_age_restricted ? (
            <span className="inline-flex h-6 items-center rounded bg-ink px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-yellow">
              18+ ID
            </span>
          ) : null}
          {lowStock ? (
            <span className="inline-flex h-6 items-center rounded bg-paper px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink ring-1 ring-ink">
              Only {product.stock_count}
            </span>
          ) : null}
        </div>

        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-3 text-center">
            <span className="font-display text-[40px] font-bold text-ink/85">
              {(product.brand ?? product.name).charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col border-t-2 border-ink/10 bg-paper p-5">
        {product.brand ? (
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
            {product.brand}
          </div>
        ) : null}
        <div className="mt-1.5 line-clamp-2 font-display text-[16px] font-bold leading-tight text-ink">
          {product.name}
        </div>
        {highlight ? (
          <div className="mt-1 text-[11px] font-medium text-ink-muted">{highlight}</div>
        ) : null}
        {typeof product.review_count === "number" && product.review_count > 0 ? (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-ink-muted">
            <span className="text-yellow" aria-hidden>★</span>
            <span>{(product.rating ?? 4.8).toFixed(1)}</span>
            <span className="font-medium">({product.review_count.toLocaleString("en-GB")} reviews)</span>
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <Money
              pence={onSale ? (sale as number) : regular}
              className={`font-display text-[20px] font-bold ${onSale ? "text-[#c10b0b]" : "text-ink"}`}
            />
            {onSale ? (
              <Money
                pence={regular}
                className="font-medium text-[13px] text-ink-muted line-through decoration-ink-muted/60"
              />
            ) : null}
          </div>
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[11px] font-bold text-paper transition-colors group-hover:bg-brand">
            Add <span aria-hidden>+</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
