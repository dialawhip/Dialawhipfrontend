import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, okList, created, validationError } from "@/lib/api/responses";
import { requireRole } from "@/lib/api/auth";
import { parseJson } from "@/lib/api/validation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { serializeCategory } from "@/lib/api/resources";

const Body = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and hyphens only"),
  image_url: z.string().url().max(2048).optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
});

export const GET = handle(async () => {
  await requireRole("admin", "staff");
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return okList((data ?? []).map(serializeCategory));
});

export const POST = handle(async (req: NextRequest) => {
  await requireRole("admin", "staff");
  const body = await parseJson(req, Body);
  const admin = supabaseAdmin();
  const { count } = await admin.from("categories").select("id", { count: "exact", head: true }).eq("slug", body.slug);
  if ((count ?? 0) > 0) return validationError({ slug: ["The slug has already been taken."] });
  const { data, error } = await admin
    .from("categories")
    .insert({
      name: body.name,
      slug: body.slug,
      image_url: body.image_url ?? null,
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return created(serializeCategory(data));
});
