"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import type { Category, User } from "@/lib/types";
import type { PublicSettings } from "@/lib/settings";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

interface ShopLink {
  name: string;
  href: string;
  hot?: boolean;
  sale?: boolean;
}

const FALLBACK_SHOP_LINKS: ShopLink[] = [
  { name: "Cream chargers", href: "/shop/cream-chargers", hot: true },
  { name: "Smartwhip tanks", href: "/shop/smartwhip-tanks", hot: true },
  { name: "MAXXI tanks", href: "/shop/maxxi-tanks" },
  { name: "Whippers", href: "/shop/whippers" },
  { name: "Whip bundles", href: "/shop/whip-bundles", sale: true },
];

const HOT_SLUGS = new Set(["cream-chargers", "smartwhip-tanks"]);
const SALE_SLUGS = new Set(["whip-bundles"]);

export function ShopHeader({
  user,
  settings,
  categories,
}: {
  user: User | null;
  settings?: PublicSettings;
  categories?: Category[];
}) {
  const brandName = (settings?.["business.name"] as string) || "Dialawhip";
  const logoUrl = (settings?.["branding.logo_url"] as string) || "";
  const phone = (settings?.["business.phone"] as string) || "";
  const whatsapp = (settings?.["business.whatsapp"] as string) || "";

  const shopLinks = useMemo<ShopLink[]>(() => {
    if (!categories || categories.length === 0) return FALLBACK_SHOP_LINKS;
    return categories.map((c) => ({
      name: c.name,
      href: `/shop/${c.slug}`,
      hot: HOT_SLUGS.has(c.slug),
      sale: SALE_SLUGS.has(c.slug),
    }));
  }, [categories]);

  const count = useCart((s) => s.count());
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const shopRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) setShopOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShopOpen(false);
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Top yellow announcement strip */}
      {phone ? (
        <div className="hidden border-b-2 border-ink bg-yellow text-ink md:block">
          <div className="mx-auto flex h-9 max-w-[1280px] items-center justify-between px-6 text-[11px] font-bold uppercase tracking-[0.16em]">
            <span>20-minute delivery · North East · Tue–Sun</span>
            <div className="flex items-center gap-5">
              <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:underline">
                ☎ {phone}
              </a>
              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:h-18 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brandName} className="h-8 w-auto sm:h-10" />
            ) : (
              <span className="font-display text-[24px] font-bold leading-none tracking-tight text-ink sm:text-[26px]">
                {brandName}<span className="text-brand">.</span>
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] font-bold text-ink md:flex">
            <div ref={shopRef} className="relative">
              <button
                onClick={() => setShopOpen((v) => !v)}
                className="inline-flex items-center gap-1 transition-colors hover:text-brand"
                aria-expanded={shopOpen}
              >
                Shop
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className={cn("transition-transform", shopOpen && "rotate-180")}>
                  <path d="M2 4.5 6 8.5 10 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {shopOpen ? (
                <div className="absolute left-1/2 top-[calc(100%+12px)] w-[520px] -translate-x-1/2 overflow-hidden rounded-2xl bg-paper ring-2 ring-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)]">
                  <div className="grid grid-cols-2 gap-px bg-ink/10">
                    {shopLinks.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setShopOpen(false)}
                        className="group flex items-center justify-between bg-paper px-4 py-3 text-[13px] font-medium text-ink transition-colors hover:bg-yellow"
                      >
                        <span>{l.name}</span>
                        {l.hot ? (
                          <span className="rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-yellow">
                            Hot
                          </span>
                        ) : l.sale ? (
                          <span className="rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-yellow">
                            Sale
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/shop"
                    onClick={() => setShopOpen(false)}
                    className="block bg-ink px-5 py-3 text-center text-[12px] font-bold uppercase tracking-[0.16em] text-yellow transition-colors hover:bg-brand"
                  >
                    Full catalogue →
                  </Link>
                </div>
              ) : null}
            </div>
            <Link href="/delivery" className="transition-colors hover:text-brand">Delivery</Link>
            <Link href="/trade" className="transition-colors hover:text-brand">Trade</Link>
            <Link href="/contact" className="transition-colors hover:text-brand">Contact</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/cart"
              className="group relative inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-3 text-[13px] font-bold text-ink transition-colors hover:bg-yellow sm:gap-2 sm:px-4"
              aria-label="Cart"
            >
              <BagIcon />
              <span className="hidden sm:inline">Bag</span>
              {mounted && count > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-paper tabular-nums">
                  {count}
                </span>
              ) : null}
            </Link>

            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-ink bg-paper px-4 text-[13px] font-bold text-ink transition-colors hover:bg-yellow"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-paper">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
                </button>
                {open ? (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl bg-paper ring-2 ring-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)]">
                    <MenuLink href="/account">Account</MenuLink>
                    <MenuLink href="/account/orders">My orders</MenuLink>
                    <MenuLink href="/account/addresses">Addresses</MenuLink>
                    <MenuLink href="/account/verification">ID &amp; verification</MenuLink>
                    {(user.role === "admin" || user.role === "staff") && (
                      <MenuLink href="/admin" tone="brand">Admin</MenuLink>
                    )}
                    {user.role === "driver" && (
                      <MenuLink href="/driver" tone="brand">Driver</MenuLink>
                    )}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await fetch("/api/auth/logout", { method: "POST" });
                        window.location.href = "/";
                      }}
                      className="border-t-2 border-ink/10"
                    >
                      <button
                        type="submit"
                        className="block w-full px-4 py-2.5 text-left text-[13px] font-medium text-ink-muted transition-colors hover:bg-yellow hover:text-ink"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden h-10 items-center rounded-full bg-ink px-5 text-[13px] font-bold text-paper transition-colors hover:bg-brand md:inline-flex"
              >
                Sign in
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink transition-colors hover:bg-yellow md:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <BurgerIcon />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <MobileDrawer
          user={user}
          onClose={() => setMobileOpen(false)}
          brandName={brandName}
          logoUrl={logoUrl}
          phone={phone}
          whatsapp={whatsapp}
          shopLinks={shopLinks}
        />
      ) : null}
    </>
  );
}

