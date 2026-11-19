/**
 * Tạo sản phẩm mới (Server Component) — submit qua Server Action `createProduct`.
 * Truyền danh mục vào `ProductForm` (dropdown).
 */

import { ProductForm } from '@/components/admin/ProductForm'
import { createProduct } from '@/app/admin/api/actions/products'
import { getCategories } from '@/app/admin/api/actions/categories'
import { PageHeader } from '@/components/admin/PageHeader'

export const metadata = {
  title: 'Thêm sản phẩm | Quản trị',
  description: 'Thêm sản phẩm mới cho cửa hàng.',
}

export default async function NewProductPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  let loadError: string | null = null
  try {
    categories = await getCategories()
  } catch (error) {
    // Không nuốt lỗi: form vẫn render, nhưng báo rõ nguyên nhân.
    categories = []
    loadError = error instanceof Error ? error.message : 'Không thể tải danh mục.'
  }

  return (
    <div className="admin-content">
      <PageHeader
        title="Thêm sản phẩm mới"
        subtitle="Điền đầy đủ thông tin sản phẩm."
      />

      {loadError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <strong>Lỗi tải danh mục:</strong> {loadError}
        </div>
      ) : null}

      <div className="rounded-xl border border-[#e8e1e1] bg-white p-6">
        <ProductForm categories={categories} onSubmit={createProduct} submitLabel="Tạo sản phẩm" />
      </div>
    </div>
  )
}
