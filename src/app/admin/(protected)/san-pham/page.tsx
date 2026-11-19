/**
 * Danh sách sản phẩm (Server Component).
 *
 * Truy vấn trực tiếp từ Supabase (chỉ SELECT, `RLS` cho phép read).
 * Cử về client component `ProductTableClient` (tìm kiếm / filter / toggle).
 *
 * Bảng `products` (0001_init.sql): id, slug, name, price, category_id, status,
 * featured_is, sort_order, views, is_active, created_at, updated_at.
 */

import { getProductsForAdmin } from '@/app/admin/api/actions/products'
import { getCategories } from '@/app/admin/api/actions/categories'
import { Suspense } from 'react'
import { Loader } from '@/components/admin/Loader'
import { PageHeader } from '@/components/admin/PageHeader'
import { ButtonLink } from '@/components/admin/ButtonLink'
import { CsvTransfer } from '@/components/admin/CsvTransfer'
import { ProductTableClient } from './ProductTableClient'

export const metadata = {
  title: 'Sản phẩm | Quản trị',
  description: 'Quản lý sản phẩm cửa hàng hoa.',
}

export default async function SanPhamPage() {
  let products: Awaited<ReturnType<typeof getProductsForAdmin>>
  let categories: Awaited<ReturnType<typeof getCategories>>
  let loadError: string | null = null
  try {
    ;[products, categories] = await Promise.all([getProductsForAdmin(), getCategories()])
  } catch (error) {
    // Không nuốt lỗi: truyền lên client để hiển thị banner rõ nguyên nhân.
    products = []
    categories = []
    loadError = error instanceof Error ? error.message : 'Không thể tải danh sách sản phẩm.'
  }

  return (
    <Suspense fallback={<Loader />}>
      <div className="admin-content">
        <PageHeader
          title="Sản phẩm"
          subtitle={`${products.length} sản phẩm`}
          action={
            <ButtonLink href="/admin/san-pham/new">+ Thêm sản phẩm</ButtonLink>
          }
        />

        {loadError ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <strong>Lỗi tải sản phẩm:</strong> {loadError}
          </div>
        ) : null}

        <CsvTransfer
          entity="products"
          existingCategorySlugs={categories.map((category) => category.slug)}
        />

        <ProductTableClient products={products} categories={categories} />
      </div>
    </Suspense>
  )
}
