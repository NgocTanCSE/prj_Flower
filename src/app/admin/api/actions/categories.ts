'use server'

import { createAdminClient, requireAdmin } from './auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/upload'

// ---------------------------------------------------------------------------
// Category (0001_init.sql):
//
//   categories (id bigint, name, slug, parent_id bigint, sort_order bigint,
//               active bool, UNIQUE(slug))
//
// Trang này quản lý node danh mục hoa; đường dẫn public suy ra từ slug
// (`/danh-muc/<slug>`).
// ---------------------------------------------------------------------------

export interface Category {
  id: number
  name: string
  slug: string
  parent_id: number | null
  sort_order: number
  active: boolean
}

const categorySchema = z.object({
  slug: z.string().min(1, 'Slug không được để trống').max(200),
  name: z.string().min(1, 'Tên danh mục không được để trống').max(200),
  parent_id: z.coerce.number().optional(),
  sort_order: z.coerce.number().default(999),
  active: z.boolean().default(true),
})

export type CategoryForm = z.infer<typeof categorySchema>

// ---------------------------------------------------------------------------
// Đọc
// ---------------------------------------------------------------------------

/** Tất cả danh mục (cấp). */
export async function getCategories(): Promise<Category[]> {
  const client = await createAdminClient()
  const { data, error } = await client
    .from('categories')
    .select('id, name, slug, parent_id, sort_order, active')
    .order('sort_order')

  if (error) throw new Error(`Lỗi lấy danh mục: ${error.message}`)
  return data ?? []
}

/** Danh mục đang hoạt động (hiển thị cho khách). */
export async function getActiveCategories(): Promise<Category[]> {
  const client = await createAdminClient()
  const { data, error } = await client
    .from('categories')
    .select('id, name, slug, parent_id, sort_order, active')
    .eq('active', true)
    .order('sort_order')

  if (error) throw new Error(`Lỗi lấy danh mục hoạt động: ${error.message}`)
  return data ?? []
}

// ---------------------------------------------------------------------------
// Ghi
// ---------------------------------------------------------------------------

/** Tạo một danh mục; `slug` duy nhất trong bảng. */
export async function createCategory(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()

  const values = Object.fromEntries(formData)
  const parsed = categorySchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, error: `Dữ liệu không hợp lệ: ${parsed.error.issues[0].message}` }
  }

  if (parsed.data.sort_order < 0) {
    return { ok: false, error: 'Thứ tự không thể âm.' }
  }

  const client = await createAdminClient()

  // Không cho trùng slug / name.
  const slugExists = await client
    .from('categories')
    .select('id')
    .eq('slug', parsed.data.slug)
    .limit(1)
    .maybeSingle()

  if (slugExists) {
    return { ok: false, error: `Slug ${parsed.data.slug} đã tồn tại.` }
  }

  const { data: category, error } = await client.from('categories').insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    parent_id: parsed.data.parent_id ?? null,
    sort_order: parsed.data.sort_order,
    active: parsed.data.active,
  }).select('id').single()

  if (error) throw new Error(`Tạo danh mục thất bại: ${error.message}`)

  await logAudit({ action: 'danh-muc-create', table: 'categories', record_id: String(category?.id), data: parsed.data })
  revalidatePath('/admin/danh-muc')
  return { ok: true }
}

/** Cập nhật một danh mục. */
export async function updateCategory(id: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  if (!id) return { ok: false, error: 'Danh mục không tồn tại.' }

  const values = Object.fromEntries(formData)
  const parsed = categorySchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, error: `Dữ liệu không hợp lệ: ${parsed.error.issues[0].message}` }
  }

  const client = await createAdminClient()

  // Không trùng slug / name (trừ chính nó).
  const slugExists = await client
    .from('categories')
    .select('id')
    .eq('slug', parsed.data.slug)
    .neq('id', Number(id))
    .limit(1)
    .maybeSingle()

  if (slugExists) {
    return { ok: false, error: `Slug ${parsed.data.slug} đã tồn tại.` }
  }

  const { error } = await client
    .from('categories')
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      parent_id: parsed.data.parent_id ?? null,
      sort_order: parsed.data.sort_order,
      active: parsed.data.active,
    })
    .eq('id', Number(id))

  if (error) throw new Error(`Cập nhật danh mục thất bại: ${error.message}`)

  await logAudit({ action: 'danh-muc-update', table: 'categories', record_id: String(id), data: parsed.data })
  revalidatePath('/admin/danh-muc')
  return { ok: true }
}

/** Xóa một danh mục (cascade sang sản phẩm). */
export async function deleteCategory(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  if (!id) return { ok: false, error: 'Danh mục không tồn tại.' }

  const client = await createAdminClient()
  const { error } = await client.from('categories').delete().eq('id', Number(id))

  if (error) throw new Error(`Xóa danh mục thất bại: ${error.message}`)

  await logAudit({ action: 'danh-muc-delete', table: 'categories', record_id: String(id) })
  revalidatePath('/admin/danh-muc')
  return { ok: true }
}
