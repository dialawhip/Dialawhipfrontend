import Link from "next/link";
import type { Category } from "@/lib/types";
import type { PublicSettings } from "@/lib/settings";
import { settingString, socialLinks, formatBusinessHours } from "@/lib/settings";

const FOOTER_FALLBACK_LINKS: { name: string; slug: string }[] = [
  { name: "Cream chargers", slug: "cream-chargers" },
  { name: "Smartwhip tanks", slug: "smartwhip-tanks" },
  { name: "MAXXI tanks", slug: "maxxi-tanks" },
  { name: "Whippers", slug: "whippers" },
  { name: "Monin syrups", slug: "monin-syrups" },
];

export function ShopFooter({
  settings,
  categories,
}: {
  settings?: PublicSettings;
  categories?: Category[];
}) {
  const s = settings ?? {};
  const shopLinks = (categories && categories.length > 0
    ? categories.map((c) => ({ name: c.name, slug: c.slug }))
    : FOOTER_FALLBACK_LINKS
  ).slice(0, 5);

  const brandName = settingString(s, "business.name", "Dialawhip");
  const tagline = settingString(s, "business.tagline", "Newcastle · 20-min delivery");
  // Footer sits on a dark (ink) background — prefer the dark-mode logo.
  const logoUrl =
    settingString(s, "branding.logo_dark_url") ||
    settingString(s, "branding.logo_url");
  const phone = settingString(s, "business.phone");
  const whatsapp = settingString(s, "business.whatsapp");
  const email = settingString(s, "business.email");
  const supportEmail = settingString(s, "business.support_email");
  const address = settingString(s, "business.address");
  const city = settingString(s, "business.city");
  const country = settingString(s, "business.country");

  const termsUrl = settingString(s, "legal.terms_url", "/legal/terms");
  const privacyUrl = settingString(s, "legal.privacy_url", "/legal/privacy");
  const shippingUrl = settingString(s, "legal.refund_url", "/legal/shipping");
  const cookiesUrl = settingString(s, "legal.cookies_url");

  const socials = socialLinks(s);
  const hours = formatBusinessHours(s);

  return (
    <footer className="border-t-2 border-ink bg-ink text-paper">
      {/* Top yellow band */}
      <div className="border-b-2 border-ink bg-yellow text-ink">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-6 py-6">
          <p className="font-display text-[24px] font-bold leading-tight md:text-[32px]">
            Out of stock? <span className="text-brand">Not for long.</span>
          </p>
          <Link
            href="/shop"
            className="inline-flex h-11 items-center rounded-full bg-ink px-6 text-[12px] font-bold text-yellow transition-colors hover:bg-brand hover:text-paper"
          >
            Start your order →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-6 pt-16 pb-10">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="font-display leading-tight">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={brandName} className="h-12 w-auto" />
              ) : (
                <span className="block text-[36px] font-bold text-paper">
                  {brandName}<span className="text-yellow">.</span>
                </span>
              )}
              {tagline ? (
                <span className="mt-3 block text-[15px] font-medium text-paper/70">{tagline}</span>
              ) : null}
            </div>
            <p className="mt-6 max-w-sm text-[14px] leading-relaxed text-paper/65">
              Rapid catering supplies across Tyneside — chargers, whippers, syrups,
              coffee and disposables, at your door in minutes. Strictly trade &amp; 18+.
            </p>

            {(phone || email || address) ? (
              <div className="mt-7 space-y-2.5 text-[13px] text-paper/85">
                {phone ? (
                  <div>
                    <a href={`tel:${phone.replace(/\s+/g, "")}`} className="font-medium hover:text-yellow">
                      ☎ {phone}
                    </a>
                  </div>
                ) : null}
                {whatsapp ? (
                  <div>
                    <a
                      href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-yellow"
                    >
                      WhatsApp · {whatsapp}
                    </a>
                  </div>
                ) : null}
                {email ? (
                  <div>
                    <a href={`mailto:${email}`} className="font-medium hover:text-yellow">{email}</a>
                  </div>
                ) : null}
                {supportEmail && supportEmail !== email ? (
                  <div>
                    <a href={`mailto:${supportEmail}`} className="font-medium hover:text-yellow">
                      Support · {supportEmail}
                    </a>
                  </div>
                ) : null}
                {address || city || country ? (
                  <div className="text-paper/55">
                    {[address, city, country].filter(Boolean).join(", ")}
                  </div>
                ) : null}
              </div>
            ) : null}

            {socials.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
                {socials.map((soc) => (
                  <a
                    key={soc.key}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border-2 border-paper/15 px-3 py-1.5 text-paper/70 transition-colors hover:border-yellow hover:text-yellow"
                  >
                    {soc.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <FooterCol title="Shop">
            {shopLinks.map((l) => (
              <FooterLink key={l.slug} href={`/shop/${l.slug}`}>
                {l.name}
              </FooterLink>
            ))}
            <FooterLink href="/shop">Full catalogue →</FooterLink>
          </FooterCol>

          <FooterCol title="Service">
            <FooterLink href="/delivery">Delivery &amp; coverage</FooterLink>
            <FooterLink href="/trade">Trade accounts</FooterLink>
            <FooterLink href="/account/orders">Track an order</FooterLink>
            <FooterLink href="/contact">Contact us</FooterLink>
            <FooterLink href="/about">About {brandName}</FooterLink>
          </FooterCol>

          <FooterCol title="Legal">
            <FooterLink href={termsUrl}>Terms &amp; conditions</FooterLink>
            <FooterLink href={privacyUrl}>Privacy policy</FooterLink>
            <FooterLink href={shippingUrl}>Shipping &amp; payment</FooterLink>
            {cookiesUrl ? <FooterLink href={cookiesUrl}>Cookies policy</FooterLink> : null}
            <FooterLink href="/legal/n2o-agreement">N₂O chargers agreement</FooterLink>
            <FooterLink href="/legal/report-abuse">Report abuse</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-12 grid gap-3 rounded-2xl border-2 border-yellow/30 bg-paper/[0.04] p-5 text-[12px] leading-relaxed text-paper/70 md:grid-cols-3">
          <p><strong className="block text-[11px] font-bold uppercase tracking-[0.14em] text-yellow">18+ only</strong>You must be at least 18 years of age to use this website.</p>
          <p><strong className="block text-[11px] font-bold uppercase tracking-[0.14em] text-yellow">Culinary use</strong>Products are for use in the preparation of food and beverages only.</p>
          <p><strong className="block text-[11px] font-bold uppercase tracking-[0.14em] text-yellow">Right to refuse</strong>We retain the right to refuse to sell to anyone we suspect may misuse our products.</p>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t-2 border-paper/10 pt-8 text-[12px] text-paper/55 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} North East Catering Supplies LTD{city ? ` · ${city}` : ""}.</p>
          {hours.length > 0 ? (
            <p className="flex flex-wrap gap-x-5 gap-y-1.5">
              {hours.map((h, idx) => (
                <span key={`${h.label}-${idx}`}>
                  {h.label ? <strong className="font-bold text-paper/85">{h.label}</strong> : null}
                  {h.label ? " · " : ""}
                  {h.value}
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-yellow">{title}</h4>
      <div className="mt-4 flex flex-col gap-2.5 text-[14px]">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-paper/70 transition-colors hover:text-yellow">
      {children}
    </Link>
  );
}
