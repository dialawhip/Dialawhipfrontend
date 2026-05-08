import type { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api/responses";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { serializeProduct } from "@/lib/api/resources";

function isMissingFeaturedColumn(error: { message?: string; code?: string } | null) {
  return error?.code === "PGRST204" && /is_featured/i.test(error.message ?? "");
}

export const GET = handle(async (req: NextRequest) => {
  const admin = supabaseAdmin();
  const params = req.nextUrl.searchParams;
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") ?? 25) || 25));
  const categorySlug = params.get("filter[category]") || params.get("category");
  const search = params.get("filter[search]") || params.get("search");
  const featured = params.get("filter[featured]") || params.get("featured");
  const sort = params.get("sort");

  let query = admin
    .from("products")
    .select("*, category:categories!products_category_id_fkey(*), variants:product_variants(*)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .limit(limit);

  if (featured === "true" || featured === "1") {
    query = query.eq("is_featured", true).order("updated_at", { ascending: false });
  } else if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("name", { ascending: true });
  }

  if (categorySlug) {
    const { data: cat } = await admin.from("categories").select("id").eq("slug", categorySlug).single();
    if (cat) query = query.eq("category_id", cat.id);
    else return ok([]);
  }
  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

  let { data, error } = await query;
  if (isMissingFeaturedColumn(error) && (featured === "true" || featured === "1")) {
    let fallbackQuery = admin
      .from("products")
      .select("*, category:categories!products_category_id_fkey(*), variants:product_variants(*)")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(100);

    if (categorySlug) {
      const { data: cat } = await admin.from("categories").select("id").eq("slug", categorySlug).single();
      if (cat) fallbackQuery = fallbackQuery.eq("category_id", cat.id);
      else return ok([]);
    }
    if (search) fallbackQuery = fallbackQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    const fallback = await fallbackQuery;
    data = (fallback.data ?? []).filter((p) => {
      const options = p.options_json;
      return !!(options && typeof options === "object" && !Array.isArray(options) && options.is_featured);
    }).slice(0, limit);
    error = fallback.error;
  }
  if (error) throw error;
  const products = (data ?? []).map((p) => {
    const activeVariants = (p.variants ?? []).filter((v: { is_active: boolean }) => v.is_active);
    return serializeProduct({ ...p, variants: activeVariants });
  });
  return ok(products);
});
