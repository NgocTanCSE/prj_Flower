/**
 * Bố cục gốc: chỉ khuyến một CSS trang toàn cục.
 * Nội dung Chrome (Header / Footer) nằm trong `src/app/(site)/layout.tsx`.
 */
import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: {
    default: 'Tiệm Hoa CoBeCuBe - Hoa tươi trọn niềm vui',
    template: '%s | CoBeCuBe',
  },
  description: 'Chuyên bán hoa tươi, hoa cưới, hoa sinh nhật, hoa quà tặng giao hàng nhanh tại TP. Hồ Chí Minh.',
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className="antialiased">
      <body className="antialiased">{children}</body>
    </html>
  )
}
