import Link from "next/link";
import { Eyebrow } from "@/components/shop/eyebrow";

export const metadata = { title: "Trade accounts · Dialawhip" };

export default function TradePage() {
  return (
    <>
      <section className="border-b-2 border-ink bg-yellow">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:py-24">
          <Eyebrow>For businesses</Eyebrow>
          <h1 className="mt-6 font-display text-[56px] font-bold leading-[1] tracking-tight text-ink md:text-[96px]">
            Stock up like
            <br />
            <span className="text-brand">a pro.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-[16px] font-medium leading-relaxed text-ink/85 md:text-[18px]">
            A Dialawhip trade account gets your kitchen or bar discounted pricing, 30-day invoicing, priority dispatch, and a dedicated account manager. Free to open.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="grid gap-5 md:grid-cols-2">
          <Benefit n="01" title="Bulk pricing" body="Up to 22% off list on chargers, tanks and disposables for accounts above £500/month." />
          <Benefit n="02" title="Monthly invoicing" body="We bill once a month against your approved credit line — no card charges on every order." />
          <Benefit n="03" title="Priority dispatch" body="Your orders jump the queue — average 12-minute delivery across the city core." />
          <Benefit n="04" title="Dedicated support" body="A named account manager, WhatsApp line, and a 24h SLA on any complaint." />
        </div>

        <section className="mt-16 rounded-3xl bg-ink p-10 text-paper md:p-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
            Open an account
          </div>
          <h2 className="mt-6 font-display text-[40px] font-bold leading-tight tracking-tight text-paper md:text-[60px]">
            Ready when <span className="text-yellow">Businesses</span> are.
          </h2>
          <p className="mt-5 max-w-xl text-[15px] font-medium leading-relaxed text-paper/90">
            We approve most accounts inside 24 hours. Send us your trading name, companies house number, VAT number (if any), and the category of products you&rsquo;ll stock.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="mailto:trade@dialawhip.com?subject=Trade%20account%20application"
              className="inline-flex h-13 items-center rounded-full bg-yellow px-7 text-[14px] font-bold text-ink transition-transform hover:-translate-y-0.5"
            >
              Apply by email →
            </a>
            <Link
              href="/contact"
              className="inline-flex h-13 items-center rounded-full border-2 border-paper/30 px-7 text-[14px] font-bold text-paper transition-colors hover:border-paper"
            >
              Talk to our team
            </Link>
          </div>
        </section>
      </section>
    </>
  );
}

function Benefit({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-brand p-8 ring-2 ring-brand/20 transition-all hover:ring-yellow">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow">№ {n}</div>
      <h3 className="mt-6 font-display text-[26px] font-bold leading-tight text-paper">{title}</h3>
      <p className="mt-3 text-[14px] font-medium leading-relaxed text-paper/75">{body}</p>
    </div>
  );
}
