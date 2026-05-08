"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Image gallery for the product detail page.
 *
 * - Renders the active image as the main hero.
 * - Shows clickable thumbnails (featured + gallery) underneath.
 * - Falls back to a typographic placeholder when no images are set.
 */
export function ProductGallery({
  featured,
  gallery = [],
  alt,
  fallbackLetter,
  fallbackBg,
  fallbackInk,
  topLeftBadges,
}: {
  featured: string | null;
  gallery?: string[];
  alt: string;
  fallbackLetter: string;
  fallbackBg: string;
  fallbackInk: string;
  topLeftBadges?: React.ReactNode;
}) {
  // Compose the list, dedupe, and drop blanks.
  const all = [featured, ...gallery].filter((u): u is string => Boolean(u));
  const unique: string[] = [];
  for (const u of all) if (!unique.includes(u)) unique.push(u);

  const [active, setActive] = useState<string | null>(unique[0] ?? null);
  const showFallback = unique.length === 0;

  return (
    <div>
      <div
        className="relative aspect-square overflow-hidden rounded-[22px] paper-grain"
        style={{ backgroundColor: fallbackBg }}
      >
        {showFallback || !active ? (
          <div className="flex h-full items-center justify-center">
            <span
              className="font-display text-[240px] font-light italic leading-none opacity-95"
              style={{ color: fallbackInk }}
            >
              {fallbackLetter}
            </span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active}
            alt={alt}
            className="absolute inset-0 h-full w-full object-contain"
          />
        )}

        {topLeftBadges ? (
          <div className="absolute top-5 left-5 flex flex-wrap gap-2">{topLeftBadges}</div>
        ) : null}
      </div>

      {unique.length > 1 ? (
        <ul className="mt-4 flex gap-2.5 overflow-x-auto pb-1">
          {unique.map((src) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(src)}
                className={cn(
                  "h-20 w-20 overflow-hidden rounded-lg border-2 bg-paper transition-all",
                  active === src
                    ? "border-forest opacity-100"
                    : "hairline opacity-70 hover:opacity-100",
                )}
                aria-label="View image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
