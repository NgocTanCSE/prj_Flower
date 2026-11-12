'use server'

import { redirect } from 'next/navigation'
import type { SupabaseUser } from '@/lib/supabase/server'

import { parseForgotPassword, parseLogin, parseRegister, parseResetPassword } from './schema'
import { getProfile, isAdmin, logoutUser, ssrAdminClient, ssrAuthClient, sendResetLink, updatePassword } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Kết quả trả về cho Client Component (form state).
// - `error`: tin nhắn hiển thị trên form.
// - `redirect`: đường dẫn client component sẽ trỏ về sau khi thao tác thành công.
// ---------------------------------------------------------------------------

export interface ActionResult {
  error?: string
  redirect?: string
  /** Gửi magic link thành công (hiển thị thông báo trên form). */
  sent?: boolean
}

/** Đăng nhập với email + mật khẩu. Sau đó lưu lại profile (nếu có) để chọn đường dẫn. */
export async function login(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = parseLogin(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.' }
  }

  const supabase = await ssrAuthClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) return { error: 'Email hoặc mật khẩu không chính xác.' }
  if (!data?.user) return { error: 'Không thể đăng nhập với tài khoản hiện tại.' }

  const profile = await getProfile(data.user.id)
  if (!profile) return { error: 'Tài khoản của bạn chưa có hồ sơ.' }

  return isAdmin(profile) ? { redirect: '/admin' } : { redirect: '/' }
}

/**
 * Đăng ký email + mật khẩu.
 *
 * Hồ sơ (profiles.role = 'user') được tạo bởi Server Action, dùng service role
 * key (bypass RLS - server-side) để ghi bảng profiles. Never hỏi mật khẩu cứng.
 */
export async function register(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = parseRegister(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.' }
  }

  const supabase = await ssrAuthClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: String(parsed.data.email).split('@')[0] } },
  })

  if (error) return { error: error.message }

  // Tạo hồ sơ cho user mới (nếu đăng ký thành công - ngay cả khi cần xác thực email).
  const user: SupabaseUser | null = data?.user
  if (user) {
    const admin = await ssrAdminClient()
    const { error: profileError } = await admin.from('profiles').insert({
      id: user.id,
      role: 'user',
      full_name: String(parsed.data.email).split('@')[0],
    })
    if (profileError) return { error: profileError.message }
  }

  return { redirect: '/login' }
}

/** Gửi đường mật reset mật khẩu qua email (magic link). */
export async function sendForgotPassword(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = parseForgotPassword(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.' }
  }

  const { error } = await sendResetLink(parsed.data.email)
  if (error) return { error }

  // Email chỉ gửi một lần, nên trả `sent` để page hiển thị thông báo.
  return { sent: true }
}

/** Server action đăng xuất: xóa cookie `sb-session` của phiên. */
export async function logout(formData: FormData): Promise<void> {
  const { error } = await logoutUser()
  if (error) console.error('Lỗi đăng xuất:', error)
  redirect('/')
}

/** Đặt lại mật khẩu sau khi đọc magic link (cần session hợp lệ). */
export async function resetPassword(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = parseResetPassword(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.' }
  }

  const { error } = await updatePassword(parsed.data.password, parsed.data.passwordConfirm)
  if (error) return { error }

  return { redirect: '/login' }
}
