import Link from "next/link";
import { getCurrentUser } from "@/lib/api-server";
import { redirect } from "next/navigation";
import type { User } from "@/lib/types";
import { Eyebrow } from "@/components/shop/eyebrow";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const firstName = user.name.split(" ")[0];

  return (
    <>
      <section className="border-b-2 border-ink bg-yellow">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:py-20">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <Eyebrow>Your account</Eyebrow>
              <h1 className="mt-6 font-display text-[44px] font-bold leading-[1] tracking-tight text-ink md:text-[72px]">
                Welcome back,
                <br />
                <span className="text-brand">{firstName}.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] font-medium leading-relaxed text-ink/80 md:text-[17px]">
                Track orders, manage your addresses, and reorder favourites - all here.
              </p>
            </div>
            <div className="hidden shrink-0 md:block">
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-ink font-display text-[36px] font-bold text-yellow ring-2 ring-ink">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-6 py-14">
        <div className="grid gap-5 md:grid-cols-3">
          <Card
            href="/account/orders"
            label="01"
            title="My orders"
            body="See what's in motion and reorder the ones that got away."
          />
          <Card
            href="/account/addresses"
            label="02"
            title="Addresses"
            body="Save delivery addresses for a quicker checkout next time."
          />
          <Card
            href="/account/verification"
            label="03"
            title="ID verification"
            body="Upload your ID once to unlock age-restricted products."
          />
          <Card
            href="/shop"
            label="04"
            title="Keep shopping"
            body="Browse the catalogue and try something new this week."
            tone="ink"
          />
          <ProfileCard user={user} />
        </div>
      </div>
    </>
  );
}

function Card({
  href,
  label,
  title,
  body,
  tone,
}: {
  href: string;
  label: string;
  title: string;
  body: string;
  tone?: "ink";
}) {
  if (tone === "ink") {
    return (
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-2xl bg-ink p-7 text-paper transition-transform hover:-translate-y-0.5"
      >
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow">№ {label}</div>
        <h2 className="mt-5 font-display text-[26px] font-bold leading-tight text-paper">{title}</h2>
        <p className="mt-2 text-[13px] font-medium leading-relaxed text-paper/75">{body}</p>
        <div className="mt-6 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-yellow">
          <span>Open</span>
          <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
        </div>
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl bg-paper p-7 ring-2 ring-ink/10 transition-all hover:ring-brand"
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">№ {label}</div>
      <h2 className="mt-5 font-display text-[26px] font-bold leading-tight text-ink transition-colors group-hover:text-brand">
        {title}
      </h2>
      <p className="mt-2 text-[13px] font-medium leading-relaxed text-ink-muted">{body}</p>
      <div className="mt-6 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/60 transition-colors group-hover:text-brand">
        <span>Open</span>
        <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-yellow opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function ProfileCard({ user }: { user: User }) {
  const verified = user.verification_status === "verified";
  return (
    <div className="rounded-2xl bg-yellow p-7 ring-2 ring-ink md:col-span-2">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Profile</div>
          <div className="mt-4 font-display text-[26px] font-bold leading-tight text-ink">{user.name}</div>
          <div className="mt-2 space-y-1 text-[14px] font-medium text-ink/80">
            <div>{user.email}</div>
            {user.phone ? <div>{user.phone}</div> : null}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span
              className={
                verified
                  ? "inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-yellow"
                  : "inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink ring-2 ring-ink"
              }
            >
              {verified ? "✓ Verified" : "○ Unverified"}
            </span>
            {!verified ? (
              <Link
                href="/account/verification"
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand underline underline-offset-4"
              >
                Verify ID →
              </Link>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 md:hidden">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-ink font-display text-[24px] font-bold text-yellow">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
