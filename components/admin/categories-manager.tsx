"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiRequestError } from "@/lib/api-client";
import { Input, Label, FieldError } from "@/components/ui/input";
import type { Category } from "@/lib/types";
import { Plus, Trash2, Pencil, Check, X, Upload, Image as ImageIcon } from "lucide-react";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient<{ data: { url: string } }>("/api/v1/admin/categories/upload", {
    method: "POST",
    body: form,
  });
  return res.data.url;
}

export function CategoriesManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Category[]>(initial);
  const [draft, setDraft] = useState<{ name: string; slug: string; image_url: string | null }>({
    name: "",
    slug: "",
    image_url: null,
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const [createUploading, setCreateUploading] = useState(false);
  const createFileRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; slug: string; image_url: string | null }>({
    name: "",
    slug: "",
    image_url: null,
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editUploading, setEditUploading] = useState(false);

  function onEdit(c: Category) {
    setEditingId(c.id);
    setEditDraft({ name: c.name, slug: c.slug, image_url: c.image_url ?? null });
    setEditError(null);
  }

  function onCancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function onCreateUpload(file: File) {
    setCreateUploading(true);
    setErrors((e) => ({ ...e, image_url: [] }));
    try {
      const url = await uploadImage(file);
      setDraft((d) => ({ ...d, image_url: url }));
    } catch (e) {
      const message = e instanceof ApiRequestError ? e.body.message : "Upload failed";
      setErrors((cur) => ({ ...cur, image_url: [message] }));
    } finally {
      setCreateUploading(false);
    }
  }

  async function onEditUpload(file: File) {
    setEditUploading(true);
    setEditError(null);
    try {
      const url = await uploadImage(file);
      setEditDraft((d) => ({ ...d, image_url: url }));
    } catch (e) {
      setEditError(e instanceof ApiRequestError ? e.body.message : "Upload failed");
    } finally {
      setEditUploading(false);
    }
  }

  async function onSaveEdit(c: Category) {
    setEditError(null);
    try {
      const res = await apiClient<{ data: Category }>(`/api/v1/admin/categories/${c.id}`, {
        method: "PATCH",
        json: {
          name: editDraft.name,
          slug: editDraft.slug || slugify(editDraft.name),
          image_url: editDraft.image_url,
        },
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
          image_url: draft.image_url,
          sort_order: items.length,
          is_active: true,
        },
      });
      setItems((cur) => [...cur, res.data]);
      setDraft({ name: "", slug: "", image_url: null });
      setSlugTouched(false);
      if (createFileRef.current) createFileRef.current.value = "";
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
                  ...d,
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
              disabled={pending || createUploading}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-forest px-5 text-[13px] font-medium text-cream transition-colors hover:bg-forest-deep disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-4">
          <CategoryImagePreview url={draft.image_url} />
          <div className="space-y-1.5">
            <Label>Image</Label>
            <div className="flex items-center gap-2">
              <input
                ref={createFileRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onCreateUpload(f);
                }}
                className="block text-[12px] file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-[12px] file:font-bold file:text-yellow hover:file:bg-brand hover:file:text-paper"
              />
              {draft.image_url ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraft((d) => ({ ...d, image_url: null }));
                    if (createFileRef.current) createFileRef.current.value = "";
                  }}
                  className="inline-flex h-8 items-center gap-1 rounded-full border-2 border-ink/15 px-3 text-[11px] font-bold text-ink-muted hover:border-danger hover:text-danger"
                >
                  <X className="h-3 w-3" />
                  Remove
                </button>
              ) : null}
            </div>
            {createUploading ? <p className="text-[11px] text-ink-muted">Uploading…</p> : null}
            <FieldError>{errors.image_url?.[0]}</FieldError>
            <p className="text-[11px] text-ink-muted">JPEG, PNG or WebP, up to 6MB.</p>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl bg-paper ring-2 ring-ink/10">
        <table className="w-full text-[13px]">
          <thead className="border-b-2 border-ink/10 bg-yellow text-left text-[10px] font-bold uppercase tracking-[0.18em] text-ink">
            <tr>
              <th className="px-5 py-3.5">Image</th>
              <th className="px-5 py-3.5">Name</th>
              <th className="px-5 py-3.5">Slug</th>
              <th className="px-5 py-3.5">Active</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {items.map((c, idx) => {
              const isEditing = editingId === c.id;
              const imageUrl = isEditing ? editDraft.image_url : c.image_url ?? null;
              return (
                <tr key={c.id} className={idx > 0 ? "border-t-2 border-ink/10" : ""}>
                  <td className="px-5 py-3.5">
                    {isEditing ? (
                      <div className="flex flex-col items-start gap-2">
                        <CategoryImagePreview url={imageUrl} size={48} />
                        <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border-2 border-ink/15 px-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted hover:border-ink hover:text-ink">
                          <Upload className="h-3 w-3" />
                          {editUploading ? "Uploading…" : imageUrl ? "Replace" : "Upload"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) onEditUpload(f);
                            }}
                          />
                        </label>
                        {imageUrl ? (
                          <button
                            type="button"
                            onClick={() => setEditDraft((d) => ({ ...d, image_url: null }))}
                            className="text-[10px] font-medium text-ink-muted hover:text-danger"
                          >
                            Remove image
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <CategoryImagePreview url={imageUrl} size={48} />
                    )}
                  </td>
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
                          disabled={editUploading}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-success transition-colors hover:bg-success-soft disabled:opacity-50"
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
                <td colSpan={5} className="px-5 py-12 text-center font-medium italic text-ink-muted">
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

function CategoryImagePreview({ url, size = 64 }: { url: string | null | undefined; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-lg object-cover ring-2 ring-ink/10"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-lg bg-stone-soft text-ink-muted ring-2 ring-ink/10"
    >
      <ImageIcon className="h-5 w-5" />
    </div>
  );
}
