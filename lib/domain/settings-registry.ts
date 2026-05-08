import { z } from "zod";

export type SettingType = "string" | "text" | "int" | "bool" | "url" | "email" | "image" | "json";

export interface SettingDef {
  key: string;
  label: string;
  type: SettingType;
  group: string;
  public: boolean;
  default?: unknown;
}

const D = (key: string, label: string, type: SettingType, group: string, pub = false, def?: unknown): SettingDef => ({
  key, label, type, group, public: pub, default: def,
});

export const SETTINGS: SettingDef[] = [
  // branding (public)
  D("branding.logo_url", "Logo", "image", "branding", true),
  D("branding.logo_dark_url", "Logo (dark)", "image", "branding", true),
  D("branding.favicon_url", "Favicon", "image", "branding", true),
  D("branding.og_image_url", "Open Graph image", "image", "branding", true),
  D("branding.primary_color", "Primary color", "string", "branding", true, "#004fb0"),
  D("branding.accent_color", "Accent color", "string", "branding", true, "#f5eb12"),

  // business (public)
  D("business.name", "Business name", "string", "business", true, "Dialawhip"),
  D("business.tagline", "Tagline", "string", "business", true),
  D("business.phone", "Phone", "string", "business", true),
  D("business.whatsapp", "WhatsApp", "string", "business", true),
  D("business.email", "Email", "email", "business", true),
  D("business.support_email", "Support email", "email", "business", true),
  D("business.address", "Address", "text", "business", true),
  D("business.city", "City", "string", "business", true),
  D("business.postcode", "Postcode", "string", "business", true),
  D("business.country", "Country", "string", "business", true, "GB"),
  D("business.hours", "Opening hours", "json", "business", true),

  // social (public)
  D("social.facebook", "Facebook", "url", "social", true),
  D("social.instagram", "Instagram", "url", "social", true),
  D("social.twitter", "Twitter / X", "url", "social", true),
  D("social.tiktok", "TikTok", "url", "social", true),
  D("social.youtube", "YouTube", "url", "social", true),
  D("social.linkedin", "LinkedIn", "url", "social", true),

  // SEO (public)
  D("seo.meta_title", "Meta title", "string", "seo", true),
  D("seo.meta_description", "Meta description", "text", "seo", true),
  D("seo.meta_keywords", "Meta keywords", "string", "seo", true),
  D("seo.google_analytics_id", "Google Analytics ID", "string", "seo", true),
  D("seo.gtm_id", "GTM ID", "string", "seo", true),
  D("seo.facebook_pixel_id", "Facebook Pixel ID", "string", "seo", true),

  // order (some public)
  D("order.is_open", "Shop open", "bool", "order", true, true),
  D("order.minimum_pence", "Minimum order", "int", "order", true, 2000),
  D("order.lead_time_hours", "Lead time (hours)", "int", "order", true, 0),
  D("order.free_delivery_threshold_pence", "Free delivery threshold", "int", "order", true, 0),
  D("order.priority_auto_threshold_pence", "Free priority delivery threshold", "int", "order", true, 15000),

  // delivery defaults
  D("delivery.default_fee_pence", "Default delivery fee", "int", "delivery", false, 0),
  D("delivery.default_priority_fee_pence", "Priority surcharge", "int", "delivery", false, 500),
  D("delivery.default_super_fee_pence", "Super surcharge", "int", "delivery", false, 1500),
  D("delivery.default_eta_standard_minutes", "Standard ETA (minutes)", "int", "delivery", true, 25),
  D("delivery.default_eta_priority_minutes", "Priority ETA (minutes)", "int", "delivery", true, 12),

  // tax
  D("tax.vat.rate_bps", "VAT rate (basis points)", "int", "tax", false, 0),

  // compliance (public)
  D("compliance.age_minimum", "Minimum age", "int", "compliance", true, 18),
  D("compliance.id_required_categories", "ID-required categories", "json", "compliance", true, []),

  // legal (public)
  D("legal.terms_url", "Terms URL", "url", "legal", true),
  D("legal.privacy_url", "Privacy URL", "url", "legal", true),
  D("legal.cookies_url", "Cookies URL", "url", "legal", true),
  D("legal.refund_url", "Refund URL", "url", "legal", true),

  // maintenance (public)
  D("maintenance.enabled", "Maintenance mode", "bool", "maintenance", true, false),
  D("maintenance.message", "Maintenance message", "text", "maintenance", true),

  // notifications
  D("notifications.admin_email", "Admin notification email", "email", "notifications", false),
  D("notifications.order_alert_sms", "Order alert SMS number", "string", "notifications", false),
];

export const SETTING_KEYS = SETTINGS.map((s) => s.key);
export const PUBLIC_KEYS = SETTINGS.filter((s) => s.public).map((s) => s.key);

const INDEX = new Map(SETTINGS.map((s) => [s.key, s]));

export function getMeta(key: string): SettingDef | undefined {
  return INDEX.get(key);
}

export function isImageType(key: string): boolean {
  return INDEX.get(key)?.type === "image";
}

export function valueSchema(type: SettingType) {
  switch (type) {
    case "string":
    case "text":
    case "url":
    case "email":
    case "image":
      return z.union([z.string(), z.null()]);
    case "int":
      return z.union([z.number().int(), z.null()]);
    case "bool":
      return z.union([z.boolean(), z.null()]);
    case "json":
      return z.unknown();
  }
}

export function coerce(key: string, value: unknown): unknown {
  const meta = INDEX.get(key);
  if (!meta) return value;
  if (value === null || value === undefined || value === "") return null;
  switch (meta.type) {
    case "int": return typeof value === "number" ? Math.trunc(value) : Number.parseInt(String(value), 10) || 0;
    case "bool": return value === true || value === "true" || value === 1 || value === "1";
    default: return value;
  }
}
