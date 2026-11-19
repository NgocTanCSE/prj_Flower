/**
 * Bố cục gốc (root layout): CSS toàn cục, metadata động (title / description /
 * icon) và các CSS variable `--color-...` chịu áp dụng từ cài đặt theme của
 * admin (`site_theme_primary`, `site_theme_body`).
 *
 * Style inline nhúng vào `<html>` (ưu tiên hơn các giá trị mặc định
 * của `src/styles/site.css`) để admin có thể đổi màu mà không rebuild.
 */
import './globals.css'
import React from 'react'
import type { Metadata } from 'next'

import { getSettings, SETTING_DEFAULTS } from '@/lib/getProducts'
import type { Setting } from '@/lib/getProducts'

/** Lấy một giá trị setting theo `key` (`''` khi không tìm thấy). */
function setting(list: Setting[], key: string): string {
  return list.find((s) => s.key === key)?.value ?? ''
}

/** Lấy danh sách settings an toàn (Supabase chưa cấu hình khỏi làm crash trang). */
async function getSettingsSafe(): Promise<Setting[]> {
  try {
    return await getSettings()
  } catch {
    return []
  }
}

const FALLBACK_TITLE = 'Tiệm Hoa Shop Flower - Hoa tươi trọn niềm vui'
const FALLBACK_DESC = 'Chuyên bán hoa tươi, hoa cưới, hoa sinh nhật, quà tặng giao hàng nhanh tại TP. Hồ Chí Minh.'

/**
 * Chuẩn hoá màu từ DB về `#rrggbb`. Giá trị lạ (dữ liệu cũ, nhập sai) →
 * dùng mặc định để CSS không bị hỏng.
 */
function safeHex(value: string, fallback: string): string {
  const match = value.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!match) return fallback
  let hex = match[1].toLowerCase()
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  return `#${hex}`
}

/** Tiêu đề / mô tả / tab theo thông tin shop website. */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsSafe()
  const shopName = setting(settings, 'shop_name') || 'Tiệm Hoa Shop Flower'

  return {
    title: {
      default: setting(settings, 'seo_meta_title') || `${shopName} - Hoa tươi trọn niềm vui`,
      template: '%s | ' + shopName,
    },
    description: setting(settings, 'seo_meta_description') || FALLBACK_DESC,
    icons: { icon: setting(settings, 'shop_favicon_url') || '/favicon.svg' },
    manifest: '/manifest.json',
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettingsSafe()
  const primary = safeHex(setting(settings, 'site_theme_primary'), SETTING_DEFAULTS.site_theme_primary)
  const bodyColor = safeHex(setting(settings, 'site_theme_body'), SETTING_DEFAULTS.site_theme_body)

  // Suy ra các sắc độ từ màu chủ đạo để đổi theme là đổi ĐỒNG BỘ toàn site
  // (nút hover, viền, nền tag, bóng đổ...). Trước đây chỉ `--color-primary`
  // được ghi đè nên chọn màu khác vẫn còn viền/tag màu hồng cũ.
  const themeVars = {
    '--color-primary': primary,
    '--color-primary-hover': `color-mix(in srgb, ${primary} 82%, #000)`,
    '--color-primary-dark': `color-mix(in srgb, ${primary} 72%, #000)`,
    '--color-primary-light': `color-mix(in srgb, ${primary} 62%, #fff)`,
    '--color-primary-soft': `color-mix(in srgb, ${primary} 12%, transparent)`,
    '--color-tag-bg': `color-mix(in srgb, ${primary} 8%, #fff)`,
    '--color-tag-text': primary,
    '--color-border': `color-mix(in srgb, ${primary} 14%, #fff)`,
    '--color-ink': bodyColor,
    '--shadow-card': `0 8px 24px color-mix(in srgb, ${primary} 12%, transparent)`,
    '--shadow-hover': `0 12px 32px color-mix(in srgb, ${primary} 18%, transparent)`,
  } as React.CSSProperties

  return (
    <html lang="vi" className="antialiased" style={themeVars}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
