import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, ok, notFound } from "@/lib/api/responses";
import { requireRole } from "@/lib/api/auth";
import { parseJson } from "@/lib/api/validation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { serializeProduct } from "@/lib/api/resources";

const VariantSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  label: z.string().min(1).max(120),
  price_pence: z.number().int().min(0).max(10_000_000),
  sale_price_pence: z.number().int().min(0).max(10_000_000).optional().nullable(),
  qty_multiplier: z.number().int().min(1).max(1000).optional().nullable(),
  stock_count: z.number().int().min(0).optional().nullable(),
  sku: z.string().max(80).optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
}).refine((v) => v.sale_price_pence == null || v.sale_price_pence < v.price_pence, {
  message: "Sale price must be lower than the regular price.",
  path: ["sale_price_pence"],
});

const ProductBody = z.object({
  category_id: z.string().uuid({ message: "Pick a category" }),
  name: z.string().min(1).max(160),
  slug: z.string().min(1).max(160),
  brand: z.string().max(80).optional().nullable(),
  description: z.string().optional().nullable(),
  price_pence: z.number().int().min(0).max(1_000_000),
  sale_price_pence: z.number().int().min(0).max(1_000_000).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  gallery_urls: z.array(z.string().max(1024)).max(20).optional().nullable(),
  options: z.unknown().optional().nullable(),
  short_spec: z.unknown().optional().nullable(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_age_restricted: z.boolean().optional(),
  available_from: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  available_until: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  stock_count: z.number().int().min(0).optional().nullable(),
  variants: z.array(VariantSchema).max(50).optional().nullable(),
}).refine((p) => p.sale_price_pence == null || p.sale_price_pence < p.price_pence, {
  message: "Sale price must be lower than the regular price.",
  path: ["sale_price_pence"],
});

function isMissingFeaturedColumn(error: { message?: string; code?: string } | null) {
  return error?.code === "PGRST204" && /is_featured/i.test(error.message ?? "");
}

function optionsWithFeatured(options: unknown, isFeatured: boolean) {
  return {
    ...(options && typeof options === "object" && !Array.isArray(options) ? options : {}),
    is_featured: isFeatured,
  };
}

async function clearOtherFeaturedProducts(admin: ReturnType<typeof supabaseAdmin>, currentProductId: string) {
  const { error } = await admin
    .from("products")
    .update({ is_featured: false })
    .neq("id", currentProductId)
    .is("deleted_at", null);

  if (!isMissingFeaturedColumn(error)) {
    if (error) throw error;
    return;
  }

  const { data, error: selectError } = await admin
    .from("products")
    .select("id, options_json")
    .neq("id", currentProductId)
    .is("deleted_at", null);
  if (selectError) throw selectError;

  const updates = await Promise.all((data ?? []).map((p) => admin
    .from("products")
    .update({ options_json: optionsWithFeatured(p.options_json, false) })
    .eq("id", p.id)));
  const failed = updates.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

type Ctx = { params: Promise<{ product: string }> };

export const GET = handle(async (_req: NextRequest, { params }: Ctx) => {
  await requireRole("admin", "staff");
  const { product: id } = await params;
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("products")
    .select("*, category:categories!products_category_id_fkey(*), variants:product_variants(*)")
    .eq("id", id)
    .single();
  if (!data) return notFound();
  return ok(serializeProduct(data));
});

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  await requireRole("admin", "staff");
  const { product: id } = await params;
  const body = await parseJson(req, ProductBody);
  const admin = supabaseAdmin();
  const productRow = {
    category_id: body.category_id,
    name: body.name,
    slug: body.slug,
    brand: body.brand ?? null,
    description: body.description ?? null,
    price_pence: body.price_pence,
    sale_price_pence: body.sale_price_pence ?? null,
    image_url: body.image_url ?? null,
    gallery_urls: body.gallery_urls ?? null,
    options_json: body.options ?? null,
    short_spec: body.short_spec ?? null,
    is_active: body.is_active ?? true,
    is_featured: body.is_featured ?? false,
    is_age_restricted: body.is_age_restricted ?? false,
    available_from: body.available_from ?? null,
    available_until: body.available_until ?? null,
    stock_count: body.stock_count ?? null,
  };

  if (body.is_featured) await clearOtherFeaturedProducts(admin, id);

  let { error } = await admin.from("products").update(productRow).eq("id", id);
  if (isMissingFeaturedColumn(error)) {
    const { is_featured: _isFeatured, ...fallbackRow } = productRow;
    void _isFeatured;
    const fallback = await admin
      .from("products")
      .update({
        ...fallbackRow,
        options_json: optionsWithFeatured(body.options, body.is_featured ?? false),
      })
      .eq("id", id);
    error = fallback.error;
  }
  if (error) throw error;

  if (body.variants !== undefined) {
    const incoming = body.variants ?? [];
    const incomingIds = new Set(incoming.filter((v) => v.id).map((v) => v.id as string));
    const { data: existing } = await admin.from("product_variants").select("id").eq("product_id", id);
    const toDelete = (existing ?? []).filter((v) => !incomingIds.has(v.id)).map((v) => v.id);
    if (toDelete.length) await admin.from("product_variants").delete().in("id", toDelete);
    for (const v of incoming) {
      const row = {
        product_id: id,
        label: v.label,
        price_pence: v.price_pence,
        sale_price_pence: v.sale_price_pence ?? null,
        qty_multiplier: v.qty_multiplier ?? 1,
        stock_count: v.stock_count ?? null,
        sku: v.sku ?? null,
        sort_order: v.sort_order ?? 0,
        is_active: v.is_active ?? true,
      };
      if (v.id) await admin.from("product_variants").update(row).eq("id", v.id);
      else await admin.from("product_variants").insert(row);
    }
  }

  const { data: full } = await admin
    .from("products")
    .select("*, category:categories!products_category_id_fkey(*), variants:product_variants(*)")
    .eq("id", id)
    .single();
  return ok(serializeProduct(full!));
});

export const DELETE = handle(async (_req: NextRequest, { params }: Ctx) => {
  await requireRole("admin", "staff");
  const { product: id } = await params;
  const admin = supabaseAdmin();
  await admin.from("products").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  return ok({ deleted: true });
});
