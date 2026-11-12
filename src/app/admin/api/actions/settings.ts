'use server'

import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/upload'
import { supabase } from '@/lib/supabase/client'
import { requireAdmin, createAdminClient } from './auth'
import { z } from 'zod'
import { SETTING_KEYS } from '@/lib/getProducts'

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
  const { data, error } = await supabase
    .from('settings')
    .select('key, value, updated_at')
    .order('key')

  if (error) throw new Error(`Lỗi lấy cài đặt: ${error.message}`)

  const existing = new Set((data ?? []).map((s) => s.key))
  const rows: SettingRow[] = data ?? []
  // Tạo placeholder cho khóa nào chưa tồn tại.
  for (const key of settingKeys) {
    if (!existing.has(key)) {
      rows.push({ key, value: '', updated_at: new Date().toISOString() })
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

  const newRows: SettingRow[] = []
  for (const [key, value] of Object.entries(parsed.data) as [keyof typeof SETTING_KEYS, string][]) {
    if (value !== '') newRows.push({ key, value, updated_at: new Date().toISOString() })
  }

  if (newRows.length === 0) return

  const client = await createAdminClient()
  const { error } = await client.from('settings').upsert(newRows, { onConflict: 'key' })

  if (error) throw new Error(`Cập nhật cài đặt thất bại: ${error.message}`)

  await logAudit({ action: 'cai-dat-update', table: 'settings' })
  revalidatePath('/admin/cai-dat')
}

/** Đọc một cài đặt duy nhất. */
export async function getSetting(key: string): Promise<string> {
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
  revalidatePath('/admin/cai-dat')
  return { ok: true }
}
