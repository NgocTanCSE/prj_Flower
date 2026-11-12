import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { getSessionUser, isAdmin } from '@/lib/supabase/server'
import { logout } from '../(auth)/actions'

const NAV = [
  { label: 'Danh giá', href: '/admin/danh-gia' },
  { label: 'Thư viện', href: '/admin/thu-vien' },
  { label: 'Sản phẩm', href: '/admin/san-pham', future: true },
  { label: 'Danh mục', href: '/admin/danh-muc', future: true },
  { label: 'Cài đặt', href: '/admin/cai-dat', future: true },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // 1. Bảo vệ: session + role admin (kết hợp với middleware.ts).
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (!(await isAdmin(user.profile))) redirect('/')

  return (
    <div className="min-h-screen bg-[#f8f7f6]">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-40 border-b border-[#e8e1e1] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-bold text-[#8b5f65]">
              CoBeCuBe Admin
            </Link>
            <nav className="hidden sm:flex">
              {NAV.filter((n) => !n.future).map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-lg px-3 py-2 text-sm text-[#5b5b5b] transition-colors
                    hover:bg-[#f4eeef] hover:text-[#8b5f65]"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-[#5b5b5b]">{user.profile?.full_name ?? 'Admin'}</span>
            <form action={logout} method="post">
              <button
                type="submit"
                className="rounded-lg border border-[#e8e1e1] bg-white px-4 py-2 text-sm text-[#5b5b5b]
                  transition-colors hover:bg-[#f4eeef] hover:text-[#8b5f65]"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ---- Body ---- */}
      <main className="mx-auto max-w-7xl sm:px-4">{children}</main>
    </div>
  )
}
