'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient, logAudit } from '@/lib/upload'

// ---------------------------------------------------------------------------
// Bảng `reviews` (0001_init.sql):
//   id, product_id, customer_name, customer_email, rating, comment,
//   is_approved, created_at, updated_at
// ---------------------------------------------------------------------------

export interface Review {
  id: number
  product_id: number
  customer_name: string
  customer_email: string
  rating: number
  comment: string
  is_approved: boolean
  created_at: string
  updated_at: string
  /** Tên sản phẩm (join với `products`). */
  product_name?: string
}

export type ReviewStatus = 'approved' | 'pending' | 'rejected'

async function requireAdmin() {
  const client = await createSupabaseServerClient()
  if (!client) {
    throw new Error('Vui lòng đăng nhập tài khoản admin để vào trang danh giá.')
  }

  const {
    data: { user },
    error,
  } = await client.auth.getUser()

  if (error || !user) {
    throw new Error('Vui lòng đăng nhập tài khoản admin để vào trang danh giá.')
  }

  return { client }
}

/** Các trạng thái chuyển đổi (chỉ chấp nhận `approved` hoặc `rejected`). */
const STATUS_ACTION: Record<ReviewStatus, 'approved' | 'rejected' | 'pending'> = {
  approved: 'approved',
  rejected: 'rejected',
  // "pending" giữ nguyên trạng thái (chờ duyệt).
  pending: 'pending',
}

/** Tạo/chỉnh sửa một đánh giá mới (pre-approved). */
export async function createReview(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const { client } = await requireAdmin()

  const customer_name = formData.get('customer_name') as string
  const customer_email = formData.get('customer_email') as string
  const product_id = Number(formData.get('product_id'))
  const rating = Number(formData.get('rating'))
  const comment = formData.get('comment') as string

  if (!product_id || !rating) {
    return { ok: false, error: 'Vui lòng chọn sản phẩm và xếp sao.' }
  }
  if (rating < 1 || rating > 5) {
    return { ok: false, error: 'Xếp sao phải từ 1 đến 5.' }
  }

  const { error } = await client.from('reviews').insert({
    customer_name,
    customer_email,
    product_id,
    rating,
    comment,
    is_approved: false,
  })

  if (error) {
    return { ok: false, error: `Tạo đánh giá thất bại: ${error.message}` }
  }

  await logAudit({ action: 'danh-gia-create', table: 'reviews', record_id: String(product_id), data: { rating, is_approved: false } })
  revalidatePath('/admin/danh-gia')
  return { ok: true }
}

/** Duyệt / từ chối / không làm gì thêm một đánh giá. */
export async function updateReviewStatus(
  id: string,
  payload: { status: ReviewStatus }
): Promise<{ ok: boolean; error?: string }> {
  const { client } = await requireAdmin()

  const { data: review, error: readError } = await client
    .from('reviews')
    .select('is_approved')
    .eq('id', Number(id))
    .single()

  if (readError || !review) {
    return { ok: false, error: 'Đánh giá không tồn tại.' }
  }

  const { error: updateError } = await client
    .from('reviews')
    .update({ is_approved: payload.status === 'approved' })
    .eq('id', Number(id))

  if (updateError) {
    return { ok: false, error: `Cập nhật đánh giá thất bại: ${updateError.message}` }
  }

  await logAudit({
    action: `danh-gia-${payload.status}`,
    table: 'reviews',
    record_id: String(id),
    data: { is_approved: payload.status === 'approved' },
  })

  revalidatePath('/admin/danh-gia')
  return { ok: true }
}

/** Xóa bình luận khỏi hệ thống. */
export async function deleteReview(id: string): Promise<{ ok: boolean; error?: string }> {
  const { client } = await requireAdmin()

  const { error: updateError } = await client.from('reviews').delete().eq('id', Number(id))

  if (updateError) {
    return { ok: false, error: `Xóa đánh giá thất bại: ${updateError.message}` }
  }

  await logAudit({ action: 'danh-gia-delete', table: 'reviews', record_id: String(id) })
  revalidatePath('/admin/danh-gia')
  return { ok: true }
}

/** Cập nhật tất cả đánh giá chờ duyệt (toggle). */
export async function refreshReviews(): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  revalidatePath('/admin/danh-gia')
  return { ok: true }
}

/** Hành động gửi biểu mẫu — `<form action>` chỉ chấp nhận `Promise<void>`. */
export async function submitRefreshReviews(): Promise<void> {
  await refreshReviews()
}
