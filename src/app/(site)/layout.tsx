/**
 * Bố cục trang khách: Header + nội dung + Footer.
 *
 * CSS site (variables, utility) được nạp qua src/app/globals.css (import Chain).
 * Theme color của admin (`site_theme_primary`, `site_theme_body`) được áp
 * dụng thông qua CSS variable của `src/styles/site.css` (override).
 *
 * Tiêu đề tab + mô tả SEO đọc từ database `settings`, thương hiệu (tên shop +
 * logo) được chuyền xuống Header.
 */
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'

import { getSetting } from '@/lib/getProducts'

/** Đọc an toàn một setting (Supabase chưa sẵn → ''). */
async function setting(key: string): Promise<string> {
  try {
    return await getSetting(key)
  } catch {
    return ''
  }
}

/** Mô tả SEO mặc định khi chưa cấu hình nào. */
const FALLBACK_DESC = 'Chuyên bán hoa tươi, hoa cưới, hoa sinh nhật, quà tặng giao hàng nhanh tại TP. Hồ Chí Minh.'

export async function generateMetadata(): Promise<Metadata> {
  const shopName = (await setting('shop_name')) || 'Tiệm Hoa CoBeCuBe'
  return {
    title: {
      default: `${shopName} - Hoa tươi trọn niềm vui`,
      template: '%s | ' + shopName,
    },
    description: (await setting('seo_meta_description')) || FALLBACK_DESC,
  }
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const shopName = (await setting('shop_name')) || 'Tiệm Hoa CoBeCuBe'
  const logoUrl = (await setting('shop_logo_url')) || ''

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Header shopName={shopName} logoUrl={logoUrl} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
