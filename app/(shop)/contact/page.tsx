import { Eyebrow } from "@/components/shop/eyebrow";
import { getPublicSettings, settingString, socialLinks, formatBusinessHours } from "@/lib/settings";

export default async function ContactPage() {
  const s = await getPublicSettings();

  const phone = settingString(s, "business.phone");
  const email = settingString(s, "business.email");
  const supportEmail = settingString(s, "business.support_email");
  const address = settingString(s, "business.address");
  const city = settingString(s, "business.city");
  const country = settingString(s, "business.country");
  const whatsapp = settingString(s, "business.whatsapp");
  const socials = socialLinks(s);
  const hours = formatBusinessHours(s);
  const hoursHint = hours.length > 0
    ? hours.map((h) => (h.label ? `${h.label} ${h.value}` : h.value)).join(" · ")
    : "Tue–Sun 10:00–03:00";
  const brandName = settingString(s, "business.name", "Dialawhip");

  const cards: Array<{ label: string; value: string; href: string; hint: string }> = [];
  if (phone) cards.push({ label: "Phone", value: phone, href: `tel:${phone.replace(/\s+/g, "")}`, hint: hoursHint });
  if (email) cards.push({ label: "Email", value: email, href: `mailto:${email}`, hint: "Replies within 1 hour" });
  if (whatsapp) cards.push({ label: "WhatsApp", value: whatsapp, href: `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`, hint: "Chat with us directly" });
  if (address || city) cards.push({ label: "Visit", value: city || address, href: `https://maps.google.com/?q=${encodeURIComponent(`${address} ${city}`.trim())}`, hint: [city, country].filter(Boolean).join(", ") || address });

  return (
    <>
      <section className="border-b-2 border-ink bg-yellow">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <Eyebrow>Say hello</Eyebrow>
            <h1 className="mt-6 font-display text-[56px] font-bold leading-[1] tracking-tight text-ink md:text-[88px]">
              Get in <span className="text-brand">touch.</span>
            </h1>
            <p className="mt-7 text-[16px] font-medium leading-relaxed text-ink/85 md:text-[18px]">
              Questions about a booking, trade account, or something bespoke? We&rsquo;re on hand Tue–Sun — drop us a line.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-6 py-16">
        {cards.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <ContactCard key={c.label} {...c} />
            ))}
          </div>
        ) : null}

        {socials.length > 0 ? (
          <div className="mt-10 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
              Follow us
            </span>
            {socials.map((soc) => (
              <a
                key={soc.key}
                href={soc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-ink/15 bg-paper px-4 py-1.5 text-[12px] font-bold text-ink transition-colors hover:border-ink hover:bg-yellow"
              >
                {soc.label}
              </a>
            ))}
          </div>
        ) : null}

        <div className="mt-16 rounded-3xl bg-ink p-10 text-paper ring-2 ring-ink md:p-16">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
                Trade &amp; events
              </div>
              <h2 className="mt-6 font-display text-[40px] font-bold leading-[1] tracking-tight md:text-[60px]">
                Something <span className="text-yellow">bigger</span> in mind?
              </h2>
              <p className="mt-7 max-w-md text-[15px] font-medium leading-relaxed text-paper/75">
                Weddings, office events, private bars — we set up trade accounts with discounted pricing, account managers, and 24/7 ordering.
              </p>
            </div>
            <div className="space-y-3">
              {email ? (
                <a href={`mailto:${email}`} className="block rounded-2xl bg-paper/[0.06] p-5 transition-colors hover:bg-yellow hover:text-ink">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow">General</div>
                  <div className="mt-1 font-display text-[22px] font-bold">{email}</div>
                </a>
              ) : null}
              {supportEmail ? (
                <a href={`mailto:${supportEmail}`} className="block rounded-2xl bg-paper/[0.06] p-5 transition-colors hover:bg-yellow hover:text-ink">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow">Support</div>
                  <div className="mt-1 font-display text-[22px] font-bold">{supportEmail}</div>
                </a>
              ) : null}
              {!email && !supportEmail ? (
                <div className="rounded-2xl bg-paper/[0.06] p-5 text-[14px] font-medium text-paper/70">
                  Add a contact email in <strong className="text-yellow">{brandName}</strong> admin → Settings → Business.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-paper p-10 ring-2 ring-ink/10 md:p-16">
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            {supportEmail ? (
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-yellow px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
                  Customer Service
                </div>
                <h3 className="mt-6 font-display text-[32px] font-bold leading-[1] tracking-tight text-ink">
                  Need help?
                </h3>
                <p className="mt-4 text-[14px] font-medium leading-relaxed text-ink/75">
                  Questions about your order or account? Our customer service team is here to help.
                </p>
                <a href={`mailto:${supportEmail}`} className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-7 text-[14px] font-bold text-yellow transition-transform hover:-translate-y-0.5">
                  Contact support
                </a>
              </div>
            ) : null}
            {email ? (
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-yellow px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
                  Complaints
                </div>
                <h3 className="mt-6 font-display text-[32px] font-bold leading-[1] tracking-tight text-ink">
                  File a complaint
                </h3>
                <p className="mt-4 text-[14px] font-medium leading-relaxed text-ink/75">
                  We take feedback seriously. If you have a complaint, please get in touch with us directly.
                </p>
                <a href={`mailto:${email}?subject=Complaint`} className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-7 text-[14px] font-bold text-yellow transition-transform hover:-translate-y-0.5">
                  Submit complaint
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

function ContactCard({ label, value, href, hint }: { label: string; value: string; href: string; hint: string }) {
  return (
    <a href={href} className="group block rounded-2xl bg-paper p-7 ring-2 ring-ink/10 transition-all hover:ring-brand">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">{label}</div>
      <div className="mt-5 font-display text-[22px] font-bold leading-tight text-ink transition-colors group-hover:text-brand">
        {value}
      </div>
      <div className="mt-3 text-[12px] font-medium text-ink-muted">{hint}</div>
    </a>
  );
}
