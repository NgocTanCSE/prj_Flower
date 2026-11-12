'use server'

import { createAdminClient, requireAdmin } from './auth'
import { createSupabaseClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Thống kê: summary chạy trên chính schema 0001_init.sql
// ---------------------------------------------------------------------------

export interface Stats {
  /** Tổng lượt xem sản phẩm (`products.views`). */
  viewsTotal: number
  /** Tất cả sản phẩm. */
  totalProducts: number
  /** Ảnh, status = published + is_active = true. */
  productsActive: number
  /** Bản nháp (status = draft). */
  productsDraft: number
  /** Đã ẩn (is_active = false). */
  productsHidden: number
  pendingReviews: number
  totalReviews: number
  totalGallery: number
}

/** Đếm bản ghi của một bảng (`count: exact`). */
async function countRows(table: string, query: (q: any) => any): Promise<number> {
  const client = await createAdminClient()
  const { count, error } = await query(client.from(table).select('*', { count: 'exact', head: true }))
  if (error) throw new Error(`Lỗi đếm ${table}: ${error.message}`)
  return count ?? 0
}

/** Đọc các chỉ số cơ bản (Số liệu tổng hợp). */
export async function getStats(): Promise<Stats> {
  await requireAdmin()

  const client = await createAdminClient()

  // Tổng `views` của tất cả sản phẩm.
  const publicClient = await createSupabaseClient()
  const viewsAll = publicClient ? (await publicClient.from('products').select('views').single()).data : null
  const viewsTotal = (viewsAll?.views as number) || 0

  const all = await client.from('products').select('*', { count: 'exact', head: true })
  const active = await client.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true)
  const published = await client.from('products').select('*', { count: 'exact', head: true }).eq('status', 'published')
  const draft = await client.from('products').select('*', { count: 'exact', head: true }).eq('status', 'draft')
  const hidden = await client.from('products').select('*', { count: 'exact', head: true }).eq('is_active', false)
  const reviewsPending = await client.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false)
  const reviewsApproved = await client.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', true)
  const gallery = await client.from('gallery_images').select('*', { count: 'exact', head: true }).eq('is_active', true)

  return {
    viewsTotal,
    totalProducts: all.count ?? 0,
    productsActive: active.count ?? 0,
    productsDraft: draft.count ?? 0,
    productsHidden: hidden.count ?? 0,
    pendingReviews: reviewsPending.count ?? 0,
    totalReviews: reviewsApproved.count ?? 0,
    totalGallery: gallery.count ?? 0,
  }
}
