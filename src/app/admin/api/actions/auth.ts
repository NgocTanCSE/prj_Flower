'use server'

import { ssrAdminClient, getProfile, isAdmin as isProfileAdmin } from '@/lib/supabase/server'
import { createSupabaseServerClient } from '@/lib/upload'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Quyền admin: session (cookie) + profile.role === 'admin'.
// Bypass role giả mạo: role được kiểm qua bảng profiles (service role client).
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: string
  email: string
  role: string
  full_name: string
}

/** Thông báo lỗi chuẩn (retry logic). */
const SESSION_MISSING = 'Vui lòng đăng nhập tài khoản admin để vào trang quản trị.'
const NOT_ADMIN = 'Bạn không có quyền truy cập admin (role không phù hợp).'

/** Trả về AdminUser hoặc ném lỗi. */
export async function requireAdmin(): Promise<AdminUser> {
  // 1. session của request (bây giờ server-cookies).
  const client = await createSupabaseServerClient()
  const { data, error } = await client.auth.getUser()
  if (error || !data?.user) {
    throw new Error(SESSION_MISSING)
  }

  // 2. role từ profiles (bảng của A1).
  const profile = await getProfile(data.user.id)
  if (!profile) {
    throw new Error('Tài khoản của bạn chưa có hồ sơ quản trị.')
  }
  if (!isProfileAdmin(profile)) {
    throw new Error(NOT_ADMIN)
  }

  return { id: data.user.id, email: data.user.email ?? '', role: profile.role, full_name: profile.full_name ?? '' }
}

/** Kiểm tra session+profile không ném lỗi: {ok, user, message}. */
export async function adminSession(): Promise<{ ok: boolean; user: AdminUser | null; message: string }> {
  try {
    const user = await requireAdmin()
    return { ok: true, user, message: '' }
  } catch (error) {
    return { ok: false, user: null, message: (error as Error).message }
  }
}

/** Client có quyền ghi (bypass RLS): service role). */
export async function createAdminClient(): Promise<SupabaseClient> {
  await requireAdmin()
  return ssrAdminClient()
}
