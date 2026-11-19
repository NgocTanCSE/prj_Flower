'use server'

import { revalidatePath } from 'next/cache'

import { uploadFile } from '@/app/admin/api/actions/upload'
import { createAdminClient } from '@/app/admin/api/actions/auth'
import { logAudit } from '@/lib/upload'
import { newBigIntId } from '@/lib/ids'

// ---------------------------------------------------------------------------
// Bảng `gallery_images` (0001_init.sql):
//   id bigint, url text, alt text, category text, sort_order bigint,
//   is_active bool, created_at timestamptz
// ---------------------------------------------------------------------------

export interface GalleryImage {
  id: number
  url: string
  alt: string | null
  category: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export type GalleryFilter = 'all' | 'visible' | 'hidden'

/**
 * Thêm một ảnh vào thư viện (upload lên bucket `assets`, ghi vào `gallery_images`).
 *
 * Trả về `{ ok, error }` thay vì throw: lỗi server action bị Next MASK trong
 * production ("An error occurred in the Server Components render..."), nên
 * trả kết quả có cấu trúc để client hiển thị đúng nguyên nhân.
 */
export async function addGalleryImage(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = await createAdminClient()

    const file = formData.get('file')
    const alt = String(formData.get('alt') ?? '')
    const category = String(formData.get('category') ?? '')
    const sortOrderRaw = Number(formData.get('sort_order'))
    const sort_order = Number.isFinite(sortOrderRaw) ? sortOrderRaw : 999

    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: 'Vui lòng chọn một ảnh.' }
    }

    const { url } = await uploadFile(file, `gallery/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_-]/g, '')}`)

    const { data, error } = await client
      .from('gallery_images')
      // `id`: bảng chưa có default (0005 bổ sung). `alt`/`category` là NOT NULL
      // nên phải gửi chuỗi rỗng thay vì null, tránh vi phạm ràng buộc.
      .insert({ id: newBigIntId(), url, alt, category, sort_order, is_active: true })
      .select('id')
      .single()

    if (error) {
      return { ok: false, error: `Thêm ảnh thất bại: ${error.message}` }
    }

    await logAudit({
      action: 'thuvien-add',
      table: 'gallery_images',
      record_id: String(data?.id),
      data: { alt, category, sort_order },
    })

    revalidatePath('/admin/thu-vien')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Thêm ảnh thất bại.' }
  }
}

/** Cập nhật chú thích / thứ tự / trạng thái hiển thị. */
export async function updateGalleryImage(
  id: string,
  payload: { alt?: string; sort_order?: number; is_active?: boolean }
): Promise<{ ok: boolean; error?: string }> {
  const client = await createAdminClient()

  const { error } = await client
    .from('gallery_images')
    .update({ ...payload })
    .eq('id', Number(id))

  if (error) {
    return { ok: false, error: `Cập nhật ảnh thất bại: ${error.message}` }
  }

  await logAudit({ action: 'thuvien-update', table: 'gallery_images', record_id: String(id), data: payload })
  revalidatePath('/admin/thu-vien')
  return { ok: true }
}

/** Xóa ảnh khỏi hệ thống. */
export async function deleteGalleryImage(id: string): Promise<{ ok: boolean; error?: string }> {
  const client = await createAdminClient()

  // Lấy đường dẫn ảnh để xóa luôn khỏi bộ lưu trữ.
  const { data: img, error: imgError } = await client
    .from('gallery_images')
    .select('url')
    .eq('id', Number(id))
    .single()

  if (imgError || !img) {
    return { ok: false, error: 'Ảnh không tồn tại.' }
  }

  const { error } = await client.from('gallery_images').delete().eq('id', Number(id))

  if (error) {
    return { ok: false, error: `Xóa ảnh thất bại: ${error.message}` }
  }

  await logAudit({ action: 'thuvien-delete', table: 'gallery_images', record_id: String(id) })
  revalidatePath('/admin/thu-vien')
  return { ok: true }
}
