import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, ok } from "@/lib/api/responses";
import { parseJson } from "@/lib/api/validation";
import { priceCart } from "@/lib/domain/pricing";

const Body = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    variant_id: z.string().uuid().optional().nullable(),
    quantity: z.number().int().min(1).max(500),
    options: z.record(z.string(), z.unknown()).optional().nullable(),
    statement_category: z.string().max(100).optional().nullable(),
  })).min(1),
  postcode: z.string().optional().nullable(),
  delivery_tier: z.enum(["standard", "priority", "super"]).optional().nullable(),
});

export const POST = handle(async (req: NextRequest) => {
  const body = await parseJson(req, Body);
  const result = await priceCart(body.items, body.postcode ?? null, body.delivery_tier ?? "standard");
  return ok({
    subtotal_pence: result.subtotal_pence,
    delivery_fee_pence: result.delivery_fee_pence,
    vat_pence: result.vat_pence,
    total_pence: result.total_pence,
    minimum_pence: result.minimum_pence,
    delivery_tier: result.delivery_tier,
    requires_id_verification: result.requires_id_verification,
    service_area: result.service_area,
    lines: result.lines.map((l) => ({
      product_id: l.product.id,
      name: l.product.name,
      brand: l.product.brand,
      quantity: l.quantity,
      is_age_restricted: l.product.is_age_restricted,
      unit_price_pence: l.unit_price_pence,
      line_total_pence: l.line_total_pence,
    })),
  });
});
