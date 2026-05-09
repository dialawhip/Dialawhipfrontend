"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eyebrow } from "@/components/shop/eyebrow";
import { Label } from "@/components/ui/input";
import type { IdVerification, VerificationStatus, DocType } from "@/lib/types";

type ApiIndex = {
  data: IdVerification[];
  user_status: VerificationStatus;
  verified_at: string | null;
};

const DOC_OPTIONS: { value: DocType; label: string }[] = [
  { value: "driving_licence", label: "Driving licence" },
  { value: "passport", label: "Passport" },
  { value: "residency_card", label: "Biometric residency card" },
  { value: "citizen_card", label: "CitizenCard" },
  { value: "military_id", label: "Military ID" },
];

export default function VerificationPage() {
  const [data, setData] = useState<ApiIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<DocType>("driving_licence");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/v1/me/verifications", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (res.status === 401) {
        window.location.href = "/login?next=/account/verification";
        return;
      }
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Refresh when the tab regains focus - covers the common case where
    // the customer was waiting for admin approval in another tab.
    function onFocus() { load(); }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("doc_type", docType);
      fd.append("file", file);
      const res = await fetch("/api/v1/me/verifications", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.message || `Upload failed (${res.status}).`);
        return;
      }
      setFile(null);
      await load();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-[900px] px-6 py-20 text-center text-ink-muted">Loading…</div>;
  }

  const status = data?.user_status ?? "unverified";

  // Verified users get a focused "all done" view - no upload form, no
  // "how it works" steps, no instructional copy. Just the confirmation,
  // the approval date, and a shortcut back to the shop.
  if (status === "verified") {
    return (
      <div className="mx-auto max-w-[900px] px-6 py-14">
        <nav className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-ink-muted">
          <Link href="/account" className="transition-colors hover:text-brand">Account</Link>
          <span aria-hidden>·</span>
          <span className="text-ink">ID &amp; verification</span>
        </nav>

        <div className="mt-10 rounded-3xl bg-yellow p-10 text-center ring-2 ring-ink md:p-14">
          <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-ink text-yellow">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mt-7 font-display text-[44px] font-bold leading-[1] tracking-tight text-ink md:text-[64px]">
            You&rsquo;re <span className="text-brand">verified.</span>
          </h1>
          <p className="mt-5 max-w-md mx-auto text-[15px] font-medium leading-relaxed text-ink/80">
            Your ID has been approved. You can order any age-restricted product without further checks.
          </p>
          {(() => {
            const approved = data?.data.find((v) => v.status === "approved");
            const expiresAt = approved?.expires_at ?? null;
            const verifiedAt = data?.verified_at ?? null;
            return (
              <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-ink px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-yellow">
                <span>
                  ✓ Approved {verifiedAt ? new Date(verifiedAt).toLocaleDateString("en-GB") : ""}
                </span>
                {expiresAt ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>Valid until {new Date(expiresAt).toLocaleDateString("en-GB")}</span>
                  </>
                ) : null}
              </div>
            );
          })()}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex h-13 items-center rounded-full bg-ink px-8 text-[14px] font-bold text-yellow transition-transform hover:-translate-y-0.5"
            >
              Continue shopping →
            </Link>
            <Link
              href="/account"
              className="inline-flex h-13 items-center rounded-full border-2 border-ink bg-paper px-8 text-[14px] font-bold text-ink transition-colors hover:bg-ink hover:text-yellow"
            >
              Back to account
            </Link>
          </div>
        </div>

        {data && data.data.length > 0 ? (
          <div className="mt-8 rounded-2xl bg-paper p-7 ring-2 ring-ink/10">
            <h3 className="font-display text-[18px] font-bold text-ink">Your history</h3>
            <ul className="mt-4 space-y-3 text-[13px]">
              {data.data.map((v) => (
                <li
                  key={v.id}
                  className="flex items-baseline justify-between gap-4 border-b-2 border-ink/10 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-display text-[14px] font-bold text-ink capitalize">
                      {v.doc_type.replace(/_/g, " ")}
                    </div>
                    <div className="text-[11px] font-medium text-ink-muted">
                      {new Date(v.created_at).toLocaleString("en-GB")}
                    </div>
                  </div>
                  <StatusPill status={v.status} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-14">
      <nav className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-ink-muted">
        <Link href="/account" className="transition-colors hover:text-brand">Account</Link>
        <span aria-hidden>·</span>
        <span className="text-ink">ID &amp; verification</span>
      </nav>

      <Eyebrow className="mt-8">Compliance · 18+</Eyebrow>
      <h1 className="mt-6 font-display text-[48px] font-bold leading-[1] tracking-tight text-ink md:text-[72px]">
        ID <span className="text-brand">verification.</span>
      </h1>
      <p className="mt-5 max-w-xl text-[15px] font-medium leading-relaxed text-ink/80">
        Upload one government-issued photo ID. We verify once and never ask again (unless your document expires). Usually approved inside ten minutes during operating hours.
      </p>

      <StatusBanner
        status={status}
        verifiedAt={data?.verified_at ?? null}
        rejectionReason={
          status === "rejected"
            ? data?.data.find((v) => v.status === "rejected")?.rejection_reason ?? null
            : null
        }
      />

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        {status !== "pending" ? (
          <form onSubmit={onSubmit} className="space-y-6 rounded-2xl bg-paper p-8 ring-2 ring-ink">
            <div>
              <h2 className="font-display text-[26px] font-bold text-ink">
                {status === "rejected" ? "Try again" : "Upload your ID"}
              </h2>
              <p className="mt-2 text-[13px] font-medium text-ink-muted">
                {status === "rejected"
                  ? "Take a fresh photo or scan that addresses the reviewer's note above. All four corners must be visible. No glare."
                  : "Clear photo or scan. All four corners must be visible. No glare."}
              </p>
            </div>

            <div className="space-y-3">
              <Label>Document type</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {DOC_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg p-4 text-[13px] font-bold transition-all ${
                      docType === opt.value
                        ? "bg-yellow text-ink ring-2 ring-ink"
                        : "bg-paper text-ink-soft ring-2 ring-ink/15 hover:ring-ink/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="doc_type"
                      value={opt.value}
                      checked={docType === opt.value}
                      onChange={() => setDocType(opt.value)}
                      className="accent-brand"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="id-file">File (JPG, PNG, WebP or PDF · max 8MB)</Label>
              <div className="relative rounded-2xl border-2 border-dashed border-ink/25 bg-yellow-soft/40 p-7 text-center">
                <input
                  id="id-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                {file ? (
                  <div>
                    <p className="font-display text-[18px] font-bold text-ink">{file.name}</p>
                    <p className="mt-1 text-[11px] font-medium text-ink-muted">{(file.size / 1024).toFixed(0)} KB · click to change</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-display text-[18px] font-bold text-ink">Click to choose a file</p>
                    <p className="mt-1 text-[11px] font-medium text-ink-muted">or drag and drop</p>
                  </div>
                )}
              </div>
            </div>

            {error ? (
              <div className="rounded-lg bg-danger-soft p-4 text-[13px] font-medium text-danger ring-1 ring-danger/30">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!file || uploading}
              className="inline-flex h-13 w-full items-center justify-center rounded-full bg-ink px-6 text-[14px] font-bold text-yellow transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Submit for review →"}
            </button>
            <p className="text-[11px] font-medium text-ink-muted">
              Your document is encrypted at rest and accessible only to our compliance team.
            </p>
          </form>
        ) : (
          <div className="space-y-5 rounded-2xl bg-yellow p-8 ring-2 ring-ink">
            <h2 className="font-display text-[28px] font-bold text-ink">Under review.</h2>
            <p className="text-[14px] font-medium leading-relaxed text-ink/80">
              Thanks - a compliance reviewer is looking at your document. Usually inside ten minutes during operating hours.
            </p>
            <Link
              href="/shop"
              className="inline-flex h-12 items-center rounded-full bg-ink px-7 text-[14px] font-bold text-yellow transition-transform hover:-translate-y-0.5"
            >
              Continue shopping →
            </Link>
          </div>
        )}

        <aside className="space-y-6">
          <div className="rounded-2xl bg-yellow p-7 ring-2 ring-ink">
            <h3 className="font-display text-[18px] font-bold text-ink">How it works</h3>
            <ol className="mt-5 space-y-3 text-[13px] font-medium text-ink/85">
              <Step n="1">Pick a government-issued ID you own.</Step>
              <Step n="2">Upload a clear photo or scan.</Step>
              <Step n="3">Our team reviews inside ten minutes during operating hours.</Step>
              <Step n="4">Once approved, order age-restricted items with no further checks.</Step>
            </ol>
          </div>

          <div className="rounded-2xl bg-paper p-7 ring-2 ring-ink/10">
            <h3 className="font-display text-[18px] font-bold text-ink">Your history</h3>
            {data && data.data.length > 0 ? (
              <ul className="mt-4 space-y-3 text-[13px]">
                {data.data.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-baseline justify-between gap-4 border-b-2 border-ink/10 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-display text-[14px] font-bold text-ink capitalize">
                        {v.doc_type.replace(/_/g, " ")}
                      </div>
                      <div className="text-[11px] font-medium text-ink-muted">
                        {new Date(v.created_at).toLocaleString("en-GB")}
                      </div>
                      {v.rejection_reason ? (
                        <div className="mt-1 text-[11px] font-medium text-danger">Reason: {v.rejection_reason}</div>
                      ) : null}
                    </div>
                    <StatusPill status={v.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[13px] font-medium text-ink-muted">No uploads yet.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusBanner({
  status,
  verifiedAt,
  rejectionReason,
}: {
  status: VerificationStatus;
  verifiedAt: string | null;
  rejectionReason: string | null;
}) {
  if (status === "verified") {
    return (
      <div className="mt-8 flex items-center gap-4 rounded-2xl bg-ink px-6 py-5 text-paper ring-2 ring-ink">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-yellow font-display text-[16px] font-bold text-ink">✓</span>
        <div>
          <div className="font-display text-[15px] font-bold">Account verified</div>
          <div className="mt-0.5 text-[12px] font-medium text-yellow">
            Approved {verifiedAt ? new Date(verifiedAt).toLocaleDateString("en-GB") : "-"} · valid for 2 years
          </div>
        </div>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="mt-8 rounded-2xl bg-yellow px-6 py-5 ring-2 ring-ink">
        <div className="font-display text-[15px] font-bold text-ink">Under review</div>
        <div className="mt-1 text-[12px] font-medium text-ink/75">
          Our compliance team is reviewing your upload. Usually ready in ten minutes.
        </div>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="mt-8 rounded-2xl bg-paper p-6 ring-2 ring-danger">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger text-[14px] font-bold text-paper">
            !
          </span>
          <div className="flex-1">
            <div className="font-display text-[18px] font-bold text-danger">Your last upload was rejected</div>
            {rejectionReason ? (
              <div className="mt-2 rounded-lg bg-danger-soft p-3 text-[13px] font-medium leading-relaxed text-ink">
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-danger">
                  Reviewer&rsquo;s note
                </span>
                <span className="mt-1 block">{rejectionReason}</span>
              </div>
            ) : null}
            <p className="mt-3 text-[13px] font-medium text-ink/75">
              Please upload a new photo below - fixing the issue above. Most rejections are resolved on the second try.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-8 rounded-2xl bg-paper px-6 py-5 ring-2 ring-ink/15">
      <div className="font-display text-[15px] font-bold text-ink">Not yet verified</div>
      <div className="mt-1 text-[12px] font-medium text-ink-muted">
        Upload an ID below to unlock age-restricted products.
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "pending" | "approved" | "rejected" | "expired" }) {
  const map = {
    pending: "bg-yellow text-ink ring-2 ring-ink",
    approved: "bg-ink text-yellow",
    rejected: "bg-danger-soft text-danger ring-1 ring-danger/30",
    expired: "bg-stone-soft text-ink-muted ring-1 ring-ink/15",
  } as const;
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${map[status]}`}>
      {status}
    </span>
  );
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[12px] font-bold text-yellow">{n}</span>
      <span>{children}</span>
    </li>
  );
}
