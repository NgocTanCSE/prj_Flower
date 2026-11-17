'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { parseLogin, parseResetPassword } from './schema'
import { getProfile, isAdmin, logoutUser, sendResetLink, ssrAuthClient, exchangeCodeForSession } from '@/lib/supabase/server'

// Email admin cố định (cấu hình trong Supabase Auth)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@tiemhoashopflower.dev'

// ---------------------------------------------------------------------------
// Kết quả trả về cho Client Component (form state).
// - `error`: tin nhắn hiển thị trên form.
// - `redirect`: đường dẫn client component sẽ trỏ về sau khi thao tác thành công.
// ---------------------------------------------------------------------------

export interface ActionResult {
  error?: string
  redirect?: string
  sent?: boolean
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

/**
 * Gửi email đặt lại mật khẩu tới ADMIN_EMAIL.
 * Yêu cầu mật khẩu quản trị hiện tại để tránh người lạ kích hoạt gửi email.
 */
export async function sendResetPassword(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
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

  const headerStore = await headers()
  const host = headerStore.get('host')
  const proto = headerStore.get('x-forwarded-proto') ?? 'https'
  const origin = process.env.SITE_URL || (host ? `${proto}://${host}` : 'http://localhost:3000')

  const { error: resetError } = await sendResetLink(ADMIN_EMAIL, `${origin}/reset-password`)
  if (resetError) return { error: `Không gửi được email đặt lại mật khẩu: ${resetError}` }

  return { sent: true }
}

/** Đặt lại mật khẩu quản trị từ magic link (code trong URL). */
export async function resetPassword(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const code = String(formData.get('code') ?? '')
  const parsed = parseResetPassword(formData)

  if (!code) return { error: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Hãy yêu cầu link mới.' }
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.' }

  const { password } = parsed.data

  const supabase = await ssrAuthClient()
  if (!supabase) return { error: 'Không thể kết nối cơ sở dữ liệu.' }

  const exchange = await exchangeCodeForSession(supabase, code)
  if (exchange.error) return { error: exchange.error }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'Phiên đặt lại mật khẩu không hợp lệ.' }

  const profile = await getProfile(session.user.id)
  if (!profile) return { error: 'Tài khoản chưa có hồ sơ.' }
  if (!isAdmin(profile)) return { error: 'Tài khoản này không có quyền quản trị.' }

  const { error: updateError } = await supabase.auth.updateUser({ password })
  if (updateError) return { error: updateError.message }

  return { redirect: '/' }
}

/** Server action đăng xuất: xóa cookie `sb-session` của phiên. */
export async function logout(formData: FormData): Promise<void> {
  const { error } = await logoutUser()
  if (error) console.error('Lỗi đăng xuất:', error)
  redirect('/')
}