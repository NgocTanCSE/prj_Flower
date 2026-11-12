/**
 * Bố cục trang khách: Header + nội dung + Footer.
 * CSS site (variables, utility) được nạp qua src/app/globals.css (import Chain).
 */
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import type { ReactNode } from 'react'

export const metadata = {
  title: {
    default: 'Tiệm Hoa CoBeCuBe - Hoa tươi trọn niềm vui',
    template: '%s | CoBeCuBe',
  },
  description: 'Chuyên bán hoa tươi, hoa cưới, hoa sinh nhật, quà tặng giao hàng nhanh tại TP. Hồ Chí Minh.',
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
