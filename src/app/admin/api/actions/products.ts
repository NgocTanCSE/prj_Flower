'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from './auth'
import { uploadFile } from './upload'
import { logAudit } from '@/lib/upload'
import { slugify } from '@/lib/getProducts'

// ---------------------------------------------------------------------------
// Central `0001_init.sql` (source of truth cho admin).
//
//   products (id, slug, name, short_desc, description, price, old_price,
//            category_id, weight, featured_is, sort_order, status, views,
//            is_active, created_at, updated_at)
//   product_images (id, product_id, url, alt, sort_order, is_primary)
// ---------------------------------------------------------------------------

/** Một sản phẩm kèm danh sách ảnh (name + product_images). */
export interface Product {
  id: number
  slug: string
  name: string
  short_desc: string
  description: string
  price: number
  old_price: number | null
  category_id: number
  weight: number | null
  featured_is: boolean
  sort_order: number
  status: 'draft' | 'published'
  views: number
  is_active: boolean
  created_at: string
  updated_at: string
  product_images?: ProductImage[]
}

/** Liên kết ảnh của một sản phẩm (`product_images` bảng). */
export interface ProductImage {
  id: number
  product_id: number
  url: string
  alt: string
  sort_order: number
  is_primary: boolean
}

/** Payload gửi từ form sản phẩm (khớp lại về `Product`). */
export interface ProductForm {
  slug: string
  name: string
  short_desc: string
  description: string
  price: number
  old_price: number | null
  category_id: number
  weight: number | null
  featured_is: boolean
  sort_order: number
  status: 'draft' | 'published'
  is_active: boolean
  image_url?: string
}

const productSchema = z.object({
  slug: z.string().min(1, 'Slug không được để trống').max(200),
  name: z.string().min(1, 'Tên sản phẩm không được để trống').max(200),
  short_desc: z.string().default(''),
  description: z.string().default(''),
  price: z.coerce.number().min(0, 'Giá không thể âm'),
  old_price: z
    .preprocess((v) => (v === '' || v === undefined || v === null ? null : Number(v)), z.number().min(0, 'Giá cũ không thể âm')),
  category_id: z.coerce.number().min(1, 'Vui lòng chọn danh mục'),
  weight: z.preprocess((v) => (v === '' || v === undefined || v === null ? 0 : Number(v)), z.number().min(0, 'Khối lượng không thể âm')),
  featured_is: z.boolean().default(false),
  sort_order: z.coerce.number().default(999),
  status: z.enum(['draft', 'published']).default('draft'),
  is_active: z.boolean().default(true),
})

// ---------------------------------------------------------------------------
// Chuyển thể giá trị `_Form` (checkbox nhận `"on"`) sang boolean đúng chuẩn.
// ---------------------------------------------------------------------------

/** Chuyển đổi một giá trị boolean từ form. */
function normalizeBoolean(key: string, value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value !== 'off' && value !== '' && value !== 'false' && value !== '0'
  return !!value
}

/** Chuẩn hóa `values` trước khi `zod` parse (checkbox / thứ tự). */
function normalizeFormValues(values: Record<string, unknown>): Record<string, unknown> {
  values.featured_is = normalizeBoolean('featured_is', values.featured_is)
  values.is_active = normalizeBoolean('is_active', values.is_active)
  return values
}

/** Lấy một ảnh từ form: `image_url` (text) hoặc file (upload). */
async function resolveImageUrl(formData: FormData): Promise<string> {
  const textUrl = formData.get('image_url') as string
  if (textUrl) return textUrl

  const file = formData.get('image') as File | null
  if (file) {
    const { url } = await uploadFile(file, `products/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_-]/g, '')}`)
    return url
  }
  return ''
}

// ---------------------------------------------------------------------------
// Đọc (SSR / hệ thống)
// ---------------------------------------------------------------------------

/** Tất cả sản phẩm (bao gồm bản nháp — dropdown cho admin). */
export async function getProductsForAdmin(): Promise<Product[]> {
  const client = await createAdminClient()
  const { data, error } = await client
    .from('products')
    .select('*, product_images(*)')
    .order('status')
    .order('sort_order')

  if (error) throw new Error(`Lỗi lấy sản phẩm: ${error.message}`)
  return data ?? []
}

