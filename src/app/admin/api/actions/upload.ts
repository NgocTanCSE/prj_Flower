'use server'

import { requireAdmin, createAdminClient } from './auth'
import { MAX_FILE_SIZE, ALLOWED_TYPES } from '@/lib/upload'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Upload ảnh cho admin: tạo presigned URL rồi upload qua URL có chữ ký
// (service role, bypass RLS). Khớp đúng ràng buộc trong `lib/upload.ts`:
// "Bucket `assets` public; chỉ admin được insert. Upload phải dùng signed URL."
//
// Lưu ý sửa từ phiên bản trước: upload TRỰC TIẾP qua `storage.upload()` thường
// bị từ chối / không ổn định trên runtime Cloudflare Workers; presigned URL
// (PUT không cần header auth) hoạt động ổn định ở mọi nơi.
// ---------------------------------------------------------------------------

export interface UploadResult {
  /** Đường dẫn tương đối tới ảnh (folder/file.webp). */
  path: string
  /** URL công khai của ảnh. */
  url: string
}

/** Tạo client quản trị quyền ghi (service role). */
async function adminClient(): Promise<SupabaseClient> {
  await requireAdmin()
  return createAdminClient()
}

/** Upload một file tới bucket `assets` qua presigned URL (service role). */
export async function uploadFile(file: File, path: string): Promise<UploadResult> {
  const client = await adminClient()

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Định dạng file không hợp lệ: ${file.type || 'không xác định'}`)
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File quá lớn: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
  }

  // 1. Tạo presigned upload URL (service role bypass RLS của storage.objects).
  const { data: signed, error: signError } = await client.storage
    .from('assets')
    .createSignedUploadUrl(path, { upsert: true })

  if (signError || !signed?.token) {
    throw new Error(`Tạo đường dẫn upload thất bại: ${signError?.message ?? 'không có token'}`)
  }

  // 2. Upload qua URL có chữ ký (PUT không cần Authorization header).
  const { error: uploadError } = await client.storage
    .from('assets')
    .uploadToSignedUrl(path, signed.token, file)

  if (uploadError) {
    throw new Error(`Upload thất bại: ${uploadError.message}`)
  }

  const { data } = client.storage.from('assets').getPublicUrl(path)
  return {
    path,
    url: data?.publicUrl ?? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/${path}`,
  }
}
