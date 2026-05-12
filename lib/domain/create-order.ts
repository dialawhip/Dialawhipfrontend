import type { DeliveryTier } from "../types";
import { supabaseAdmin } from "../supabase/admin";
import { priceCart, type CartItem, type PriceResult } from "./pricing";
import { recordInitialEvent } from "./order-status";
import { getSetting } from "./settings";
import { sendEmail } from "../email";
import { renderAdminOrderEmail } from "./admin-order-email";
import { getPublicSettings, settingString } from "../settings";

export interface CreateOrderInput {
  customerId: string;
  customerEmail: string;
  isVerified: boolean;
  items: CartItem[];
  addressId: string;
  deliveryTier: DeliveryTier;
  scheduledFor: string | null;
  customerNotes: string | null;
  statementOfUseAccepted: boolean;
  n2oAgreementAccepted: boolean;
}

export async function createOrderFromCart(input: CreateOrderInput) {
  const admin = supabaseAdmin();

  const { data: address } = await admin
    .from("addresses")
    .select("*")
    .eq("id", input.addressId)
    .eq("user_id", input.customerId)
    .single();
  if (!address) throw new Error("Address not found");

  const priced = await priceCart(input.items, address.postcode, input.deliveryTier);

  if (priced.requires_id_verification) {
    if (!input.statementOfUseAccepted || !input.n2oAgreementAccepted) {
      throw new Error("Compliance acceptance required for age-restricted items");
    }
    if (!input.isVerified) throw new Error("Verified ID required for age-restricted items");
  }

  const prefix = process.env.ORDER_REFERENCE_PREFIX || "CAT";
  const { data: refData, error: refErr } = await admin.rpc("next_order_reference", { prefix });
  if (refErr) throw refErr;
  const reference = refData as unknown as string;

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      reference,
      customer_id: input.customerId,
      address_id: input.addressId,
      status: "pending",
      delivery_tier: input.deliveryTier,
      subtotal_pence: priced.subtotal_pence,
      delivery_fee_pence: priced.delivery_fee_pence,
      vat_pence: priced.vat_pence,
      total_pence: priced.total_pence,
      statement_of_use_accepted: input.statementOfUseAccepted,
      n2o_agreement_accepted: input.n2oAgreementAccepted,
      scheduled_for: input.scheduledFor,
      customer_notes: input.customerNotes,
    })
    .select("*")
    .single();
  if (orderErr || !order) throw orderErr || new Error("Failed to create order");

  const itemRows = priced.lines.map((line) => ({
    order_id: order.id,
    product_id: line.product.id,
    product_variant_id: line.variant?.id ?? null,
    variant_label: line.variant?.label ?? null,
    product_snapshot_json: {
      ...line.product,
      captured_at: new Date().toISOString(),
      variant: line.variant ?? null,
    },
    quantity: line.quantity,
    unit_price_pence: line.unit_price_pence,
    line_total_pence: line.line_total_pence,
    options_json: line.options ?? null,
    statement_category: line.statement_category ?? null,
  }));

  const { error: itemsErr } = await admin.from("order_items").insert(itemRows);
  if (itemsErr) throw itemsErr;

  await recordInitialEvent(order.id, input.customerId);

  // Best-effort admin notification. Failure must not break order creation —
  // the order is already committed.
  notifyAdminOfOrder({
    orderId: order.id,
    reference,
    customerEmail: input.customerEmail,
    deliveryTier: input.deliveryTier,
    scheduledFor: input.scheduledFor,
    customerNotes: input.customerNotes,
    address: {
      line1: address.line1 as string,
      line2: (address.line2 ?? null) as string | null,
      city: (address.city ?? null) as string | null,
      postcode: address.postcode as string,
    },
    priced,
  }).catch((e) => {
    console.error("[create-order] admin notify failed", e);
  });

  return order;
}

interface NotifyArgs {
  orderId: string;
  reference: string;
  customerEmail: string;
  deliveryTier: DeliveryTier;
  scheduledFor: string | null;
  customerNotes: string | null;
  address: { line1: string; line2: string | null; city: string | null; postcode: string };
  priced: PriceResult;
}

async function notifyAdminOfOrder(args: NotifyArgs) {
  const adminEmail = await getSetting<string | null>("notifications.admin_email", null);
  if (!adminEmail) return;
  const base = process.env.FRONTEND_URL?.replace(/\/$/, "") || "";
  const settings = await getPublicSettings();
  const brandName = settingString(settings, "business.name", "Dial A Whip");
  const brandColor = settingString(settings, "branding.primary_color", "#0b1d3a");
  const accentColor = settingString(settings, "branding.accent_color", "#f5eb12");

  const { subject, html, text } = renderAdminOrderEmail({
    orderId: args.orderId,
    reference: args.reference,
    placedAt: new Date(),
    customerEmail: args.customerEmail,
    deliveryTier: args.deliveryTier,
    scheduledFor: args.scheduledFor,
    customerNotes: args.customerNotes,
    address: args.address,
    lines: args.priced.lines,
    subtotalPence: args.priced.subtotal_pence,
    deliveryFeePence: args.priced.delivery_fee_pence,
    vatPence: args.priced.vat_pence,
    totalPence: args.priced.total_pence,
    brandName,
    brandColor,
    accentColor,
    adminLink: base ? `${base}/admin/orders/${args.orderId}` : null,
    requiresIdVerification: args.priced.requires_id_verification,
  });

  await sendEmail({ to: adminEmail, subject, text, html });
}
