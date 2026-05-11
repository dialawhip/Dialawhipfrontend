import type { NextRequest } from "next/server";
import { handle, created, validationError } from "@/lib/api/responses";
import { requireRole } from "@/lib/api/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX = 6 * 1024 * 1024;

export const POST = handle(async (req: NextRequest) => {
  await requireRole("admin", "staff");
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return validationError({ file: ["File required"] });
  if (!ALLOWED.includes(file.type)) return validationError({ file: ["Unsupported type"] });
  if (file.size > MAX) return validationError({ file: ["File exceeds 6MB"] });
  const admin = supabaseAdmin();
  const ext = file.name.split(".").pop() || "bin";
  const path = `categories/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const upload = await admin.storage.from("product-images").upload(path, buf, {
    contentType: file.type,
    upsert: false,
  });
  if (upload.error) throw upload.error;
  const { data: pub } = admin.storage.from("product-images").getPublicUrl(upload.data.path);
  return created({ url: pub.publicUrl, path: upload.data.path, disk: "product-images" });
});