/** Sản phẩm đang hiện (public: status = published + is_active = true). */
export async function getPublicProductsForAdmin(): Promise<Product[]> {
  const client = await createAdminClient()
  const { data, error } = await client
    .from('products')
    .select('*, product_images(*)')
    .eq('status', 'published')
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw new Error(`Lỗi lấy sản phẩm công khai: ${error.message}`)
  return data ?? []
}

export async function getProductForEdit(id: string): Promise<Product | undefined> {
  const client = await createAdminClient()
  const { data, error } = await client
    .from('products')
    .select('*, product_images(*)')
    .eq('id', Number(id))
    .limit(1)
    .single()

  if (error) throw new Error(`Lỗi lấy sản phẩm ${id}: ${error.message}`)
  return data ?? undefined
}

/** Danh mục cho dropdown (rất nhanh từ bảng `categories`). */
export async function getProductCategories(): Promise<
  Array<{
    id: number
    name: string
    slug: string
    parent_id: number | null
    sort_order: number
    active: boolean
  }>
> {
  const client = await createAdminClient()
  const { data, error } = await client
    .from('categories')
    .select('id, name, slug, parent_id, sort_order, active')
    .order('sort_order')

  if (error) throw new Error(`Lỗi lấy danh mục: ${error.message}`)
  return data ?? []
}

// ---------------------------------------------------------------------------
// Ghi (server action)
// ---------------------------------------------------------------------------

