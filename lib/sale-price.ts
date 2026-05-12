import type { Product, ProductVariant } from "./types";

interface Priceable {
  price_pence: number;
  sale_price_pence?: number | null;
}

/**
 * Resolve which price to charge. Returns the sale price when it's set
 * and strictly below the regular price; otherwise the regular price.
 */
export function effectivePricePence(p: Priceable): number {
  if (
    typeof p.sale_price_pence === "number" &&
    p.sale_price_pence > 0 &&
    p.sale_price_pence < p.price_pence
  ) {
    return p.sale_price_pence;
  }
  return p.price_pence;
}

export function isOnSale(p: Priceable): boolean {
  return (
    typeof p.sale_price_pence === "number" &&
    p.sale_price_pence > 0 &&
    p.sale_price_pence < p.price_pence
  );
}

export function discountPercent(p: Priceable): number {
  if (!isOnSale(p)) return 0;
  const off = p.price_pence - (p.sale_price_pence as number);
  return Math.round((off / p.price_pence) * 100);
}

/**
 * Returns the cheapest priceable for the product - the variant if any
 * variants exist, otherwise the product itself. Used when a card needs
 * a single headline price.
 */
export function leadPrice(product: Product): { regular: number; sale: number | null } {
  const variants = (product.variants ?? []).filter((v) => v.is_active);
  if (variants.length === 0) {
    return {
      regular: product.price_pence,
      sale: isOnSale(product) ? product.sale_price_pence ?? null : null,
    };
  }
  const cheapest = variants.reduce<ProductVariant>((best, v) => {
    const candidate = effectivePricePence(v);
    return candidate < effectivePricePence(best) ? v : best;
  }, variants[0]);
  return {
    regular: cheapest.price_pence,
    sale: isOnSale(cheapest) ? cheapest.sale_price_pence ?? null : null,
  };
}
