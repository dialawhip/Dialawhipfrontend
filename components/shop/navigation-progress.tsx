"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin top progress bar shown during every client-side navigation.
 * Hooks into anchor clicks + popstate to start, and the pathname /
 * search params changing to finish. Works even when the destination
 * route is prefetched and loading.tsx is skipped.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timers = useRef<{ tick?: number; finish?: number }>({});

  useEffect(() => {
    const t = timers.current;
    function start() {
      window.clearTimeout(t.finish);
      window.clearInterval(t.tick);
      setVisible(true);
      setProgress(8);
      t.tick = window.setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return p;
          const step = p < 30 ? 8 : p < 60 ? 4 : 1.5;
          return Math.min(90, p + step);
        });
      }, 180);
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as Element | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    }

    window.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      window.clearInterval(t.tick);
      window.clearTimeout(t.finish);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = timers.current;
    window.clearInterval(t.tick);
    const fillId = window.setTimeout(() => setProgress(100), 0);
    t.finish = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 240);
    return () => {
      window.clearTimeout(fillId);
      window.clearTimeout(t.finish);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 220ms ease" }}
    >
      <div
        className="h-full bg-[var(--color-brand,#0B1D3A)] shadow-[0_0_10px_rgba(11,29,58,0.5)]"
        style={{
          width: `${progress}%`,
          transition: "width 200ms ease",
        }}
      />
    </div>
  );
}
