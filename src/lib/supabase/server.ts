/**
 * Thư viện Supabase client (server-side) cho Next.js 15 App Router.
 *
 * Lưu ý: `next/headers` KHÔNG được import tĩnh ở đây - module này nằm trong
 * đường dẫn của các client component (ví dụ `src/lib/getProducts.ts`), nên các
 * phương thức cookie được tải động khi chạy server component/hành động.
 *
 * Service role key chỉ dùng server-side (bypass RLS thực thi từ Supabase
 * Service Role). Không bao giờ nhúng key xuống client.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { SupabaseClient, AuthUser, Session as SupabaseSession } from '@supabase/supabase-js'
import type { CookieOptions, CookieOptionsWithName } from '@supabase/ssr'

/** Kiểu người dùng Supabase (tương thích `actionClient`). */
export type SupabaseUser = AuthUser

// ---------------------------------------------------------------------------
// Environment.
// ---------------------------------------------------------------------------

/** URL của Supabase project (NEXT_PUBLIC_SUPABASE_URL). */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
/** Khóa anon (public, chỉ SELECT qua RLS). */
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
/** Service role key (chỉ dùng server-side, luôn phải là biến môi trường). */
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY ?? ''

// ---------------------------------------------------------------------------
// Cookie adapter for @supabase/ssr.
// Session cookie (`sb-session`) đọc từ request và ghi lại khi session thay đổi.
// ---------------------------------------------------------------------------

export interface CookiesSelf {
  getAll(): Promise<{ name: string; value: string }[]>
  setAll(cookies: { name: string; value: string; options: CookieOptions }[]): Promise<void>
}

/** Tên cookie lưu session của Supabase Auth. */
const COOKIE_OPTIONS: CookieOptionsWithName = {
  name: 'sb-session',
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 365,
}

/** Middleware: cookies đọc từ request, ghi lại response của middleware. */
async function middlewareCookieMethods(request: NextRequest, response: NextResponse): Promise<CookiesSelf> {
  return {
    async getAll() {
      return request.cookies
        .getAll()
        .map((cookie) => ({ name: cookie.name, value: cookie.value }))
    },
    async setAll(setCookies) {
      for (const { name, value, options } of setCookies) {
        response.cookies.set(name, value, options)
      }
    },
  }
}

/** Server Components / Server Actions: phương thức cookie của `next/headers`. */
async function serverCookieMethods(): Promise<CookiesSelf> {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  return {
    async getAll() {
      return cookieStore.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value }))
    },
    async setAll(setCookies) {
      for (const { name, value, options } of setCookies) {
        cookieStore.set(name, value, options)
      }
    },
  }
}

function clientOptions(supabaseKey: string, methods: CookiesSelf) {
  return {
    cookieOptions: COOKIE_OPTIONS,
    cookies: methods,
    auth: { autoRefreshToken: false, detectSessionInUrl: false },
  }
}

// ---------------------------------------------------------------------------
// Clients.
// ---------------------------------------------------------------------------

/**
 * Tạo Supabase client hướng server, uống với cookie phiên của request.
 *
 * - Server Components / Server Actions: gọi không đối số.
 * - Middleware: truyền `request` + `response` để session cookie được đọc/ghi.
 */
/** Không có URL/SERVICE KEY → client rỗng để module không ném lỗi lúc build. */
export async function createClient(
  request?: NextRequest,
  response?: NextResponse,
): Promise<SupabaseClient | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null

  const methods = request ? await middlewareCookieMethods(request, response!) : await serverCookieMethods()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions(SUPABASE_ANON_KEY, methods))
}

/** Server component/auth client: session cookie đọc từ next/headers. */
export async function ssrAuthClient(): Promise<SupabaseClient | null> {
  return createClient()
}

/** Admin (bypass RLS): dùng service key để truy vấn profiles/hồ sơ người dùng. */
export async function ssrAdminClient(): Promise<SupabaseClient | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null

  const methods = await serverCookieMethods()
  return createServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, clientOptions(SUPABASE_SERVICE_ROLE_KEY, methods))
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

/** Vai trò hợp lệ của profile (chống CHECK của `profiles.role`). */
export type ProfileRole = 'admin' | 'user'

