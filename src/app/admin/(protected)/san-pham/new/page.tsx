/**
 * Tạo sản phẩm mới (Server Component) — submit qua Server Action `createProduct`.
 * Truyền danh mục vào `ProductForm` (dropdown).
 */

import { ProductForm } from '@/components/admin/ProductForm'
import { createProduct } from '@/app/admin/api/actions/products'
import { getCategories } from '@/app/admin/api/actions/categories'

export const metadata = {
  title: 'Thêm sản phẩm | Quản trị',
  description: 'Thêm sản phẩm mới cho cửa hàng.',
}

export default async function NewProductPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  try {
    categories = await getCategories()
  } catch {
    // Supabase chưa cấu hình (hoặc chưa đăng nhập): danh sách rời.
    categories = []
  }

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Thêm sản phẩm mới</h1>
        <p className="text-sm text-[#5b5b5b]">Điền đầy đủ thông tin sản phẩm.</p>
      </div>
      <div className="rounded-xl border border-[#e8e1e1] bg-white p-6">
        <ProductForm categories={categories} onSubmit={createProduct} submitLabel="Tạo sản phẩm" />
      </div>
    </main>
  )
}
