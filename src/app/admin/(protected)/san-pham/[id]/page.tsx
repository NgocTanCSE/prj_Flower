/**
 * Chỉnh sửa sản phẩm (Server Component)
 * - `getProductForEdit(id)` tải thông tin + ảnh
 * - `updateProduct(formData)` sửa sản phẩm
 *
 * Không static-render (force-dynamic); chỉ chỉnh sửa khi admin đăng nhập.
 */

import { ProductForm } from '@/components/admin/ProductForm'
import { getProductForEdit, updateProduct } from '@/app/admin/api/actions/products'
import { getCategories } from '@/app/admin/api/actions/categories'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'

export const metadata = {
  title: 'Sửa sản phẩm | Quản trị',
  description: 'Chỉnh sửa thông tin sản phẩm.',
}

export interface EditProductPageProps {
  params: Promise<{ id: string }>
}

/** Render server, each request fetches DB data. */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const product = await getProductForEdit(id)
  if (!product) notFound()

  const categories = await getCategories()

  return (
    <div className="admin-content">
      <PageHeader
        title="Chỉnh sửa sản phẩm"
        subtitle={product.name}
      />
      <div className="rounded-xl border border-[#e8e1e1] bg-white p-6">
        <ProductForm product={product} categories={categories} onSubmit={updateProduct} submitLabel="Lưu" />
      </div>
    </div>
  )
}
