import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { createClient as supabaseSSRClient } from './supabase/server'

// -----------------------------------------------------------------------
// Environment. `NEXT_PUBLIC_` biến được cắm bởi CI / Netlify / Vercel.
// Keys không bao giờ xuống frontend (service_role chỉ dùng ở sync job).
// -----------------------------------------------------------------------

/** Đường dẫn cơ sở Supabase project (ví dụ: https://abc123.supabase.co). */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
/** Khóa anon công khai. Đặt tại Project Settings > API. */
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

/**
 * Bucket lưu ảnh. Ràng buộc (docs/DB.md): `assets` public; chỉ admin được
 * insert. Upload phải dùng signed URL.
 */
export const BUCKET = 'assets'

/** Kích thước tối đa của hình ảnh (5 MB). */
export const MAX_FILE_SIZE = 5 * 1024 * 1024
/** Định dạng file ảnh cho phép. */
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// -----------------------------------------------------------------------
// Client
// -----------------------------------------------------------------------

/**
 * Tạo client hướng browser (dùng trong client component).
 * Session được lưu bằng cookie từ `@supabase/ssr` khi login qua Midbar.js.
 */
export function createSupabaseClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
}

/**
 * Tạo client hướng server (dùng trong server component / server action).
 * Tự động gắn session đang có vào cookie yêu cầu via `src/lib/supabase/server.ts`.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  if (typeof window !== 'undefined') {
    // Không được chạm `cookies()` từ phía client.
    return createSupabaseClient()
  }

  return supabaseSSRClient()
}

/**
 * Kiểm tra session có tôn trọng. Ném `Error` nếu chưa đăng nhập.
 */
export async function requireSession(
  client: SupabaseClient
): Promise<User> {
  const { data, error } = await client.auth.getUser()
  if (error || !data?.user) {
    throw new Error('Vui lòng đăng nhập tài khoản admin để nhìn thấy danh sách này.')
  }
  return data.user
}

// -----------------------------------------------------------------------
// Audit log: ghi log hành động admin xuống bảng `audit_log` (docs/DB.md).
// -------------------------------------------------------------- ---

export interface AuditEntry {
  action: string
  table?: string
  record_id?: string
  data?: Record<string, unknown>
}

/**
 * Ghi log hành động của admin xuống bảng `audit_log`.
 * Bảng này thuộc `supabase/migrations` (A1), vì vậy nếu bảng chưa được khởi tạo
 * việc ghi log sẽ bị bỏ qua, không ném lỗi để chi tiết nghiệp vụ không mất.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const client = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser()

    const record: Record<string, unknown> = {
      ...entry,
      id: crypto.randomUUID(),
      user_id: userError || !user ? null : user.id,
      created_at: new Date().toISOString(),
    }

    await client.from('audit_log').insert(record)
  } catch (error) {
    // Log lỗi là tính năng quan trọng: không được phép hủy pipeline nếu ghi log thất bại.
    console.error('[audit] logAudit thất bại:', (error as Error).message)
  }
}

// -----------------------------------------------------------------------
// Image upload via presigned URL (Supabase Storage)
// -----------------------------------------------------------------------

export interface UploadResult {
  /** Đường dẫn tương đối tới ảnh (folder/file.webp). */
  path: string
  /** URL công khai của ảnh. */
  url: string
}

/**
 * Upload file đến Supabase Storage qua presigned URL.
 * Presigned URL hết hạn sau 2 giờ và chỉ đang login admin.
 * Tham số:
 *  - `file`: File từ `<input type="file">` hoặc Blob.
 *  - `path`: đường dẫn lưu trữ trong bucket (nên có folder: `gallery/ten-file`).
 * Trả về `UploadResult` có `path` và `url`.
 */
export async function uploadImage(file: File, path: string): Promise<UploadResult> {
  const client = createSupabaseClient()

  const { data: signed, error: signedError } = await client.storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { upsert: true })

  if (signedError || !signed?.token) {
    throw new Error(
      `Tạo presigned URL thất bại: ${signedError?.message ?? 'không có token'}`
    )
  }

  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .uploadToSignedUrl(path, signed.token, file)

  if (uploadError) {
    throw new Error(`Upload thất bại: ${uploadError.message}`)
  }

  // `assets` là bucket public (chỉ admin được insert).
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`

  return { path, url }
}
