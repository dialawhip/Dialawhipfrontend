"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import { Input, Label, FieldError } from "@/components/ui/input";
import type { Category } from "@/lib/types";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoriesManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Category[]>(initial);
  const [draft, setDraft] = useState({ name: "", slug: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; slug: string }>({ name: "", slug: "" });
  const [editError, setEditError] = useState<string | null>(null);

  function onEdit(c: Category) {
    setEditingId(c.id);
    setEditDraft({ name: c.name, slug: c.slug });
    setEditError(null);
  }

  function onCancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function onSaveEdit(c: Category) {
    setEditError(null);
    try {
      const res = await apiClient<{ data: Category }>(`/api/v1/admin/categories/${c.id}`, {
        method: "PATCH",
        json: { name: editDraft.name, slug: editDraft.slug || slugify(editDraft.name) },
      });
      setItems((cur) => cur.map((x) => (x.id === c.id ? { ...x, ...res.data } : x)));
      setEditingId(null);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiRequestError) {
        setEditError(e.body.message || "Could not save changes.");
      }
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setPending(true);
    try {
      const res = await apiClient<{ data: Category }>("/api/v1/admin/categories", {
        method: "POST",
        json: {
          name: draft.name,
          slug: draft.slug || slugify(draft.name),
          sort_order: items.length,
          is_active: true,
        },
      });
      setItems((cur) => [...cur, res.data]);
      setDraft({ name: "", slug: "" });
      setSlugTouched(false);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiRequestError) {
        setErrors(e.body.errors ?? { name: [e.body.message] });
      }
    } finally {
      setPending(false);
    }
  }

  async function onToggleActive(c: Category) {
    const next = !c.is_active;
    setItems((cur) => cur.map((x) => (x.id === c.id ? { ...x, is_active: next } : x)));
    try {
      await apiClient(`/api/v1/admin/categories/${c.id}`, {
        method: "PATCH",
        json: { is_active: next },
      });
    } catch {
      setItems((cur) => cur.map((x) => (x.id === c.id ? { ...x, is_active: !next } : x)));
    }
  }

  async function onDelete(c: Category) {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try {
      await apiClient(`/api/v1/admin/categories/${c.id}`, { method: "DELETE" });
      setItems((cur) => cur.filter((x) => x.id !== c.id));
      router.refresh();
    } catch (e) {
      if (e instanceof ApiRequestError) {
        alert(e.body.message);
      }
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onCreate} className="rounded-2xl bg-paper p-6 ring-2 ring-ink">
        <h2 className="font-display text-[22px] font-bold text-ink">Add a category</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              required
              value={draft.name}
              onChange={(e) => {
                const name = e.target.value;
                setDraft((d) => ({
                  name,
                  slug: slugTouched ? d.slug : slugify(name),
                }));
              }}
              placeholder="Cream chargers"
            />
            <FieldError>{errors.name?.[0]}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              value={draft.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setDraft({ ...draft, slug: e.target.value });
              }}
              placeholder={draft.name ? slugify(draft.name) : "cream-chargers"}
            />
            <p className="text-[11px] text-ink-muted">Auto-generated from name. Edit if you want a custom URL.</p>
            <FieldError>{errors.slug?.[0]}</FieldError>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-forest px-5 text-[13px] font-medium text-cream transition-colors hover:bg-forest-deep disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl bg-paper ring-2 ring-ink/10">
        <table className="w-full text-[13px]">
          <thead className="border-b-2 border-ink/10 bg-yellow text-left text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
            <tr>
              <th className="px-5 py-3.5">Name</th>
              <th className="px-5 py-3.5">Slug</th>
              <th className="px-5 py-3.5">Active</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {items.map((c, idx) => {
              const isEditing = editingId === c.id;
              return (
                <tr key={c.id} className={idx > 0 ? "border-t-2 border-ink/10" : ""}>
                  <td className="px-5 py-3.5 font-display text-[15px] font-bold text-ink">
                    {isEditing ? (
                      <Input
                        value={editDraft.name}
                        onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                        autoFocus
                      />
                    ) : (
                      c.name
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[12px] font-medium text-ink-muted">
                    {isEditing ? (
                      <Input
                        value={editDraft.slug}
                        onChange={(e) => setEditDraft((d) => ({ ...d, slug: e.target.value }))}
                        placeholder={slugify(editDraft.name)}
                      />
                    ) : (
                      c.slug
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => onToggleActive(c)}
                      disabled={isEditing}
                      className={
                        c.is_active
                          ? "inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-yellow disabled:opacity-50"
                          : "inline-flex items-center gap-1.5 rounded-full bg-stone-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted disabled:opacity-50"
                      }
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {c.is_active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {isEditing ? (
                      <div className="inline-flex items-center gap-1">
                        {editError ? (
                          <span className="mr-2 text-[11px] font-medium text-danger">{editError}</span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onSaveEdit(c)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-success transition-colors hover:bg-success-soft"
                          aria-label={`Save ${c.name}`}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={onCancelEdit}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-stone-soft"
                          aria-label={`Cancel editing ${c.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(c)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-yellow hover:text-ink"
                          aria-label={`Edit ${c.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(c)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-yellow hover:text-danger"
                          aria-label={`Delete ${c.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center font-medium italic text-ink-muted">
                  No categories yet — add your first one above.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