/** Tạo một sản phẩm. Ảnh chính `primary_image` upload hoặc paste. */
export async function createProduct(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const client = await createAdminClient()

  const values = normalizeFormValues(Object.fromEntries(formData))
  const parsed = productSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, error: `Dữ liệu không hợp lệ: ${parsed.error.issues[0].message}` }
  }

  const imageUrl = await resolveImageUrl(formData)

  // Tính lại `slug` khi form để trống, còn lại giữ nguyên.
  const { slug: productSlug, ...rest } = parsed.data
  const slug = productSlug.trim() || slugify(parsed.data.name)

  const { data: product, error } = await client
    .from('products')
    .insert({
      ...rest,
      slug,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Tạo sản phẩm thất bại: ${error.message}`)
  }

  // Ảnh chính (is_primary = true) trong bảng `product_images`.
  if (imageUrl) {
    const { error: imgError } = await client.from('product_images').insert({
      product_id: product.id,
      url: imageUrl,
      alt: parsed.data.name,
      sort_order: 1,
      is_primary: true,
    })
    if (imgError) throw new Error(`Tạo ảnh sản phẩm thất bại: ${imgError.message}`)
  }

  await logAudit({
    action: 'san-pham-create',
    table: 'products',
    record_id: String(product.id),
    data: { name: parsed.data.name, image_url: imageUrl },
  })

  revalidatePath('/admin/san-pham')
  return { ok: true }
}

/** Cập nhật sản phẩm. Nếu có file nền, ảnh chính sẽ được ghi đè. */
export async function updateProduct(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const client = await createAdminClient()

  // `id` đến từ trường ẩn của form (đối với chỉnh sửa).
  const id = formData.get('id') as string
  if (!id) {
    return { ok: false, error: 'Sản phẩm không tồn tại.' }
  }

  const values = normalizeFormValues(Object.fromEntries(formData))
  const parsed = productSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, error: `Dữ liệu không hợp lệ: ${parsed.error.issues[0].message}` }
  }

  const imageUrl = await resolveImageUrl(formData)

  const { data: prev } = await client
    .from('product_images')
    .select('id')
    .eq('product_id', Number(id))
    .eq('is_primary', true)
    .limit(1)

  if (imageUrl) {
    if (prev?.[0]) {
      const { error: imgError } = await client
        .from('product_images')
        .update({ url: imageUrl, alt: parsed.data.name, sort_order: 1 })
        .eq('id', prev[0].id)
      if (imgError) throw new Error(`Cập nhật ảnh sản phẩm thất bại: ${imgError.message}`)
    } else {
      const { error: imgError } = await client.from('product_images').insert({
        product_id: Number(id),
        url: imageUrl,
        alt: parsed.data.name,
        sort_order: 1,
        is_primary: true,
      })
      if (imgError) throw new Error(`Tạo ảnh sản phẩm thất bại: ${imgError.message}`)
    }
  }

  // Tính lại `slug` khi form để trống, còn lại giữ nguyên.
  const { slug: productSlug, ...rest } = parsed.data
  const slug = productSlug.trim() || slugify(parsed.data.name)

  const { error } = await client
    .from('products')
    .update({
      ...rest,
      slug,
    })
    .eq('id', Number(id))

  if (error) {
    throw new Error(`Cập nhật sản phẩm thất bại: ${error.message}`)
  }

  await logAudit({
    action: 'san-pham-update',
    table: 'products',
    record_id: String(id),
    data: { name: parsed.data.name, image_url: imageUrl },
  })

  revalidatePath('/admin/san-pham')
  return { ok: true }
}

/** Xóa mềm: banner (status = draft + is_active = false). */
export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  const client = await createAdminClient()
  const { error } = await client.from('products').update({ status: 'draft', is_active: false }).eq('id', Number(id))

  if (error) {
    throw new Error(`Xóa sản phẩm thất bại: ${error.message}`)
  }

  await logAudit({ action: 'san-pham-delete', table: 'products', record_id: String(id) })
  revalidatePath('/admin/san-pham')
  return { ok: true }
}

/** Bật/tắt trạng thái hiển thị (status draft ↔ published). */
export async function toggleProductPublish(id: string): Promise<{ ok: boolean; error?: string }> {
  const client = await createAdminClient()
  const { data: row } = await client.from('products').select('status').eq('id', Number(id)).single()
  if (!row) throw new Error('Sản phẩm không tồn tại.')
  const { error } = await client
    .from('products')
    .update({ status: row.status === 'published' ? 'draft' : 'published' })
    .eq('id', Number(id))
  if (error) throw new Error(`Cập nhật trạng thái thất bại: ${error.message}`)

  await logAudit({ action: 'san-pham-publish', table: 'products', record_id: String(id) })
  revalidatePath('/admin/san-pham')
  return { ok: true }
}

/** Đảo ngược trạng thái hiển thị (`is_active`) một sản phẩm. */
export async function toggleProductActive(id: string): Promise<{ ok: boolean; error?: string }> {
  const client = await createAdminClient()
  const { data: row } = await client.from('products').select('is_active').eq('id', Number(id)).single()
  if (!row) throw new Error('Sản phẩm không tồn tại.')
  const { error } = await client
    .from('products')
    .update({ is_active: !row.is_active })
    .eq('id', Number(id))
  if (error) throw new Error(`Cập nhật trạng thái thất bại: ${error.message}`)

  await logAudit({ action: 'san-pham-toggle', table: 'products', record_id: String(id) })
  revalidatePath('/admin/san-pham')
  return { ok: true }
}

/** Đảo ngược trạng thái hiển thị (`is_active`) của nhiều sản phẩm. */
export async function toggleProductsActive(ids: string[], active: boolean): Promise<{ ok: boolean; error?: string }> {
  const client = await createAdminClient()
  const { error } = await client.from('products').update({ is_active: active }).in('id', ids.map(Number))
  if (error) throw new Error(`Cập nhật trạng thái thất bại: ${error.message}`)

  await logAudit({ action: 'san-pham-bulk', table: 'products', record_id: ids.join(',') })
  revalidatePath('/admin/san-pham')
  return { ok: true }
}

/** Tăng số lượng dữ liệu `views` của sản phẩm sau khi khách mua... */
export async function incrementProductViews(id: string): Promise<{ ok: boolean; error?: string }> {
  const client = await createAdminClient()
  const { data: row } = await client.from('products').select('views').eq('id', Number(id)).single()
  const { error } = await client
    .from('products')
    .update({ views: (row?.views || 0) + 1 })
    .eq('id', Number(id))
  if (error) throw new Error(`Cập nhật views thất bại: ${error.message}`)
  return { ok: true }
}
