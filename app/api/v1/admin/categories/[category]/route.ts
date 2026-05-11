import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, ok, notFound, fail, validationError, noBody } from "@/lib/api/responses";
import { requireRole } from "@/lib/api/auth";
import { parseJson } from "@/lib/api/validation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { serializeCategory } from "@/lib/api/resources";

const Body = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
  image_url: z.string().url().max(2048).nullable().optional(),
  sort_order: z.number().int().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
});

type Ctx = { params: Promise<{ category: string }> };

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  await requireRole("admin", "staff");
  const { category: id } = await params;
  const body = await parseJson(req, Body);
  const admin = supabaseAdmin();

  if (body.slug) {
    const { count } = await admin
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("slug", body.slug)
      .neq("id", id);
    if ((count ?? 0) > 0) return validationError({ slug: ["The slug has already been taken."] });
  }

  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.slug !== undefined) update.slug = body.slug;
  if (body.image_url !== undefined) update.image_url = body.image_url;
  if (body.sort_order !== undefined && body.sort_order !== null) update.sort_order = body.sort_order;
  if (body.is_active !== undefined && body.is_active !== null) update.is_active = body.is_active;

  const { data, error } = await admin.from("categories").update(update).eq("id", id).select("*").single();
  if (error) return notFound("Category not found");
  return ok(serializeCategory(data));
});

export const DELETE = handle(async (_req: NextRequest, { params }: Ctx) => {
  // Match the PATCH handler — admin and staff share the admin app.
  await requireRole("admin", "staff");
  const { category: id } = await params;
  const admin = supabaseAdmin();
  // Block delete when products reference this category — would otherwise hit
  // the on delete restrict at the FK and produce a confusing 500.
  const { count } = await admin.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if ((count ?? 0) > 0) {
    return fail("Move or delete the products in this category first.", 422);
  }
  const { error } = await admin.from("categories").delete().eq("id", id);
  if (error) return notFound("Category not found");
  return noBody(204);
});
