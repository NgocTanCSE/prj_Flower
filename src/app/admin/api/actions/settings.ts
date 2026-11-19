'use server'

import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/upload'
import { createSupabaseClient } from '@/lib/supabase/client'
import { requireAdmin, createAdminClient } from './auth'
import { uploadFile } from './upload'
import { z } from 'zod'
import { COLOR_SETTING_KEYS, SETTING_DEFAULTS, SETTING_KEYS } from '@/lib/getProducts'

// ---------------------------------------------------------------------------
// Cài đặt site (`settings` bảng: `key` PRIMARY KEY, `value` text)
// ---------------------------------------------------------------------------

export interface SettingRow {
  key: string
  value: string
  updated_at: string
}

/** Các khóa cài đặt tiêu chuẩn của site (cùng `lib/getProducts.ts`). */
const settingKeys = Object.keys(SETTING_KEYS) as (keyof typeof SETTING_KEYS)[]

const settingSchema = z.object(
  Object.fromEntries(settingKeys.map((key) => [key, z.string().default('')])) as unknown as Record<keyof typeof SETTING_KEYS, z.ZodString>
)

/** Tất cả cài đặt (các key chưa có sẽ được tạo placeholder). */
export async function getSettingsForAdmin(): Promise<SettingRow[]> {
  const supabase = await createSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('settings')
    .select('key, value, updated_at')
    .order('key')

  if (error) throw new Error(`Lỗi lấy cài đặt: ${error.message}`)

  const existing = new Set((data ?? []).map((s) => s.key))
  const rows: SettingRow[] = data ?? []
  // Tạo placeholder cho khóa nào chưa tồn tại — dùng giá trị mặc định thay vì
  // chuỗi rỗng để admin thấy đúng màu/thiết lập đang được áp dụng.
  for (const key of settingKeys) {
    if (!existing.has(key)) {
      rows.push({ key, value: SETTING_DEFAULTS[key] ?? '', updated_at: new Date().toISOString() })
    }
  }
  return rows.sort((a, b) => a.key.localeCompare(b.key))
}

/** Cập nhật nhiều cài đặt cùng lúc. */
export async function updateSettings(formData: FormData): Promise<void> {
  await requireAdmin()

  const values = Object.fromEntries(formData)
  const parsed = settingSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error(`Dữ liệu không hợp lệ: ${parsed.error.issues[0].message}`)
  }

  // Màu theme: chỉ nhận #rgb / #rrggbb (chuỗi rỗng = dùng mặc định). Chặn giá
  // trị rác để CSS variable không bị hỏng và màu hiển thị sai.
  const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
  for (const key of COLOR_SETTING_KEYS) {
    const color = (parsed.data[key] ?? '').trim()
    if (color !== '' && !HEX_COLOR.test(color)) {
      throw new Error(`${SETTING_KEYS[key]} không hợp lệ: cần mã hex, ví dụ #8b5f65.`)
    }
  }

  const newRows: SettingRow[] = []
  for (const key of settingKeys) {
    // Chỉ ghi key THỰC SỰ có trong form. Ghi cả giá trị rỗng để admin có thể
    // xoá một cài đặt (vd: bỏ ảnh banner để quay về ảnh đầu thư viện).
    if (!Object.prototype.hasOwnProperty.call(values, key)) continue
    const raw = parsed.data[key] ?? ''
    const isColor = (COLOR_SETTING_KEYS as readonly string[]).includes(key)
    newRows.push({ key, value: isColor ? raw.trim() : raw, updated_at: new Date().toISOString() })
  }

  if (newRows.length === 0) return

  const client = await createAdminClient()
  const { error } = await client.from('settings').upsert(newRows, { onConflict: 'key' })

  if (error) throw new Error(`Cập nhật cài đặt thất bại: ${error.message}`)

  await logAudit({ action: 'cai-dat-update', table: 'settings' })

  // Làm tươi trang admin + các trang site (theme màu, thương hiệu, SEO...)
  // đang đọc giá trị từ bảng `settings` ở Root Layout / Site Layout.
  revalidatePath('/admin/cai-dat')
  for (const path of ['/bo-suu-tap', '/gioi-thieu', '/lien-he', '/search', '/']) {
    revalidatePath(path)
  }
}

/** Đọc một cài đặt duy nhất. */
export async function getSetting(key: string): Promise<string> {
  const supabase = await createSupabaseClient()
  if (!supabase) return ''

  const { data } = await supabase.from('settings').select('value').eq('key', key).limit(1).single()
  return data?.value ?? ''
}

/** Thêm / cập nhật một khóa cài đặt bất kỳ (view_total, SEO ...). */
export async function updateSetting(key: string, value: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  const client = await createAdminClient()
  const { error } = await client.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw new Error(`Cập nhật cài đặt thất bại: ${error.message}`)
  await logAudit({ action: 'cai-dat-update', table: 'settings', record_id: key })

  // Làm tươi trang admin + các trang site đang đọc các cài đặt cần thiết.
  revalidatePath('/admin/cai-dat')
  for (const path of ['/bo-suu-tap', '/gioi-thieu', '/lien-he', '/search', '/']) {
    revalidatePath(path)
  }
  return { ok: true }
}

/**
 * Upload ảnh nền banner (hero) từ trang Cài đặt.
 * Trả `{ ok, url }` thay vì throw để client hiển thị đúng lỗi trong production.
 */
export async function uploadHeroImage(formData: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: 'Vui lòng chọn một ảnh.' }
    }
    // Giữ tên file an toàn cho đường dẫn storage.
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '') || 'hero.jpg'
    const { url } = await uploadFile(file, `hero/${Date.now()}-${safeName}`)
    return { ok: true, url }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Upload ảnh banner thất bại.' }
  }
}
