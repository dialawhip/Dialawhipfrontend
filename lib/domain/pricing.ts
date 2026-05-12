import type { DeliveryTier } from "../types";
import { supabaseAdmin } from "../supabase/admin";
import { effectivePricePence } from "../sale-price";
import { getSetting } from "./settings";
import { findServiceAreaForPostcode } from "./service-area";
import { ShopClosedError, BelowMinimumOrderError, PostcodeOutOfAreaError } from "./errors";

export interface CartItem {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  options?: Record<string, unknown> | null;
  statement_category?: string | null;
}

export interface PricedLine {
  product: { id: string; name: string; brand: string | null; slug: string; price_pence: number; sale_price_pence: number | null; image_url: string | null; gallery_urls: string[] | null; is_age_restricted: boolean };
  variant: { id: string; label: string; price_pence: number; sale_price_pence: number | null; qty_multiplier: number; sku: string | null } | null;
  quantity: number;
  unit_price_pence: number;
  /** The "before sale" price for this line, for display only. Equals unit_price_pence when not on sale. */
  list_price_pence: number;
  line_total_pence: number;
  options: Record<string, unknown> | null;
  statement_category: string | null;
}

export interface PriceResult {
  lines: PricedLine[];
  subtotal_pence: number;
  delivery_fee_pence: number;
  vat_pence: number;
  total_pence: number;
  minimum_pence: number;
  delivery_tier: DeliveryTier;
  requires_id_verification: boolean;
  service_area: {
    postcode_prefix: string;
    eta_standard_minutes: number;
    eta_priority_minutes: number;
    priority_fee_pence: number;
    super_fee_pence: number;
  } | null;
}

export async function priceCart(
  items: CartItem[],
  postcode: string | null,
  tier: DeliveryTier = "standard",
): Promise<PriceResult> {
  const isOpen = await getSetting<boolean>("order.is_open", true);
  if (!isOpen) {
    const msg = await getSetting<string | null>("maintenance.message", null);
    throw new ShopClosedError(msg ?? undefined);
  }

  const admin = supabaseAdmin();
  const productIds = Array.from(new Set(items.map((i) => i.product_id)));
  const variantIds = Array.from(new Set(items.map((i) => i.variant_id).filter(Boolean) as string[]));

  const [{ data: products }, { data: variants }] = await Promise.all([
    admin.from("products").select("*").in("id", productIds),
    variantIds.length
      ? admin.from("product_variants").select("*").in("id", variantIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

  const lines: PricedLine[] = [];
  let subtotal = 0;
  let requiresId = false;

  for (const item of items) {
    const p = productMap.get(item.product_id);
    if (!p || !p.is_active || p.deleted_at) throw new Error(`Product unavailable: ${item.product_id}`);
    const productSale = typeof p.sale_price_pence === "number" ? Number(p.sale_price_pence) : null;
    let listPrice = Number(p.price_pence);
    let unitPrice = effectivePricePence({ price_pence: listPrice, sale_price_pence: productSale });
    let variant: PricedLine["variant"] = null;
    if (item.variant_id) {
      const v = variantMap.get(item.variant_id);
      if (!v || !v.is_active || v.product_id !== p.id) throw new Error(`Variant unavailable`);
      const variantSale = typeof v.sale_price_pence === "number" ? Number(v.sale_price_pence) : null;
      listPrice = Number(v.price_pence);
      unitPrice = effectivePricePence({ price_pence: listPrice, sale_price_pence: variantSale });
      variant = {
        id: v.id,
        label: v.label,
        price_pence: v.price_pence,
        sale_price_pence: variantSale,
        qty_multiplier: v.qty_multiplier,
        sku: v.sku ?? null,
      };
    }
    const qty = Math.max(1, Math.min(500, Math.trunc(item.quantity)));
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;
    if (p.is_age_restricted) requiresId = true;
    lines.push({
      product: {
        id: p.id, name: p.name, brand: p.brand ?? null, slug: p.slug,
        price_pence: p.price_pence,
        sale_price_pence: productSale,
        image_url: p.image_url ?? null,
        gallery_urls: p.gallery_urls ?? null, is_age_restricted: !!p.is_age_restricted,
      },
      variant,
      quantity: qty,
      unit_price_pence: unitPrice,
      list_price_pence: listPrice,
      line_total_pence: lineTotal,
      options: item.options ?? null,
      statement_category: item.statement_category ?? null,
    });
  }

  const minimum = Number(await getSetting<number>("order.minimum_pence", 2000));
  if (subtotal < minimum) throw new BelowMinimumOrderError(minimum);

  let deliveryFee = 0;
  let serviceAreaPayload: PriceResult["service_area"] = null;
  let serviceArea: Record<string, unknown> | null = null;
  if (postcode) {
    serviceArea = await findServiceAreaForPostcode(postcode);
    if (!serviceArea) throw new PostcodeOutOfAreaError();
    deliveryFee = Number(serviceArea.delivery_fee_pence);
    if (tier === "priority") deliveryFee += Number(serviceArea.priority_fee_pence ?? 0);
    if (tier === "super") deliveryFee += Number(serviceArea.super_fee_pence ?? 0);
    const freeThreshold = Number(await getSetting<number>("order.free_delivery_threshold_pence", 0));
    if (freeThreshold > 0 && subtotal >= freeThreshold && tier === "standard") deliveryFee = 0;
    const priorityAutoThreshold = Number(
      await getSetting<number>("order.priority_auto_threshold_pence", 15000),
    );
    if (priorityAutoThreshold > 0 && subtotal >= priorityAutoThreshold && tier === "priority") {
      deliveryFee = 0;
    }
    serviceAreaPayload = {
      postcode_prefix: String(serviceArea.postcode_prefix),
      eta_standard_minutes: Number(serviceArea.eta_standard_minutes),
      eta_priority_minutes: Number(serviceArea.eta_priority_minutes),
      priority_fee_pence: Number(serviceArea.priority_fee_pence),
      super_fee_pence: Number(serviceArea.super_fee_pence),
    };
  }

  const vatBps = Number(await getSetting<number>("tax.vat.rate_bps", 0));
  const vat = Math.round(((subtotal + deliveryFee) * vatBps) / 10000);
  const total = subtotal + deliveryFee + vat;

  return {
    lines,
    subtotal_pence: subtotal,
    delivery_fee_pence: deliveryFee,
    vat_pence: vat,
    total_pence: total,
    minimum_pence: minimum,
    delivery_tier: tier,
    requires_id_verification: requiresId,
    service_area: serviceAreaPayload,
  };
}
