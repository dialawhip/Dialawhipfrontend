import Link from "next/link";
import { Eyebrow } from "@/components/shop/eyebrow";

export const metadata = { title: "About Dialawhip · Newcastle catering supplies" };

export default function AboutPage() {
  return (
    <>
      <section className="border-b-2 border-ink bg-yellow">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:py-24">
          <Eyebrow>About Dialawhip</Eyebrow>
          <h1 className="mt-6 font-display text-[56px] font-bold leading-[1] tracking-tight text-ink md:text-[96px]">
            Built in <span className="text-brand">Newcastle</span>
            <br />
            for working kitchens.
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="grid gap-14 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6 text-[16px] font-medium leading-[1.8] text-ink-soft">
            <p>
              Dialawhip was started by a pastry chef and a logistics engineer who kept running out of chargers at 2am. The suppliers were closed. The big chains wouldn&rsquo;t ship until Thursday. So we built the thing we wished existed.
            </p>
            <p>
              We hold real stock in a unit off the Quayside - chargers, tanks, syrups, coffee, packaging - and we dispatch by motorbike and electric van across the North East. Eighteen minutes from bag to door is the median. Thirty is the worst we've done.
            </p>
            <p>
              We supply bars, cafés, restaurants, wedding caterers, film-set kitchens, and the occasional very-ambitious home cook. Everything we sell for culinary use is sold under a clear statement of use — because the law says so, and because that&rsquo;s how you stay open.
            </p>
          </div>

          <aside className="space-y-7 rounded-3xl bg-ink p-8 text-paper ring-2 ring-ink">
            <Stat k="18 min" v="Median delivery time" />
            <Stat k="20 mi" v="Radius from NE1 5QQ" />
            <Stat k="100+" v="Catering accounts served" />
            <Stat k="24/7" v="Phone support line" />
          </aside>
        </div>

        <section className="mt-20 rounded-3xl bg-yellow p-10 ring-2 ring-ink md:p-14">
          <Eyebrow>Visit us</Eyebrow>
          <h2 className="mt-6 font-display text-[36px] font-bold leading-tight tracking-tight text-ink md:text-[52px]">
            38 Collingwood Street, NE1 1JF.
          </h2>
          <p className="mt-4 max-w-xl text-[15px] font-medium leading-relaxed text-ink/85">
            Our service window is open 7 days a week, 18:00–06:00 AM. Drop in, pick up in person, or place an order at the counter.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex h-13 items-center rounded-full bg-ink px-7 text-[14px] font-bold text-yellow transition-transform hover:-translate-y-0.5"
            >
              Shop now →
            </Link>
            <Link
              href="/trade"
              className="inline-flex h-13 items-center rounded-full border-2 border-ink bg-paper px-7 text-[14px] font-bold text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              Open a trade account
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="font-display text-[44px] font-bold leading-none text-yellow">{k}</div>
      <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-paper/70">{v}</div>
    </div>
  );
}
