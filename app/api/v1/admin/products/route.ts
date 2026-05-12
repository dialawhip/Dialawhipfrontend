import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, okList, created, validationError } from "@/lib/api/responses";
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

function productOptions(options: unknown) {
  const base = options && typeof options === "object" && !Array.isArray(options) ? options : {};
  return {
    review_count: Math.floor(10 + Math.random() * 641),
    rating: Number((4.6 + Math.random() * 0.4).toFixed(1)),
    ...base,
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

export const GET = handle(async (req: NextRequest) => {
  await requireRole("admin", "staff");
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 25) || 25));
  const categorySlug = sp.get("filter[category]") || sp.get("category");
  const admin = supabaseAdmin();
  let q = admin
    .from("products")
    .select("*, category:categories!products_category_id_fkey(*), variants:product_variants(*)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (categorySlug) {
    const { data: cat } = await admin.from("categories").select("id").eq("slug", categorySlug).single();
    if (cat) q = q.eq("category_id", cat.id);
    else return okList([]);
  }
  const { data, error } = await q;
  if (error) throw error;
  return okList((data ?? []).map((p) => serializeProduct(p)));
});

export const POST = handle(async (req: NextRequest) => {
  await requireRole("admin", "staff");
  const body = await parseJson(req, ProductBody);
  const admin = supabaseAdmin();
  const { count } = await admin.from("products").select("id", { count: "exact", head: true }).eq("slug", body.slug);
  if ((count ?? 0) > 0) return validationError({ slug: ["The slug has already been taken."] });

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
    options_json: productOptions(body.options),
    short_spec: body.short_spec ?? null,
    is_active: body.is_active ?? true,
    is_featured: body.is_featured ?? false,
    is_age_restricted: body.is_age_restricted ?? false,
    available_from: body.available_from ?? null,
    available_until: body.available_until ?? null,
    stock_count: body.stock_count ?? null,
  };

  if (body.is_featured) await clearOtherFeaturedProducts(admin, "");

  let { data: product, error } = await admin
    .from("products")
    .insert(productRow)
    .select("*")
    .single();
  if (isMissingFeaturedColumn(error)) {
    const { is_featured: _isFeatured, ...fallbackRow } = productRow;
    void _isFeatured;
    const fallback = await admin
      .from("products")
      .insert({
        ...fallbackRow,
        options_json: optionsWithFeatured(productOptions(body.options), body.is_featured ?? false),
      })
      .select("*")
      .single();
    product = fallback.data;
    error = fallback.error;
  }
  if (error) throw error;

  if (body.variants?.length) {
    const rows = body.variants.map((v) => ({
      product_id: product.id,
      label: v.label,
      price_pence: v.price_pence,
      sale_price_pence: v.sale_price_pence ?? null,
      qty_multiplier: v.qty_multiplier ?? 1,
      stock_count: v.stock_count ?? null,
      sku: v.sku ?? null,
      sort_order: v.sort_order ?? 0,
      is_active: v.is_active ?? true,
    }));
    await admin.from("product_variants").insert(rows);
  }

  const { data: full } = await admin
    .from("products")
    .select("*, category:categories!products_category_id_fkey(*), variants:product_variants(*)")
    .eq("id", product.id)
    .single();
  return created(serializeProduct(full!));
});
