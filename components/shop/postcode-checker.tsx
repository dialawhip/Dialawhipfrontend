"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Result =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "covered"; eta: string; postcode: string }
  | { state: "outside"; postcode: string }
  | { state: "invalid" };

const COVERED_PREFIXES = [
  "NE1", "NE2", "NE3", "NE4", "NE5", "NE6", "NE7", "NE8", "NE9", "NE10",
  "NE11", "NE12", "NE13", "NE15", "NE16", "NE20", "NE25", "NE26", "NE27",
  "NE28", "NE29", "NE30", "NE31", "NE32", "NE33", "NE34",
  "SR1", "SR2", "SR3", "SR4", "SR5", "SR6",
  "DH1", "DH2", "DH3", "DH4", "DH5", "DH6", "DH7", "DH8", "DH9",
];

const UK_POSTCODE = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;

/**
 * White card overlay on the dark hero. Headline reads
 * "Can we reach you in 20 minutes?" with a postcode input + Check button.
 */
export function PostcodeChecker({ tone = "card" }: { tone?: "card" | "plain" }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Result>({ state: "idle" });

  function onCheck(e: React.FormEvent) {
    e.preventDefault();
    const normalised = value.trim().toUpperCase().replace(/\s+/g, "");
    if (!UK_POSTCODE.test(normalised)) {
      setResult({ state: "invalid" });
      return;
    }
    const formatted = `${normalised.slice(0, -3)} ${normalised.slice(-3)}`;
    setResult({ state: "checking" });
    setTimeout(() => {
      const prefix = normalised.match(/^[A-Z]{1,2}\d{1,2}/)?.[0] ?? "";
      if (COVERED_PREFIXES.includes(prefix)) {
        const eta =
          ["NE1", "NE2", "NE4"].includes(prefix) ? "18 min" :
          prefix.startsWith("NE2") ? "32 min" : "24 min";
        setResult({ state: "covered", eta, postcode: formatted });
      } else {
        setResult({ state: "outside", postcode: formatted });
      }
    }, 400);
  }

  return (
    <div
      className={cn(
        "rounded-2xl bg-paper p-5",
        tone === "card" ? "shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]" : "border hairline",
      )}
    >
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-success">
        <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
        <span>Live</span>
      </div>
      <h2 className="mt-3 text-[20px] font-bold leading-tight text-ink">
        Can we reach you in 20 minutes?
      </h2>
      <p className="mt-1 text-[12px] text-ink-muted">
        Enter your postcode for a live ETA across the North East.
      </p>

      <form onSubmit={onCheck} className="mt-4 flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. NE1 5QQ"
          aria-label="Postcode"
          inputMode="text"
          autoCapitalize="characters"
          className="h-11 min-w-0 flex-1 rounded-lg border hairline bg-paper px-3.5 text-[14px] text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-lg bg-brand px-5 text-[13px] font-semibold text-paper transition-colors hover:bg-brand-deep"
        >
          Check
        </button>
      </form>

      <div className="mt-3 min-h-[40px]">
        {result.state === "idle" && (
          <p className="text-[12px] text-ink-muted">
            Covering Newcastle, Gateshead, Sunderland, Durham &amp; the wider North East.
          </p>
        )}
        {result.state === "checking" && (
          <p className="text-[12px] text-ink-muted">Checking coverage…</p>
        )}
        {result.state === "invalid" && (
          <p className="text-[12px] text-danger">
            That doesn't look like a UK postcode. Try "NE1 5QQ".
          </p>
        )}
        {result.state === "covered" && (
          <div className="flex items-center gap-3 rounded-lg bg-success-soft px-3 py-2.5 text-success">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-success text-[12px] font-bold text-paper">✓</span>
            <div className="flex-1 text-[13px]">
              <strong className="font-semibold">{result.postcode}</strong>
              <span className="ml-1.5">in zone · ETA {result.eta}</span>
            </div>
          </div>
        )}
        {result.state === "outside" && (
          <div className="rounded-lg bg-surface px-3 py-2.5">
            <div className="text-[13px] font-medium text-ink">
              {result.postcode} is outside our zone
            </div>
            <div className="mt-0.5 text-[11px] text-ink-muted">
              Order online for next-day courier across the UK.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
