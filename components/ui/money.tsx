import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

export function Money({
  pence,
  className,
}: {
  pence: number | null | undefined;
  className?: string;
}) {
  // Guard against undefined / null / NaN - show £0.00 rather than £NaN
  // so empty data sets render cleanly.
  const safe = typeof pence === "number" && Number.isFinite(pence) ? pence : 0;
  return <span className={cn("number", className)}>{formatMoney(safe)}</span>;
}