export interface Profile {
  id: string
  role: ProfileRole
  full_name: string
  avatar_url: string
  created_at: string
  updated_at: string
}

/** Lấy hồ sơ của user (đăng ký khi đăng ký - A1 viết trigger tạo profile). */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await ssrAdminClient()
  if (!supabase) return null

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error || !data) return null
  return (data as unknown as Profile) ?? null
}

/** Kiểm tra role admin của hồ sơ. */
export function isAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin'
}

/** Lấy session + profile của người dùng hiện tại. */
export async function getSessionUser(): Promise<{ session: SupabaseSession; user: SupabaseUser; profile: Profile | null } | null> {
  const supabase = await ssrAuthClient()
  if (!supabase) return null

  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) return null
  const profile = await getProfile(data.session.user.id)
  return { session: data.session, user: data.session.user, profile }
}

/**
 * Thiết lập Email dùng cho quên mật khẩu (Supabase gửi magic link).
 * Trả về `{ error }` nếu gửi email thất bại.
 */
export async function sendResetLink(email: string): Promise<{ error?: string }> {
  const supabase = await ssrAuthClient()
  if (!supabase) {
    return { error: 'Không thể kết nối cơ sở dữ liệu.' }
  }

  const { headers } = await import('next/headers')
  const headersStore = await headers()
  const origin = headersStore.get('origin') ?? (process.env.NEXT_PUBLIC_SITE_URL as string)
  if (!origin) {
    return { error: 'Không xác định được đường dẫn website.' }
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/reset-password` })
  if (error) return { error: error.message }
  return {}
}

/** Cập nhật mật khẩu của user đang đăng nhập (dùng sau magic link reset). */
export async function updatePassword(newPassword: string, confirmPassword: string): Promise<{ error?: string; redirect?: string }> {
  const supabase = await ssrAuthClient()
  if (!supabase) {
    return { error: 'Không thể kết nối cơ sở dữ liệu.' }
  }

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return { error: 'Vui lòng đăng nhập để đặt lại mật khẩu.' }
  }
  if (newPassword !== confirmPassword) {
    return { error: 'Mật khẩu xác nhận không khớp.' }
  }
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) return { error: updateError.message }
  return {}
}

/**
 * Ngừng phiên (xóa cookie `sb-session`). Dùng cho nút đăng xuất của admin.
 *
 * Sau khi đăng xuất, session không còn trong cookie nên mọi Server Action
 * (hoặc SSR client) đều cần đăng nhập lại.
 */
export async function logoutUser(): Promise<{ error?: string }> {
  const supabase = await ssrAuthClient()
  if (!supabase) {
    return { error: 'Không thể kết nối cơ sở dữ liệu.' }
  }

  const { error } = await supabase.auth.signOut()
  if (error) return { error: error.message }
  return {}
}

// ---------------------------------------------------------------------------
// Server Action wrappers
// ---------------------------------------------------------------------------

/** Trình bao Server Action: kiểm tra session + profile, gọi fn khi hợp lệ. */
export async function withServerAuth(fn: (profile: Profile | null, user: SupabaseUser, ...rest: any[]) => Promise<any>) {
  return async (...rest: any[]) => {
    const supabase = await ssrAuthClient()
    if (!supabase) {
      return { error: 'Không thể kết nối cơ sở dữ liệu.' }
    }

    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return { error: 'Vui lòng đăng nhập để sử dụng tính năng này.' }
    }
    const profile = await getProfile(data.user.id)
    if (!profile) {
      return { error: 'Tài khoản của bạn chưa có hồ sơ.' }
    }
    return fn(profile, data.user, ...rest)
  }
}

// ---------------------------------------------------------------------------
// signedRes
// ---------------------------------------------------------------------------

/**
 * Ghi nhận chuỗi lỗi chuẩn (sign) cho route handlers.
 * Rule: `signedRes.sendError(message, status)` trả về JSON lỗi.
 */
export const signedRes = {
  sendError(message: string, code = 400): NextResponse<{ error: string }> {
    return NextResponse.json({ error: message }, { status: code })
  },
}
