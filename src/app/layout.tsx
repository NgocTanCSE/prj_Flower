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

import { getSettings } from '@/lib/getProducts'
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

const FALLBACK_TITLE = 'Tiệm Hoa CoBeCuBe - Hoa tươi trọn niềm vui'
const FALLBACK_DESC = 'Chuyên bán hoa tươi, hoa cưới, hoa sinh nhật, quà tặng giao hàng nhanh tại TP. Hồ Chí Minh.'

/** Tiêu đề / mô tả / tab theo thông tin shop website. */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsSafe()
  const shopName = setting(settings, 'shop_name') || 'Tiệm Hoa CoBeCuBe'

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
  const primary = setting(settings, 'site_theme_primary') || '#8b5f65'
  const bodyColor = setting(settings, 'site_theme_body') || '#1a1a1a'

  return (
    <html
      lang="vi"
      className="antialiased"
      style={{ '--color-primary': primary, '--color-primary-hover': '#764f54', '--color-ink': bodyColor } as React.CSSProperties}
    >
      <body className="antialiased">{children}</body>
    </html>
  )
}
