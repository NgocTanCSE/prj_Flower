'use client';

/**
 * Bảng danh mục (Client Component): tạo / chỉnh / sắp xếp / ẩn / xóa.
 * Bảng `categories` tiêu chuẩn: id, name, slug, parent_id, sort_order, active.
 */

import { Button } from '@/components/admin/Button'
import { ConfirmModal } from '@/components/admin/ConfirmModal'
import { Table } from '@/components/admin/Table'
import { createCategory, deleteCategory, getCategories } from '@/app/admin/api/actions/categories'
import type { Category } from '@/app/admin/api/actions/categories'
import React, { useEffect, useState } from 'react'

interface ClientCategoryListProps {
  categories: Category[]
}

const headers = [
  { key: 'name', label: 'Tên danh mục' },
  { key: 'slug', label: 'Slug' },
  { key: 'parent_id', label: 'Cha' },
  { key: 'sort_order', label: 'Thứ tự' },
  { key: 'active', label: 'Hiển thị' },
]

export function ClientCategoryList({ categories: _categories }: ClientCategoryListProps) {
  const [categories, setCategories] = useState<Category[]>(_categories)
  const [confirm, setConfirm] = useState<null | string>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [updated, setUpdated] = useState(false)

  useEffect(() => {
    // Làm mới danh mục sau mỗi thao tác.
    if (updated) {
      getCategories().then(setCategories).catch(console.error)
      setUpdated(false)
    }
  }, [updated])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    // Active checkbox: `'on'` nếu checked.
    formData.set('active', 'on')
    const res = await createCategory(formData)
    if (res.ok) {
      setShowCreate(false)
      setUpdated(true)
    } else {
      alert(res.error ?? 'Tạo danh mục thất bại.')
    }
  }

  const handleDelete = async () => {
    if (!confirm) return
    const res = await deleteCategory(confirm)
    setConfirm(null)
    setUpdated(true)
    void res
  }

  const filtered = categories
    .filter(
      (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase())
    )
    .map((c) => ({ ...c }) as Record<string, unknown>)

  return (
    <main className="flex flex-col gap-6">
      {/* ---- Search + Create ---- */}
      <div className="flex flex-wrap items-end gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm danh mục..."
          className="flex-1 rounded-lg border border-[#e8e1e1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8b5f65]/40"
        />
        <Button variant="secondary" size="sm">
          Tìm
        </Button>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>
          + Thêm danh mục
        </Button>
      </div>

      {/* ---- Create form ---- */}
      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-lg border border-[#e8e1e1] bg-[#faf5fa] p-4">
          <h3 className="mb-4 text-sm font-semibold text-[#1a1a1a]">Thêm danh mục mới</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <input type="text" name="slug" placeholder="Slug (anchor: hinh-thuc)" required className="rounded-lg border border-[#e8e1e1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8b5f65]/40" />
            <input type="text" name="name" placeholder="Tên danh mục" required className="rounded-lg border border-[#e8e1e1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8b5f65]/40" />
            <input type="number" name="parent_id" placeholder="ID danh mục cha (tùy chọn)" className="rounded-lg border border-[#e8e1e1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8b5f65]/40" />
            <input type="number" name="sort_order" placeholder="Thứ tự" defaultValue={categories.length} className="rounded-lg border border-[#e8e1e1] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8b5f65]/40" />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-[#5b5b5b]">
            <input type="checkbox" name="active" defaultChecked className="rounded border-[#e8e1e1] text-[#8b5f65] focus:ring-[#8b5f65]" /> Hoạt động
          </label>
          <div className="mt-4 flex gap-3">
            <Button type="submit" variant="primary" size="sm">
              Tạo
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreate(false)}>
              Hủy
            </Button>
          </div>
        </form>
      )}

      {/* ---- List ---- */}
      <Table
        headers={headers}
        rows={filtered as unknown as Record<string, unknown>[]}
        empty="Chưa có danh mục nào."
      />

      <ConfirmModal
        title="Xóa danh mục?"
        message="Danh mục này sẽ bị ẩn khỏi trang chủ."
        open={!!confirm}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
        confirmLabel="Xóa"
        danger
      />
    </main>
  )
}
