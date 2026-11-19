/**
 * Quản lý danh mục (Server Component) — submit qua Server Action.
 * Bảng `categories` (0001_init.sql): id, name, slug, parent_id, sort_order, active.
 */

import { getCategories } from '@/app/admin/api/actions/categories'
import { ClientCategoryList } from './ClientCategoryList'
import { PageHeader } from '@/components/admin/PageHeader'
import { CsvTransfer } from '@/components/admin/CsvTransfer'

export const metadata = {
  title: 'Danh mục | Quản trị',
  description: 'Quản lý danh mục sản phẩm.',
}

export default async function DanhMucPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  let loadError: string | null = null
  try {
    categories = await getCategories()
  } catch (error) {
    // Không nuốt lỗi: hiển thị banner để người dùng biết nguyên nhân.
    categories = []
    loadError = error instanceof Error ? error.message : 'Không thể tải danh mục.'
  }

  return (
    <div className="admin-content">
      <PageHeader
        title="Danh mục sản phẩm"
        subtitle={`${categories.length} danh mục`}
      />

      {loadError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <strong>Lỗi tải danh mục:</strong> {loadError}
        </div>
      ) : null}

      <CsvTransfer
        entity="categories"
        existingCategorySlugs={categories.map((category) => category.slug)}
      />

      <div className="rounded-xl border border-[#e8e1e1] bg-white p-6">
        <ClientCategoryList categories={categories} />
      </div>
    </div>
  )
}
