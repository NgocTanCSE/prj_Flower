/**
 * Quản lý danh mục (Server Component) — submit qua Server Action.
 * Bảng `categories` (0001_init.sql): id, name, slug, parent_id, sort_order, active.
 */

import { getCategories } from '@/app/admin/api/actions/categories'
import { ClientCategoryList } from './ClientCategoryList'

export const metadata = {
  title: 'Danh mục | Quản trị',
  description: 'Quản lý danh mục sản phẩm.',
}

export default async function DanhMucPage() {
  const categories = await getCategories()

  return (
    <main className="mx-auto max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Danh mục sản phẩm</h1>
        <p className="text-sm text-[#5b5b5b]">{categories.length} danh mục</p>
      </div>
      <div className="rounded-xl border border-[#e8e1e1] bg-white p-6">
        <ClientCategoryList categories={categories} />
      </div>
    </main>
  )
}
