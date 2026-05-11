import Link from "next/link";
import { Eyebrow } from "@/components/shop/eyebrow";
import { PostcodeChecker } from "@/components/shop/postcode-checker";

export const metadata = { title: "Delivery · Dialawhip" };

const TIERS = [
  { name: "Standard", price: "Included", eta: "18–35 min", blurb: "Our default service across the North East. First-come-first-served dispatch." },
  { name: "Priority", price: "+£5", eta: "10–20 min", blurb: "Jumps the dispatch queue. Recommended if service is mid-rush." },
  { name: "Super-priority", price: "+£15", eta: "8–15 min", blurb: "Dedicated rider dispatched immediately. Genuine emergencies only." },
];

const ZONES = [
  { prefix: "NE1–NE4", name: "City core, Shieldfield, Jesmond", eta: "18 min" },
  { prefix: "NE5–NE8", name: "West End, Walker, Gateshead", eta: "22 min" },
  { prefix: "NE9–NE13", name: "Low Fell, Team Valley, Longbenton", eta: "28 min" },
  { prefix: "NE15, NE20", name: "Denton, Ponteland", eta: "30 min" },
  { prefix: "NE25–NE30", name: "Whitley Bay, North Shields, Tynemouth", eta: "35 min" },
  { prefix: "NE31–NE34", name: "South Shields, Jarrow, Hebburn", eta: "40 min" },
  { prefix: "SR1–SR6", name: "Sunderland, Roker, Washington", eta: "45 min" },
  { prefix: "DH1–DH9", name: "Durham, Chester-le-Street, Stanley", eta: "55 min" },
];

export default function DeliveryPage() {
  return (
    <>
      <section className="border-b-2 border-ink bg-yellow">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:gap-14 md:py-24">
          <div>
            <Eyebrow>Delivery &amp; coverage</Eyebrow>
            <h1 className="mt-6 font-display text-[56px] font-bold leading-[1] tracking-tight text-ink md:text-[96px]">
              Fast,
              <br />
              <span className="text-brand">always.</span>
            </h1>
            <p className="mt-7 max-w-md text-[16px] font-medium leading-relaxed text-ink/85 md:text-[18px]">
              We hold stock in Newcastle and dispatch by motorbike and electric van. Median time bag-to-door: <strong className="text-ink">18 minutes</strong>.
            </p>
          </div>
          <div className="flex items-center">
            <div className="w-full rounded-3xl bg-paper p-1 ring-2 ring-ink">
              <PostcodeChecker />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-20">
        <h2 className="font-display text-[36px] font-bold leading-tight tracking-tight text-ink md:text-[52px]">
          Three tiers, <span className="text-brand">every postcode.</span>
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.name} className="rounded-2xl bg-paper p-7 ring-2 ring-ink/10 transition-all hover:ring-brand">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-[24px] font-bold text-ink">{t.name}</h3>
                <span className="font-display text-[20px] font-bold text-brand">{t.price}</span>
              </div>
              <div className="mt-4 inline-flex items-center rounded-full bg-yellow px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink">
                ETA · {t.eta}
              </div>
              <p className="mt-5 text-[14px] font-medium leading-relaxed text-ink-soft">{t.blurb}</p>
            </div>
          ))}
        </div>

        <section className="mt-20 rounded-3xl bg-ink p-8 text-paper ring-2 ring-ink md:p-12">
          <h2 className="font-display text-[28px] font-bold leading-tight md:text-[40px]">
            Zones &amp; typical ETAs
          </h2>
          <div className="mt-8 overflow-hidden rounded-2xl bg-paper">
            <table className="w-full text-[14px]">
              <thead className="bg-yellow text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
                <tr>
                  <th className="px-6 py-4 text-left">Postcode</th>
                  <th className="px-6 py-4 text-left">Covering</th>
                  <th className="px-6 py-4 text-right">Standard ETA</th>
                </tr>
              </thead>
              <tbody>
                {ZONES.map((z) => (
                  <tr key={z.prefix} className="border-t-2 border-ink/10 text-ink">
                    <td className="px-6 py-4 font-display text-[15px] font-bold">{z.prefix}</td>
                    <td className="px-6 py-4 font-medium text-ink-soft">{z.name}</td>
                    <td className="px-6 py-4 text-right font-bold text-brand">{z.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-[13px] font-medium text-paper/70">
            Outside our zone? We can courier next-day across the UK -
            <Link href="/contact" className="ml-1 font-bold text-yellow underline underline-offset-4">get in touch</Link>.
          </p>
        </section>
      </section>
    </>
  );
}
