'use client';

/**
 * ProductForm – form tạo/cập nhật sản phẩm (real schema).
 *
 * Layout:
 *   name, slug, short_desc, description, price, old_price, category_id,
 *   weight, featured_is (nổi bật), sort_order, status (draft/published),
 *   is_active (công khai), hình (upload hoặc paste URL).
 */

import React, { useCallback, useRef, useState } from 'react';
import { Button } from './Button';
import type { Product } from '@/app/admin/api/actions/products';

export interface ProductFormProps {
  product?: Product;
  /** Các danh mục (dropdown) – palais được bởi `ProductForm`. */
  categories: Array<{ id: number; name: string; slug: string; parent_id: number | null; sort_order: number; active: boolean }>;
  onSubmit: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  submitLabel?: string;
  className?: string;
}

export function ProductForm({ product, categories, onSubmit, submitLabel = 'Lưu', className = '' }: ProductFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string>(product?.product_images?.find((i) => i.is_primary)?.url ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await onSubmit(formData);
    setPending(false);
    setError(result.ok ? null : result.error ?? null);
    if (result.ok) {
      formRef.current?.reset();
      setPreview('');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = formRef.current?.querySelector('input[name="image"]') as HTMLInputElement | null
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
      }
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={className} noValidate>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Ảnh */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-[#5b5b5b]">Ảnh sản phẩm</label>
        <div
          className="relative flex h-60 items-center justify-center rounded-xl border-2 border-dashed border-[#e8e1e1]
            bg-[#faf5fa] transition-colors hover:border-[#8b5f65]"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {preview ? (
            <img src={preview} alt="Xem trước ảnh sản phẩm" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <span className="text-sm text-[#5b5b5b]">Kéo thả ảnh vào đây, hoặc nhấn chọn</span>
          )}
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <div className="mt-3">
          <input
            type="url"
            name="image_url"
            defaultValue={preview}
            placeholder="Hoặc dán URL ảnh (Unsplash, CDN...)"
            className="w-full rounded-lg border border-[#e8e1e1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8b5f65]/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field label="Tên sản phẩm" name="name" required defaultValue={product?.name ?? ''} />
        <Field label="Slug (URL thân thiện)" name="slug" required defaultValue={product?.slug ?? ''} />
        <Field label="Giá" name="price" type="number" required defaultValue={product?.price ?? 0} />
        <Field label="Giá cũ" name="old_price" type="number" defaultValue={product?.old_price ?? 0} />
        <Field label="Danh mục" name="category_id" type="number" required defaultValue={product?.category_id ?? 0} />
        <Field label="Cân nặng (kg)" name="weight" type="number" step="0.01" defaultValue={product?.weight ?? 0} />
        <Field label="Thứ tự" name="sort_order" type="number" defaultValue={product?.sort_order ?? 0} />
        <Field label="Trạng thái" name="status" as="select" options={['draft', 'published']} defaultValue={product?.status ?? 'draft'} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Field label="Mô tả ngắn" name="short_desc" defaultValue={product?.short_desc ?? ''} />
        <Field label="Mô tả chi tiết" name="description" as="textarea" rows={4} defaultValue={product?.description ?? ''} />
      </div>

      <div className="mt-6 flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-[#5b5b5b]">
          <input type="checkbox" name="featured_is" defaultChecked={product?.featured_is ?? false} className="rounded border-[#e8e1e1] text-[#8b5f65] focus:ring-[#8b5f65]" />
          Nổi bật
        </label>
        <label className="flex items-center gap-2 text-sm text-[#5b5b5b]">
          <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="rounded border-[#e8e1e1] text-[#8b5f65] focus:ring-[#8b5f65]" />
          Hiển thị công khai
        </label>
      </div>

      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="mt-6 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={() => formRef.current?.reset()}>
          Làm mới
        </Button>
      </div>
    </form>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string
    as?: 'input' | 'textarea' | 'select'
    options?: string[]
    rows?: number
  }

function Field({ label, options, as = 'input', rows = 3, ...rest }: FieldProps) {
  const base = 'w-full rounded-lg border border-[#e8e1e1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8b5f65]/40'
  if (as === 'textarea') {
    return (
      <div>
        {label && <label className="mb-2 block text-sm font-medium text-[#5b5b5b]">{label}</label>}
        <textarea className={base} rows={rows} {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      </div>
    )
  }
  if (as === 'select') {
    return (
      <div>
        {label && <label className="mb-2 block text-sm font-medium text-[#5b5b5b]">{label}</label>}
        <select className={base} {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)}>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    )
  }
  return (
    <div>
      {label && <label className="mb-2 block text-sm font-medium text-[#5b5b5b]">{label}</label>}
      <input className={base} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
    </div>
  )
}
