"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import { Eyebrow } from "@/components/shop/eyebrow";

interface CheckResult {
  in_area: boolean;
  postcode_prefix?: string;
  delivery_fee_pence?: number;
  lead_time_hours?: number;
}

const ZONES = ["NE1", "NE2", "NE3", "NE4", "NE5", "NE6", "NE7", "NE8"];

export default function ServiceAreaPage() {
  const [postcode, setPostcode] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient<{ data: CheckResult }>("/api/v1/service-areas/check", {
        query: { postcode },
      });
      setResult(res.data);
    } catch (e: unknown) {
      if (e instanceof ApiRequestError) setError(e.body.message);
      else setError("Unable to check.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-16">
      <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:items-start">
        <div>
          <Eyebrow>Delivery</Eyebrow>
          <h1 className="mt-5 font-display text-[48px] font-bold leading-[1] tracking-tight text-ink md:text-[72px]">
            Do we reach
            <br />
            <span className="text-brand">your street?</span>
          </h1>
          <p className="mt-7 max-w-md text-[15px] font-medium leading-relaxed text-ink/80">
            We cover most of Newcastle upon Tyne — from the Quayside and Jesmond to Heaton, Gosforth, and out to the west. Pop in your postcode to check.
          </p>

          <form onSubmit={check} className="mt-10 flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="sr-only">Postcode</Label>
              <Input
                placeholder="NE1 4AB"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center rounded-full bg-ink px-7 text-[13px] font-bold text-yellow transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {pending ? "Checking…" : "Check"}
            </button>
          </form>

          {result ? (
            result.in_area ? (
              <div className="mt-8 rounded-2xl bg-yellow p-6 ring-2 ring-ink">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
                  Yes — we&rsquo;re on our way
                </div>
                <div className="mt-3 font-display text-[28px] font-bold text-ink">
                  Delivering to {result.postcode_prefix}
                </div>
                <div className="mt-5 flex gap-8 text-[13px] text-ink-soft">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Fee</div>
                    <div className="mt-1 font-display text-[18px] font-bold text-ink">
                      <Money pence={result.delivery_fee_pence ?? 0} />
                    </div>
                  </div>
                  {result.lead_time_hours ? (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Lead time</div>
                      <div className="mt-1 font-display text-[18px] font-bold text-ink">{result.lead_time_hours} hours</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl bg-paper p-6 ring-2 ring-ink">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-danger">
                  Not quite yet
                </div>
                <div className="mt-3 font-display text-[24px] font-bold text-ink">
                  Sorry — that postcode&rsquo;s outside our patch.
                </div>
                <p className="mt-3 text-[13px] font-medium text-ink/75">
                  Drop us a line at{" "}
                  <a href="mailto:hello@dialawhip.com" className="font-bold text-brand underline underline-offset-4">
                    hello@dialawhip.com
                  </a>{" "}
                  and we&rsquo;ll let you know when we expand.
                </p>
              </div>
            )
          ) : null}
          {error ? <p className="mt-6 text-[13px] font-medium text-danger">{error}</p> : null}
        </div>

        <div className="relative hidden md:block">
          <div className="rounded-3xl bg-ink p-10 text-paper ring-2 ring-ink">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-yellow">
              Service areas
            </div>
            <div className="mt-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/delivery-map.svg" alt="Delivery radius map covering Newcastle, Sunderland, and Durham" className="w-full h-auto"/>
            </div>
            <div className="mt-10 border-t-2 border-paper/15 pt-6 text-[13px] font-medium leading-relaxed text-paper/70">
              We deliver within a 20-mile radius of Newcastle city centre, covering Newcastle, Gateshead, Sunderland, Durham, and surrounding areas. Outside this zone? Get in touch for special event bookings.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
