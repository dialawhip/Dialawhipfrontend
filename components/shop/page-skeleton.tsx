import { Logo } from "./logo";
import { cn } from "@/lib/cn";

const SHIMMER = "relative overflow-hidden bg-cream-deep before:absolute before:inset-0 before:-translate-x-full before:bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.55)_50%,transparent_65%)] before:animate-[skeleton-shimmer_1.6s_infinite]";

export function SkeletonBox({ className }: { className?: string }) {
  return <div className={cn("rounded-md", SHIMMER, className)} aria-hidden />;
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("h-3 rounded-full", SHIMMER, className)} aria-hidden />;
}

/**
 * Branded full-page skeleton shown via Next.js loading.tsx files during
 * route transitions. The logo gives users an immediate sense of the
 * brand while the page-segment streams in.
 */
export function PageSkeleton({
  variant = "default",
}: {
  variant?: "default" | "product-grid" | "product-detail" | "checkout" | "account";
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-live="polite"
      className="mx-auto w-full max-w-[1280px] px-6 py-10 sm:py-14"
    >
      <div className="flex items-center justify-between">
        <div className="opacity-30">
          <Logo />
        </div>
        <SkeletonBox className="h-3 w-24" />
      </div>

      {variant === "product-grid" ? <ProductGridSkeleton /> : null}
      {variant === "product-detail" ? <ProductDetailSkeleton /> : null}
      {variant === "checkout" ? <CheckoutSkeleton /> : null}
      {variant === "account" ? <AccountSkeleton /> : null}
      {variant === "default" ? <DefaultSkeleton /> : null}

      <span className="sr-only">Loading…</span>
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <div className="mt-10 space-y-8">
      <SkeletonBox className="h-12 w-3/4 max-w-xl" />
      <SkeletonLine className="w-1/2" />
      <SkeletonLine className="w-2/3" />
      <SkeletonBox className="mt-8 h-48 w-full" />
      <div className="grid gap-6 sm:grid-cols-3">
        <SkeletonBox className="h-32" />
        <SkeletonBox className="h-32" />
        <SkeletonBox className="h-32" />
      </div>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="mt-10 space-y-8">
      <SkeletonBox className="h-10 w-1/2 max-w-md" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <SkeletonBox className="aspect-square w-full" />
            <SkeletonLine className="w-3/4" />
            <SkeletonLine className="w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="mt-10 grid gap-10 md:grid-cols-2">
      <SkeletonBox className="aspect-square w-full" />
      <div className="space-y-5">
        <SkeletonBox className="h-10 w-3/4" />
        <SkeletonLine className="w-1/2" />
        <SkeletonLine className="w-2/3" />
        <SkeletonBox className="h-12 w-40" />
        <SkeletonBox className="h-12 w-full max-w-md" />
        <SkeletonBox className="h-32 w-full" />
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-5">
        <SkeletonBox className="h-8 w-1/3" />
        <SkeletonBox className="h-14 w-full" />
        <SkeletonBox className="h-14 w-full" />
        <SkeletonBox className="h-14 w-full" />
        <SkeletonBox className="h-32 w-full" />
      </div>
      <div className="space-y-4 rounded-lg border hairline p-6">
        <SkeletonBox className="h-6 w-1/2" />
        <SkeletonLine className="w-2/3" />
        <SkeletonLine className="w-1/2" />
        <SkeletonLine className="w-3/4" />
        <SkeletonBox className="mt-4 h-12 w-full" />
      </div>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="mt-10 grid gap-10 md:grid-cols-[240px_1fr]">
      <div className="space-y-3">
        <SkeletonLine className="w-3/4" />
        <SkeletonLine className="w-2/3" />
        <SkeletonLine className="w-1/2" />
        <SkeletonLine className="w-2/3" />
      </div>
      <div className="space-y-5">
        <SkeletonBox className="h-10 w-1/3" />
        <SkeletonBox className="h-28 w-full" />
        <SkeletonBox className="h-28 w-full" />
      </div>
    </div>
  );
}
