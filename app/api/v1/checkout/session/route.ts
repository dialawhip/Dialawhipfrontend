import type { NextRequest } from "next/server";
import { z } from "zod";
import { handle, created } from "@/lib/api/responses";
import { requireRole } from "@/lib/api/auth";
import { parseJson } from "@/lib/api/validation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createOrderFromCart } from "@/lib/domain/create-order";
import { createCheckoutSession } from "@/lib/domain/stripe";
import { serializeOrder } from "@/lib/api/resources";

const Body = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    variant_id: z.string().uuid().optional().nullable(),
    quantity: z.number().int().min(1).max(500),
    options: z.record(z.string(), z.unknown()).optional().nullable(),
    statement_category: z.string().max(100).optional().nullable(),
  })).min(1),
  address_id: z.string().uuid(),
  delivery_tier: z.enum(["standard", "priority", "super"]).optional().nullable(),
  scheduled_for: z.string().datetime().optional().nullable(),
  customer_notes: z.string().max(1000).optional().nullable(),
  statement_of_use_accepted: z.boolean().optional(),
  n2o_agreement_accepted: z.boolean().optional(),
});

export const POST = handle(async (req: NextRequest) => {
  const user = await requireRole("customer", "staff", "admin");
  const body = await parseJson(req, Body);

  const order = await createOrderFromCart({
    customerId: user.id,
    customerEmail: user.email,
    isVerified: user.verification_status === "verified",
    items: body.items,
    addressId: body.address_id,
    deliveryTier: body.delivery_tier ?? "standard",
    scheduledFor: body.scheduled_for ?? null,
    customerNotes: body.customer_notes ?? null,
    statementOfUseAccepted: !!body.statement_of_use_accepted,
    n2oAgreementAccepted: !!body.n2o_agreement_accepted,
  });

  const admin = supabaseAdmin();
  const { data: full } = await admin
    .from("orders")
    .select("*, items:order_items(*), address:addresses(*)")
    .eq("id", order.id)
    .single();

  const session = await createCheckoutSession({
    id: order.id,
    reference: order.reference,
    total_pence: order.total_pence,
    delivery_fee_pence: order.delivery_fee_pence,
    vat_pence: order.vat_pence,
    payment_currency: "GBP",
    customer_email: user.email,
    items: full?.items ?? [],
  });

  await admin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

  return created({
    order: serializeOrder({ ...full, stripe_session_id: session.id }),
    checkout_url: session.url,
    stripe_session_id: session.id,
  });
});