function MobileDrawer({
  user, onClose, brandName, logoUrl, phone, whatsapp, shopLinks,
}: {
  user: User | null;
  onClose: () => void;
  brandName: string;
  logoUrl: string;
  phone: string;
  whatsapp: string;
  shopLinks: ShopLink[];
}) {
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-paper shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b-2 border-ink bg-yellow px-5 py-4">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brandName} className="h-9 w-auto" />
            ) : (
              <span className="font-display text-[22px] font-bold leading-none text-ink">
                {brandName}<span className="text-brand">.</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-paper text-ink"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {user ? (
            <div className="border-b-2 border-ink/10 bg-paper px-5 py-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand font-display text-[15px] font-bold text-paper">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <div className="font-display text-[16px] font-bold text-ink">{user.name}</div>
                  <div className="text-[12px] text-ink-muted">{user.email}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-b-2 border-ink/10 bg-paper px-5 py-5">
              <Link
                href="/login"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-ink text-[14px] font-bold text-paper"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-full border-2 border-ink bg-paper text-[14px] font-bold text-ink"
              >
                Create an account
              </Link>
            </div>
          )}

          <nav className="px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Shop by category</div>
            <div className="mt-3 space-y-1">
              {shopLinks.map((l) => (
                <DrawerLink key={l.href} href={l.href}>
                  <span>{l.name}</span>
                  {l.hot ? (
                    <span className="rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-yellow">Hot</span>
                  ) : l.sale ? (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-yellow">Sale</span>
                  ) : null}
                </DrawerLink>
              ))}
              <DrawerLink href="/shop" highlight>
                <span>All products →</span>
              </DrawerLink>
            </div>
          </nav>

          <nav className="border-t-2 border-ink/10 px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">{brandName}</div>
            <div className="mt-3 space-y-1">
              <DrawerLink href="/delivery"><span>Delivery &amp; ETAs</span></DrawerLink>
              <DrawerLink href="/trade"><span>Trade accounts</span></DrawerLink>
              <DrawerLink href="/about"><span>About us</span></DrawerLink>
              <DrawerLink href="/contact"><span>Contact</span></DrawerLink>
              {phone ? (
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-bold text-brand hover:bg-yellow"
                >
                  <span>Call {phone}</span>
                </a>
              ) : null}
              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-bold text-brand hover:bg-yellow"
                >
                  <span>WhatsApp {whatsapp}</span>
                </a>
              ) : null}
            </div>
          </nav>

          {user ? (
            <nav className="border-t-2 border-ink/10 px-5 py-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">Your account</div>
              <div className="mt-3 space-y-1">
                <DrawerLink href="/account"><span>Account</span></DrawerLink>
                <DrawerLink href="/account/orders"><span>My orders</span></DrawerLink>
                <DrawerLink href="/account/addresses"><span>Addresses</span></DrawerLink>
                <DrawerLink href="/account/verification"><span>ID &amp; verification</span></DrawerLink>
                {(user.role === "admin" || user.role === "staff") ? (
                  <DrawerLink href="/admin" highlight><span>Admin dashboard →</span></DrawerLink>
                ) : null}
                {user.role === "driver" ? (
                  <DrawerLink href="/driver" highlight><span>Driver app →</span></DrawerLink>
                ) : null}
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/";
                }}
                className="mt-2"
              >
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center rounded-full border-2 border-ink/20 bg-paper text-[13px] font-bold text-ink-muted transition-colors hover:border-ink"
                >
                  Sign out
                </button>
              </form>
            </nav>
          ) : null}
        </div>

        <div className="border-t-2 border-ink bg-yellow px-5 py-4 text-[11px] font-bold leading-relaxed text-ink">
          <p>18+ only. For culinary use.</p>
          <p className="mt-1 text-ink/75">We reserve the right to refuse supply.</p>
        </div>
      </aside>
    </div>
  );
}

function DrawerLink({
  href,
  children,
  highlight,
}: {
  href: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] transition-colors",
        highlight
          ? "bg-yellow font-bold text-ink"
          : "font-medium text-ink-soft hover:bg-yellow hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

function MenuLink({ href, children, tone }: { href: string; children: React.ReactNode; tone?: "brand" }) {
  return (
    <Link
      href={href}
      className={cn(
        "block px-4 py-2.5 text-[13px] transition-colors hover:bg-yellow",
        tone === "brand" ? "font-bold text-brand" : "font-medium text-ink-soft",
      )}
    >
      {children}
    </Link>
  );
}

function BagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function BurgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}
