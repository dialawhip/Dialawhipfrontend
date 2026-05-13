"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient, ApiRequestError, randomIdempotencyKey } from "@/lib/api-client";
import { Input, Label, FieldError } from "@/components/ui/input";
import type { Category, Product, ProductVariant } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import { ProductImageManager } from "@/components/admin/product-image-manager";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

type VariantDraft = {
  id?: string;
  label: string;
  price_pounds: string;         // UX in pounds; converted to pence on submit
  sale_price_pounds: string;    // Optional sale price in pounds
  qty_multiplier: string;
  stock_count: string;
  sku: string;
  is_active: boolean;
};

function toDraft(v: ProductVariant): VariantDraft {
  return {
    id: v.id,
    label: v.label,
    price_pounds: (v.price_pence / 100).toFixed(2),
    sale_price_pounds:
      typeof v.sale_price_pence === "number" ? (v.sale_price_pence / 100).toFixed(2) : "",
    qty_multiplier: String(v.qty_multiplier),
    stock_count: v.stock_count !== null && v.stock_count !== undefined ? String(v.stock_count) : "",
    sku: v.sku ?? "",
    is_active: v.is_active,
  };
}

const EMPTY_VARIANT: VariantDraft = {
  label: "",
  price_pounds: "",
  sale_price_pounds: "",
  qty_multiplier: "1",
  stock_count: "",
  sku: "",
  is_active: true,
};

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    category_id: product?.category_id ?? categories[0]?.id ?? "",
    description: product?.description ?? "",
    price_pounds: product ? (product.price_pence / 100).toFixed(2) : "",
    sale_price_pounds:
      product && typeof product.sale_price_pence === "number"
        ? (product.sale_price_pence / 100).toFixed(2)
        : "",
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
  });
  // Once the user manually edits the slug, stop auto-syncing it from the name.
  const [slugTouched, setSlugTouched] = useState(!!product?.slug);
  const [variants, setVariants] = useState<VariantDraft[]>(
    product?.variants?.length ? product.variants.map(toDraft) : [],
  );
  const [featuredImage, setFeaturedImage] = useState<string | null>(product?.image_url ?? null);
  const [galleryImages, setGalleryImages] = useState<string[]>(product?.gallery_urls ?? []);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  function addVariant() {
    setVariants((list) => [...list, { ...EMPTY_VARIANT }]);
  }
  function removeVariant(idx: number) {
    setVariants((list) => list.filter((_, i) => i !== idx));
  }
  function updateVariant(idx: number, patch: Partial<VariantDraft>) {
    setVariants((list) => list.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setPending(true);
    try {
      const { price_pounds, sale_price_pounds, ...rest } = form;
      const body: Record<string, unknown> = {
        ...rest,
        price_pence: Math.round(Number(price_pounds || 0) * 100),
        sale_price_pence:
          sale_price_pounds === "" ? null : Math.round(Number(sale_price_pounds) * 100),
        image_url: featuredImage || null,
        gallery_urls: galleryImages,
        options: product?.options ?? null,
      };
      if (variants.length > 0) {
        body.variants = variants.map((v, i) => ({
          id: v.id,
          label: v.label,
          price_pence: Math.round(Number(v.price_pounds || 0) * 100),
          sale_price_pence:
            v.sale_price_pounds === "" ? null : Math.round(Number(v.sale_price_pounds || 0) * 100),
          qty_multiplier: Number(v.qty_multiplier || 1),
          stock_count: v.stock_count === "" ? null : Number(v.stock_count),
          sku: v.sku || null,
          sort_order: i,
          is_active: v.is_active,
        }));
      } else {
        body.variants = []; // explicit: clear all variants
      }

      if (product) {
        await apiClient(`/api/v1/admin/products/${product.id}`, {
          method: "PATCH",
          json: body,
          idempotencyKey: randomIdempotencyKey(),
        });
      } else {
        await apiClient("/api/v1/admin/products", {
          method: "POST",
          json: body,
          idempotencyKey: randomIdempotencyKey(),
        });
      }
      router.push("/admin/products");
      router.refresh();
    } catch (e: unknown) {
      if (e instanceof ApiRequestError) setErrors(e.body.errors ?? { name: [e.body.message] });
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!product || !confirm("Delete this product?")) return;
    await apiClient(`/api/v1/admin/products/${product.id}`, { method: "DELETE" });
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input
            required
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({
                ...f,
                name,
                slug: slugTouched ? f.slug : slugifyName(name),
              }));
            }}
          />
          <FieldError>{errors.name?.[0]}</FieldError>
        </div>
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input
            required
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm({ ...form, slug: e.target.value });
            }}
          />
          <p className="text-[11px] text-ink-muted">Auto-generated from name. Edit if you want a custom URL.</p>
          <FieldError>{errors.slug?.[0]}</FieldError>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="h-11 w-full rounded-md border border-ink/15 bg-paper px-3.5 text-[13px] text-ink focus:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/20"
          >
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Base price</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-ink-muted">£</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="pl-7"
              required
              value={form.price_pounds}
              onChange={(e) => setForm({ ...form, price_pounds: e.target.value })}
            />
          </div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">Used when no variant is selected.</div>
          <FieldError>{errors.price_pence?.[0]}</FieldError>
        </div>
        <div className="space-y-1.5">
          <Label>
            Sale price <span className="font-normal text-ink-muted">(optional)</span>
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-ink-muted">£</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="pl-7"
              placeholder="—"
              value={form.sale_price_pounds}
              onChange={(e) => setForm({ ...form, sale_price_pounds: e.target.value })}
            />
          </div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Must be lower than base price. Leave blank to remove sale.
          </div>
          <FieldError>{errors.sale_price_pence?.[0]}</FieldError>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <div className="rounded-md border border-ink/15 bg-paper [&_.ql-container]:min-h-[160px] [&_.ql-container]:rounded-b-md [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[160px] [&_.ql-toolbar]:rounded-t-md [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-ink/15">
          <ReactQuill theme="snow" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2.5 text-[13px] text-ink-soft">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="h-4 w-4 accent-forest"
          />
          Visible to customers
        </label>
        <label className="flex items-center gap-2.5 text-[13px] text-ink-soft">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            className="h-4 w-4 accent-forest"
          />
          Featured on home page
        </label>
      </div>

      <ProductImageManager
        featured={featuredImage}
        gallery={galleryImages}
        onFeaturedChange={setFeaturedImage}
        onGalleryChange={setGalleryImages}
      />

      <section className="rounded-lg border hairline bg-cream-deep/30 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="font-display text-[13px] italic text-clay">Pricing options</div>
            <h3 className="mt-1 font-display text-[22px] text-ink">Variants</h3>
            <p className="mt-1 max-w-xl text-[12px] text-ink-muted">
              Offer pack-size or bundle pricing (e.g. &quot;2 tanks for £80&quot;). Leave empty for a single-price product.
            </p>
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-forest px-4 text-[12px] font-medium text-cream transition-colors hover:bg-forest-deep"
          >
            <Plus className="h-3.5 w-3.5" /> Add variant
          </button>
        </div>

        {variants.length === 0 ? (
          <p className="mt-4 rounded-md border hairline bg-paper px-4 py-3 text-[12px] italic text-ink-muted">
            No variants yet. Customers will see the base price only.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {variants.map((v, idx) => (
              <div key={v.id ?? `new-${idx}`} className="rounded-md border hairline bg-paper p-4">
                <div className="grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-3 space-y-1">
                    <Label>Label</Label>
                    <Input
                      placeholder="2 tanks for £80"
                      value={v.label}
                      onChange={(e) => updateVariant(idx, { label: e.target.value })}
                      required
                    />
                    <FieldError>{errors[`variants.${idx}.label`]?.[0]}</FieldError>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label>Price (£)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="80.00"
                      value={v.price_pounds}
                      onChange={(e) => updateVariant(idx, { price_pounds: e.target.value })}
                      required
                    />
                    <FieldError>{errors[`variants.${idx}.price_pence`]?.[0]}</FieldError>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label>Sale (£)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="—"
                      value={v.sale_price_pounds}
                      onChange={(e) => updateVariant(idx, { sale_price_pounds: e.target.value })}
                    />
                    <FieldError>{errors[`variants.${idx}.sale_price_pence`]?.[0]}</FieldError>
                  </div>
                  <div className="md:col-span-1 space-y-1">
                    <Label>Units</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={v.qty_multiplier}
                      onChange={(e) => updateVariant(idx, { qty_multiplier: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="—"
                      value={v.stock_count}
                      onChange={(e) => updateVariant(idx, { stock_count: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label>SKU</Label>
                    <Input
                      value={v.sku}
                      onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[12px] text-ink-soft">
                    <input
                      type="checkbox"
                      checked={v.is_active}
                      onChange={(e) => updateVariant(idx, { is_active: e.target.checked })}
                      className="h-4 w-4 accent-forest"
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => removeVariant(idx)}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-[#8B2A1D] transition-colors hover:text-[#731F13]"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between border-t hairline pt-6">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center rounded-full bg-forest px-6 text-[13px] font-medium text-cream transition-colors hover:bg-forest-deep disabled:opacity-50"
        >
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        {product ? (
          <button type="button" onClick={onDelete} className="text-[12px] font-medium text-[#8B2A1D] transition-colors hover:text-[#731F13]">
            Delete product
          </button>
        ) : null}
      </div>
    </form>
  );
}
