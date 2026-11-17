'use server'

import { redirect } from 'next/navigation'
import type { SupabaseUser } from '@/lib/supabase/server'

import { parseLogin } from './schema'
import { getProfile, isAdmin, logoutUser, ssrAuthClient } from '@/lib/supabase/server'

// Email admin cố định (cấu hình trong Supabase Auth)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@tiemhoacobecube.dev'

// ---------------------------------------------------------------------------
// Kết quả trả về cho Client Component (form state).
// - `error`: tin nhắn hiển thị trên form.
// - `redirect`: đường dẫn client component sẽ trỏ về sau khi thao tác thành công.
// ---------------------------------------------------------------------------

export interface ActionResult {
  error?: string
  redirect?: string
}

/** Đăng nhập chỉ với mật khẩu (email cố định). Chỉ cho role admin. */
export async function login(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = parseLogin(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.' }
  }

  const supabase = await ssrAuthClient()
  if (!supabase) return { error: 'Không thể kết nối cơ sở dữ liệu.' }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: parsed.data.password,
  })

  if (error) return { error: 'Mật khẩu không chính xác.' }
  if (!data?.user) return { error: 'Không thể đăng nhập.' }

  const profile = await getProfile(data.user.id)
  if (!profile) return { error: 'Tài khoản chưa có hồ sơ.' }
  if (!isAdmin(profile)) return { error: 'Tài khoản này không có quyền quản trị.' }

  return { redirect: '/admin/dashboard' }
}

/** Server action đăng xuất: xóa cookie `sb-session` của phiên. */
export async function logout(formData: FormData): Promise<void> {
  const { error } = await logoutUser()
  if (error) console.error('Lỗi đăng xuất:', error)
  redirect('/')
}