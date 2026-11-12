'use client';

/**
 * Bảng quản lý sản phẩm (Client Component): tìm kiếm, sắp xếp, xuất bản, ẩn.
 * `Product` theo bảng `products` của `0001_init.sql` (id, slug, name, price,
 * category_id, status, featured_is, views, updated_at, product_images...).
 */

import { Button } from '@/components/admin/Button'
import { ConfirmModal } from '@/components/admin/ConfirmModal'
import { Table } from '@/components/admin/Table'
import { deleteProduct, toggleProductPublish } from '@/app/admin/api/actions/products'
import type { Category } from '@/app/admin/api/actions/categories'
import Link from 'next/link'
import React, { useState } from 'react'
import { Product } from '@/app/admin/api/actions/products'

interface ProductTableClientProps {
  products: Product[]
  categories: Category[]
}

const headers = [
  { key: 'name', label: 'Tên sản phẩm' },
  { key: 'slug', label: 'Slug' },
  { key: 'price', label: 'Giá' },
  { key: 'category_name', label: 'Danh mục' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'featured_is', label: 'Nổi bật' },
  { key: 'views', label: 'Lượt xem' },
  { key: 'updated_at', label: 'Cập nhật' },
]

export function ProductTableClient({ products: _products, categories }: ProductTableClientProps) {
  const [term, setTerm] = useState('')
  const [confirm, setConfirm] = useState<null | string>(null)
  const [pending, setPending] = useState<string | null>(null)

  /** Tên danh mục theo `category_id`. */
  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? '-'

/** Định dạng hàng (cột bổ sung cho bảng). */
  const row = (r: Product) =>
    ({
      ...r,
      category_name: categoryName(r.category_id),
      price: `${(r.price as number).toLocaleString('vi-VN')}đ`,
      featured_is: r.featured_is ? '⭐' : '-',
      updated_at: new Date(r.updated_at).toLocaleDateString('vi-VN'),
    }) as Record<string, unknown>

  const filtered = React.useMemo(() => {
    if (!term.trim()) return _products
    return _products.filter(
      (p) => p.name.toLowerCase().includes(term.toLowerCase()) || p.slug.toLowerCase().includes(term.toLowerCase())
    )
  }, [term, _products])

  const handlePublish = async (id: string) => {
    setPending(id)
    const res = await toggleProductPublish(id)
    setPending(null)
    if (!res.ok) alert(res.error)
  }

  const handleDelete = async (id: string) => {
    const res = await deleteProduct(id)
    if (!res.ok) alert(res.error)
  }

  return (
    <main>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Sản phẩm</h1>
          <p className="text-sm text-[#5b5b5b]">{_products.length} sản phẩm</p>
        </div>
        <Button variant="primary">
          <Link href="/admin/san-pham/new">+ Thêm sản phẩm</Link>
        </Button>
      </div>

      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Tìm theo tên / slug..."
          className="flex-1 rounded-lg border border-[#e8e1e1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8b5f65]/40"
        />
      </div>

      <Table
        headers={headers}
        rows={filtered.map(row)}
        empty="Chưa có sản phẩm nào."
        actions={(r) => (
          <div className="flex items-center justify-end gap-3">
            <Link href={`/admin/san-pham/${String(r.id)}`}>
              <Button variant="ghost" size="sm">
                Sửa
              </Button>
            </Link>
            <button
              className="rounded-lg border border-[#e8e1e1] bg-white px-3 py-1.5 text-sm text-[#8b5f65] transition-colors
                hover:bg-[#f4eeef] disabled:opacity-40"
              onClick={() => handlePublish(String(r.id))}
              disabled={!!pending}
            >
              {pending === String(r.id) ? 'Đang tải' : r.status === 'draft' ? 'Công bố' : 'Hủy'}
            </button>
            <button
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 transition-colors
                hover:bg-red-50 disabled:opacity-40"
              onClick={() => setConfirm(String(r.id))}
              disabled={!!pending}
            >
              Xóa
            </button>
          </div>
        )}
      />

      <ConfirmModal
        title="Ẩn sản phẩm khỏi công khai?"
        message="Sản phẩm sẽ thành bản nháp draft và không hiện trên trang chủ."
        open={!!confirm}
        onConfirm={() => handleDelete(confirm!)}
        onCancel={() => setConfirm(null)}
        confirmLabel="Ẩn"
        danger
      />
    </main>
  )
}
