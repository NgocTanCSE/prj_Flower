/**
 * Thư viện kết quả (envelope) của các Server Action được bảo vệ.
 *
 * Mọi thành phần bảo vệ (protected components) "thunked" qua Server Action:
 * client component gọi action -> nhận `data` hoặc `error`.
 */

import type { Profile, ProfileRole, SupabaseUser } from './server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Dạng lỗi chuẩn mỗi Server Action bảo vệ trả về (client kiểm tra `error`). */
export type ResError = { error: string; code?: number }

/**
 * Kết quả của Server Action bảo vệ:
 * - Thành công: dữ liệu trả về.
 * - Thất bại: `{ error }`.
 */
export type ServerActionResult<TData = unknown> = TData | { error: string; code?: number }

/** Kết quả của Server Action admin (bắt buộc admin). */
export type AdminActionResult<TData = unknown> = TData | ResError

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ném lỗi cho client component hiển thị (thử dụng `error`). */
export function fail(message: string): ResError {
  return { error: message }
}

/**
 * Ràng buộc: gọi `fn` với `profile` + `user`.
 * Dùng cho Server Action cần session (middleware/auth + profile role).
 */
export async function withProfiles<T extends (profile: Profile | null, ...rest: any[]) => Promise<any>>(
  fn: T,
) {
  const { withServerAuth } = await import('./server')
  return withServerAuth(fn)
}

/**
 * Bảo vệ Server Action admin: session + profile + role === 'admin'.
 */
export async function withAdminAuthor<T extends (profile: Profile, user: SupabaseUser, ...rest: any[]) => Promise<any>>(
  fn: T,
) {
  const { withServerAuth } = await import('./server')
  return withServerAuth(async (profile: Profile | null, user: SupabaseUser, ...rest: any[]) => {
    if (!profile || !isProfileAdmin(profile)) return fail('Bạn không có quyền truy cập admin.')
    return fn(profile, user, ...rest)
  })
}

/** Kiểm tra profile có role admin (server-side). */
export function isProfileAdmin(profile: Profile | null | undefined): boolean {
  return !!profile && profile.role === 'admin'
}

// ---------------------------------------------------------------------------
// Re-export
// ---------------------------------------------------------------------------

export type { Profile, ProfileRole, SupabaseUser }
