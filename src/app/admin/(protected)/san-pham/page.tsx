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
import { ProductTableClient } from './ProductTableClient'

export const metadata = {
  title: 'Sản phẩm | Quản trị',
  description: 'Quản lý sản phẩm cửa hàng hoa.',
}

export default async function SanPhamPage() {
  let products: Awaited<ReturnType<typeof getProductsForAdmin>>
  let categories: Awaited<ReturnType<typeof getCategories>>
  try {
    ;[products, categories] = await Promise.all([getProductsForAdmin(), getCategories()])
  } catch {
    products = []
    categories = []
  }

  return (
    <Suspense fallback={<Loader />}>
      <ProductTableClient products={products} categories={categories} />
    </Suspense>
  )
}
