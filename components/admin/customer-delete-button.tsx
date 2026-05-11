"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import { Trash2 } from "lucide-react";

export function CustomerDeleteButton({
  id,
  name,
  redirectTo,
  variant = "icon",
}: {
  id: string;
  name: string;
  redirectTo?: string;
  variant?: "icon" | "button";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete ${name}? This removes the account and cannot be undone.`)) return;
    setBusy(true);
    try {
      await apiClient(`/api/v1/admin/customers/${id}`, { method: "DELETE" });
      if (redirectTo) {
        startTransition(() => {
          router.push(redirectTo);
          router.refresh();
        });
      } else {
        router.refresh();
      }
    } catch (e) {
      const message = e instanceof ApiRequestError ? e.body.message : "Could not delete customer.";
      alert(message);
      setBusy(false);
    }
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={onDelete}
        disabled={busy || pending}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-danger px-4 text-[12px] font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        {busy || pending ? "Deleting…" : "Delete customer"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy || pending}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-yellow hover:text-danger disabled:opacity-50"
      aria-label={`Delete ${name}`}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
