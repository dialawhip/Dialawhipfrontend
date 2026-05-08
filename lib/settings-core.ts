/**
 * Client-safe slice of `lib/settings`. Only types and pure helpers — no
 * server-only imports — so this file can be pulled into client components
 * (header, cart, checkout, etc.) without dragging `apiServer` along.
 */

/* ─── Setting keys exposed by /v1/settings/public ─── */

export interface PublicSettings {
  // Branding
  "branding.logo_url"?: string | null;
  "branding.logo_dark_url"?: string | null;
  "branding.favicon_url"?: string | null;
  "branding.og_image_url"?: string | null;
  "branding.primary_color"?: string | null;
  "branding.accent_color"?: string | null;

  // Business
  "business.name"?: string | null;
  "business.tagline"?: string | null;
  "business.phone"?: string | null;
  "business.whatsapp"?: string | null;
  "business.email"?: string | null;
  "business.support_email"?: string | null;
  "business.address"?: string | null;
  "business.city"?: string | null;
  "business.postcode"?: string | null;
  "business.country"?: string | null;
  "business.hours"?: Record<string, string> | string[] | null;

  // Social
  "social.facebook"?: string | null;
  "social.instagram"?: string | null;
  "social.twitter"?: string | null;
  "social.tiktok"?: string | null;
  "social.youtube"?: string | null;
  "social.linkedin"?: string | null;

  // SEO
  "seo.meta_title"?: string | null;
  "seo.meta_description"?: string | null;
  "seo.meta_keywords"?: string | null;
  "seo.google_analytics_id"?: string | null;
  "seo.gtm_id"?: string | null;
  "seo.facebook_pixel_id"?: string | null;

  // Order rules
  "order.is_open"?: boolean | null;
  "order.minimum_pence"?: number | null;
  "order.lead_time_hours"?: number | null;
  "order.free_delivery_threshold_pence"?: number | null;

  // Delivery defaults
  "delivery.default_fee_pence"?: number | null;
  "delivery.default_priority_fee_pence"?: number | null;
  "delivery.default_super_fee_pence"?: number | null;
  "delivery.default_eta_standard_minutes"?: number | null;
  "delivery.default_eta_priority_minutes"?: number | null;

  // Tax / compliance
  "vat.rate_bps"?: number | null;
  "compliance.age_minimum"?: number | null;

  // Legal
  "legal.terms_url"?: string | null;
  "legal.privacy_url"?: string | null;
  "legal.cookies_url"?: string | null;
  "legal.refund_url"?: string | null;

  // Maintenance
  "maintenance.enabled"?: boolean | null;
  "maintenance.message"?: string | null;
}

/* ─── Sensible fallbacks if the backend is unreachable ─── */

export const DEFAULTS: PublicSettings = {
  "business.name": "Dial A Whip",
  "business.tagline": "Newcastle · 20-minute catering supplies",
  "business.phone": "0191 000 0000",
  "business.email": "hello@dialawhip.test",
  "business.address": "Newcastle upon Tyne, UK",
  "business.city": "Newcastle upon Tyne",
  "business.country": "United Kingdom",
  "seo.meta_title": "Dial A Whip — 20-minute Newcastle catering supplies",
  "seo.meta_description":
    "Cream chargers, whippers, packaging and PPE — delivered across Newcastle in minutes. Trade & 18+.",
  "order.is_open": true,
  "order.minimum_pence": 1500,
  "compliance.age_minimum": 18,
};

/* ─── Convenience getters with safe fallbacks ─── */

export function settingString(s: PublicSettings, key: keyof PublicSettings, fallback = ""): string {
  const v = s[key];
  return typeof v === "string" && v.trim() !== "" ? v : fallback;
}

export function settingNumber(s: PublicSettings, key: keyof PublicSettings, fallback = 0): number {
  const v = s[key];
  return typeof v === "number" ? v : fallback;
}

export function settingBool(s: PublicSettings, key: keyof PublicSettings, fallback = false): boolean {
  const v = s[key];
  return typeof v === "boolean" ? v : fallback;
}

/**
 * Turn the admin's `business.hours` JSON into human-readable lines.
 *
 * Accepts either:
 *   - object form: { tue_sun: "10:00-03:00", mon: "Closed" }
 *   - array form:  ["Tue–Sun · 10:00–03:00", "Closed Mondays"]
 */
export function formatBusinessHours(s: PublicSettings): Array<{ label: string; value: string }> {
  const raw = s["business.hours"];
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .filter((v): v is string => typeof v === "string" && v.trim() !== "")
      .map((v) => ({ label: "", value: v.replace(/-/g, "–") }));
  }

  if (typeof raw === "object") {
    return Object.entries(raw)
      .filter(([, v]) => typeof v === "string" && v.trim() !== "")
      .map(([k, v]) => ({
        label: humaniseDayKey(k),
        value: String(v).replace(/-/g, "–"),
      }));
  }

  return [];
}

export function humaniseDayKey(key: string): string {
  const DAYS: Record<string, string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };
  const range = key.toLowerCase().split(/[_-]/).filter(Boolean);
  if (range.length === 2 && DAYS[range[0]] && DAYS[range[1]]) {
    return `${DAYS[range[0]]}–${DAYS[range[1]]}`;
  }
  if (range.length === 1 && DAYS[range[0]]) {
    return DAYS[range[0]];
  }
  return key
    .split(/[_-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

/** Pull together the social URLs that have a value, in display order. */
export function socialLinks(s: PublicSettings): Array<{ key: string; label: string; url: string }> {
  const map: Array<[keyof PublicSettings, string]> = [
    ["social.instagram", "Instagram"],
    ["social.facebook", "Facebook"],
    ["social.twitter", "X / Twitter"],
    ["social.tiktok", "TikTok"],
    ["social.youtube", "YouTube"],
    ["social.linkedin", "LinkedIn"],
  ];
  return map
    .map(([k, label]) => ({ key: String(k), label, url: settingString(s, k) }))
    .filter((l) => l.url !== "");
}
