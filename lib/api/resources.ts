// Serializers that mirror Laravel API Resource shapes so the frontend
// continues to work without changes.

import type { OrderStatus } from "../types";
import { allowedFrom } from "../domain/state-machine";

type Row = Record<string, unknown>;

function optionBool(row: Row, key: string) {
  const options = row.options_json;
  if (!options || typeof options !== "object" || Array.isArray(options)) return false;
  return !!(options as Row)[key];
}

function optionNumber(row: Row, key: string) {
  const options = row.options_json;
  if (!options || typeof options !== "object" || Array.isArray(options)) return null;
  const value = (options as Row)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function serializeUser(u: Row | null | undefined) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? null,
    role: u.role,
    verification_status: u.verification_status ?? "unverified",
    verified_at: u.verified_at ?? null,
    email_verified_at: u.email_verified_at ?? null,
    created_at: u.created_at,
  };
}

export function serializeAddress(a: Row | null | undefined) {
  if (!a) return null;
  return {
    id: a.id,
    line1: a.line1,
    line2: a.line2 ?? null,
    city: a.city,
    postcode: a.postcode,
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
    is_default: !!a.is_default,
    created_at: a.created_at,
    updated_at: a.updated_at,
  };
}

export function serializeCategory(c: Row | null | undefined) {
  if (!c) return null;
  return { id: c.id, name: c.name, slug: c.slug, sort_order: c.sort_order, is_active: !!c.is_active };
}

export function serializeVariant(v: Row) {
  return {
    id: v.id,
    label: v.label,
    price_pence: v.price_pence,
    qty_multiplier: v.qty_multiplier,
    stock_count: v.stock_count ?? null,
    sku: v.sku ?? null,
    sort_order: v.sort_order,
    is_active: !!v.is_active,
  };
}

export function serializeProduct(p: Row & { category?: Row; variants?: Row[]; product_variants?: Row[] }) {
  const variants = p.variants ?? p.product_variants;
  return {
    id: p.id,
    name: p.name,
    brand: p.brand ?? null,
    slug: p.slug,
    description: p.description ?? null,
    price_pence: p.price_pence,
    image_url: p.image_url ?? null,
    gallery_urls: p.gallery_urls ?? [],
    options: p.options_json ?? null,
    review_count: optionNumber(p, "review_count"),
    rating: optionNumber(p, "rating"),
    short_spec: p.short_spec ?? null,
    is_active: !!p.is_active,
    is_featured: !!p.is_featured || optionBool(p, "is_featured"),
    is_age_restricted: !!p.is_age_restricted,
    available_from: p.available_from ?? null,
    available_until: p.available_until ?? null,
    stock_count: p.stock_count ?? null,
    category_id: p.category_id,
    category: p.category ? serializeCategory(p.category) : undefined,
    variants: variants ? (variants as Row[]).map(serializeVariant) : null,
  };
}

export function serializeOrderItem(i: Row) {
  const snap = (i.product_snapshot_json as Row | null) ?? {};
  return {
    id: i.id,
    product_id: i.product_id ?? snap.id,
    product_variant_id: i.product_variant_id ?? null,
    variant_label: i.variant_label ?? null,
    name: snap.name ?? "",
    image_url: snap.image_url ?? null,
    quantity: i.quantity,
    unit_price_pence: i.unit_price_pence,
    line_total_pence: i.line_total_pence,
    options: i.options_json ?? null,
    statement_category: (i.statement_category as string | null | undefined) ?? null,
  };
}

export function serializeOrderEvent(e: Row & { actor?: Row | null }) {
  return {
    id: e.id,
    from_status: e.from_status ?? null,
    to_status: e.to_status,
    note: e.note ?? null,
    created_at: e.created_at,
    actor: e.actor ? serializeUser(e.actor) : null,
  };
}

export function serializeOrder(o: Row & {
  customer?: Row | null;
  driver?: Row | null;
  address?: Row | null;
  items?: Row[];
  order_items?: Row[];
  events?: Row[];
  order_events?: Row[];
}) {
  const items = o.items ?? o.order_items;
  const events = o.events ?? o.order_events;
  const status = o.status as OrderStatus;
  return {
    id: o.id,
    reference: o.reference,
    status,
    allowed_transitions: allowedFrom(status),
    subtotal_pence: o.subtotal_pence,
    delivery_fee_pence: o.delivery_fee_pence,
    vat_pence: o.vat_pence,
    total_pence: o.total_pence,
    delivery_tier: o.delivery_tier ?? "standard",
    statement_of_use_accepted: !!o.statement_of_use_accepted,
    n2o_agreement_accepted: !!o.n2o_agreement_accepted,
    scheduled_for: o.scheduled_for ?? null,
    customer_notes: o.customer_notes ?? null,
    driver_notes: o.driver_notes ?? null,
    created_at: o.created_at,
    updated_at: o.updated_at,
    payment: {
      status: o.refunded_at ? "refunded" : o.paid_at ? "paid" : "unpaid",
      is_paid: !!o.paid_at,
      is_refunded: !!o.refunded_at,
      paid_at: o.paid_at ?? null,
      amount_paid_pence: o.amount_paid_pence ?? null,
      currency: o.payment_currency ?? null,
      card_brand: o.card_brand ?? null,
      card_last4: o.card_last4 ?? null,
      method: o.payment_method_type ?? null,
      receipt_url: o.receipt_url ?? null,
      stripe_session_id: o.stripe_session_id ?? null,
      stripe_payment_intent_id: o.stripe_payment_intent_id ?? null,
      refund_id: o.refund_id ?? null,
      refunded_at: o.refunded_at ?? null,
      amount_refunded_pence: o.amount_refunded_pence ?? null,
    },
    customer: o.customer ? serializeUser(o.customer) : null,
    driver: o.driver ? serializeUser(o.driver) : null,
    address: o.address ? serializeAddress(o.address) : null,
    items: items ? (items as Row[]).map(serializeOrderItem) : [],
    events: events ? (events as Row[]).map(serializeOrderEvent) : undefined,
  };
}

export function serializeIdVerification(v: Row & { user?: Row | null; reviewer?: Row | null }) {
  return {
    id: v.id,
    doc_type: v.doc_type,
    status: v.status,
    rejection_reason: v.rejection_reason ?? null,
    reviewed_at: v.reviewed_at ?? null,
    expires_at: v.expires_at ?? null,
    created_at: v.created_at,
    updated_at: v.updated_at,
    reviewer: v.reviewer ? { id: v.reviewer.id, name: v.reviewer.name } : null,
    user: v.user ? {
      id: v.user.id,
      name: v.user.name,
      email: v.user.email,
      phone: v.user.phone ?? null,
      verification_status: v.user.verification_status ?? "unverified",
    } : null,
  };
}

export function serializeServiceArea(s: Row) {
  return {
    id: s.id,
    postcode_prefix: s.postcode_prefix,
    delivery_fee_pence: s.delivery_fee_pence,
    eta_standard_minutes: s.eta_standard_minutes,
    eta_priority_minutes: s.eta_priority_minutes,
    priority_fee_pence: s.priority_fee_pence,
    super_fee_pence: s.super_fee_pence,
    is_active: !!s.is_active,
    created_at: s.created_at,
    updated_at: s.updated_at,
  };
}
