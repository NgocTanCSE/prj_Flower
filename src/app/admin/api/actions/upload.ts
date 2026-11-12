'use server'

import { requireAdmin, createAdminClient } from './auth'
import { MAX_FILE_SIZE, ALLOWED_TYPES } from '@/lib/upload'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Upload ảnh cho admin: ghi trực tiếp vào bucket `assets` bằng service role
// (bypass RLS), hạn chế hình ảnh quá lớn, định dạng không hợp lệ.
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

/** Upload một file tới bucket `assets` (service role, bypass RLS). */
export async function uploadFile(file: File, path: string): Promise<UploadResult> {
  const client = await adminClient()

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Định dạng file không hợp lệ: ${file.type}`)
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File quá lớn: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
  }

  const { error } = await client.storage.from('assets').upload(path, file, { upsert: true })
  if (error) {
    throw new Error(`Upload thất bại: ${error.message}`)
  }

  const { data } = client.storage.from('assets').getPublicUrl(path)
  return {
    path,
    url: data?.publicUrl ?? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${path}`,
  }
}
