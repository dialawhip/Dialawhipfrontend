import Stripe from "stripe";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (!cached) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("STRIPE_SECRET_KEY is not set");
    cached = new Stripe(secret);
  }
  return cached;
}

export function frontendUrl(): string {
  return (process.env.FRONTEND_URL || "https://www.dialawhip.com").replace(/\/+$/, "");
}

export function successUrl(): string {
  return process.env.STRIPE_SUCCESS_URL || `${frontendUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
}

export function cancelUrl(): string {
  return process.env.STRIPE_CANCEL_URL || `${frontendUrl()}/checkout?cancelled=1`;
}

export interface OrderForStripe {
  id: string;
  reference: string;
  total_pence: number;
  delivery_fee_pence: number;
  vat_pence: number;
  payment_currency?: string | null;
  customer_email: string;
  items: Array<{
    quantity: number;
    unit_price_pence: number;
    variant_label?: string | null;
    product_snapshot_json: { name?: string; brand?: string | null; image_url?: string | null };
  }>;
}

export async function createCheckoutSession(order: OrderForStripe): Promise<Stripe.Checkout.Session> {
  const s = stripe();
  const currency = (order.payment_currency || "gbp").toLowerCase();
  type LineItem = NonNullable<Stripe.Checkout.SessionCreateParams["line_items"]>[number];
  const lineItems: LineItem[] = order.items.map((it) => ({
    quantity: it.quantity,
    price_data: {
      currency,
      unit_amount: it.unit_price_pence,
      product_data: {
        name: [it.product_snapshot_json?.name, it.variant_label].filter(Boolean).join(" — ") || "Item",
        images: it.product_snapshot_json?.image_url ? [it.product_snapshot_json.image_url] : undefined,
      },
    },
  }));
  if (order.delivery_fee_pence > 0) {
    lineItems.push({
      quantity: 1,
      price_data: { currency, unit_amount: order.delivery_fee_pence, product_data: { name: "Delivery" } },
    });
  }
  if (order.vat_pence > 0) {
    lineItems.push({
      quantity: 1,
      price_data: { currency, unit_amount: order.vat_pence, product_data: { name: "VAT" } },
    });
  }
  return s.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: successUrl(),
    cancel_url: cancelUrl(),
    customer_email: order.customer_email,
    client_reference_id: order.id,
    metadata: { order_id: order.id, order_reference: order.reference },
    payment_intent_data: { metadata: { order_id: order.id, order_reference: order.reference } },
  });
}

export async function retrieveSession(sessionId: string) {
  return stripe().checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });
}

export async function syncPaymentToOrder(orderId: string) {
  const { supabaseAdmin } = await import("../supabase/admin");
  const admin = supabaseAdmin();
  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (!order) return null;

  const s = stripe();
  let intent: Stripe.PaymentIntent | null = null;
  const intentExpand = [
    "latest_charge",
    "latest_charge.balance_transaction",
    "latest_charge.payment_method_details",
    "latest_charge.refunds",
  ];
  if (order.stripe_payment_intent_id) {
    intent = await s.paymentIntents.retrieve(order.stripe_payment_intent_id, {
      expand: intentExpand,
    });
  } else if (order.stripe_session_id) {
    const session = await s.checkout.sessions.retrieve(order.stripe_session_id, { expand: ["payment_intent"] });
    if (session.payment_intent && typeof session.payment_intent !== "string") {
      const pi = await s.paymentIntents.retrieve(session.payment_intent.id, {
        expand: intentExpand,
      });
      intent = pi;
      await admin.from("orders").update({ stripe_payment_intent_id: pi.id }).eq("id", orderId);
    }
  }
  if (!intent) return order;

  const updates: Record<string, unknown> = {};
  if (intent.status === "succeeded") {
    updates.paid_at = order.paid_at ?? new Date().toISOString();
    updates.amount_paid_pence = intent.amount_received;
    updates.payment_currency = intent.currency?.toUpperCase() ?? null;
  }
  const charge = (intent.latest_charge ?? null) as Stripe.Charge | null;
  if (charge) {
    const pm = charge.payment_method_details as Stripe.Charge.PaymentMethodDetails | null;
    if (pm?.card) {
      updates.card_brand = pm.card.brand ?? null;
      updates.card_last4 = pm.card.last4 ?? null;
    }
    updates.payment_method_type = pm?.type ?? null;
    updates.receipt_url = charge.receipt_url ?? null;
    updates.stripe_charge_id = charge.id;
    const balanceTxn = charge.balance_transaction;
    if (balanceTxn) {
      updates.stripe_balance_transaction_id = typeof balanceTxn === "string" ? balanceTxn : balanceTxn.id;
    }
    const refunds = charge.refunds?.data ?? [];
    if (refunds.length > 0) {
      const last = refunds[refunds.length - 1];
      updates.refund_id = last.id;
      updates.refunded_at = new Date(last.created * 1000).toISOString();
      updates.amount_refunded_pence = refunds.reduce((sum, r) => sum + (r.amount ?? 0), 0);
    }
  }
  if (Object.keys(updates).length > 0) {
    await admin.from("orders").update(updates).eq("id", orderId);
  }
  const { data: fresh } = await admin.from("orders").select("*").eq("id", orderId).single();
  return fresh;
}
