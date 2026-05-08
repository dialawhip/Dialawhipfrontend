import { ShopHeader } from "@/components/shop/header";
import { ShopFooter } from "@/components/shop/footer";
import { ShopClosedBanner } from "@/components/shop/shop-closed-banner";
import { apiServer, getCurrentUser } from "@/lib/api-server";
import { getPublicSettings, settingBool, settingString } from "@/lib/settings";
import type { Category } from "@/lib/types";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [user, settings, catsRes] = await Promise.all([
    getCurrentUser().catch(() => null),
    getPublicSettings(),
    apiServer<{ data: Category[] }>("/api/v1/categories", { auth: false }).catch(() => ({
      data: [] as Category[],
    })),
  ]);
  const categories = (catsRes.data ?? [])
    .filter((c) => c.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (settingBool(settings, "maintenance.enabled", false)) {
    const brandName = settingString(settings, "business.name", "Dialawhip");
    const message =
      settingString(settings, "maintenance.message") ||
      "We're making a few quick changes. Please check back shortly.";
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-20 text-center">
        <span className="font-display text-[36px] text-forest md:text-[48px]">{brandName}</span>
        <h1 className="mt-6 max-w-xl font-display text-[44px] leading-[1.05] text-ink md:text-[64px]">
          We&rsquo;ll be back shortly.
        </h1>
        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink-soft">{message}</p>
      </main>
    );
  }

  return (
    <>
      <div className="bg-ink text-paper">
        <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-2 px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[0.14em] sm:text-[12px]">
          <span className="text-yellow">Open from 6pm</span>
          <span aria-hidden className="text-paper/40">·</span>
          <span>Order now &amp; get free delivery on all pre-orders</span>
        </div>
      </div>
      <ShopHeader user={user} settings={settings} categories={categories} />
      {/* Visible on every customer-facing page when admin has set order.is_open = false. */}
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <ShopClosedBanner settings={settings} className="mt-4" />
      </div>
      <main className="flex-1">{children}</main>
      <ShopFooter settings={settings} categories={categories} />
    </>
  );
}
