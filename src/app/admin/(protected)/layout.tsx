import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { getSessionUser, isAdmin } from '@/lib/supabase/server'
import { AdminLayoutNav } from '@/components/admin/AdminLayoutNav'
import { ToastContainer } from '@/components/admin/toast/ToastContainer'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // 1. Bảo vệ: session + role admin (kết hợp với middleware.ts).
  const user = await getSessionUser()
  if (!user) redirect('/admin/login')
  if (!(await isAdmin(user.profile))) redirect('/')

  return (
    <div className="admin-shell min-h-screen bg-[#f8f7f6] lg:pl-60">
      {/* ---- Sidebar trái (desktop: cố định; mobile: drawer) ---- */}
      <AdminLayoutNav userLabel={user.profile?.full_name ?? 'Admin'} />

      {/* ---- Body ---- */}
      {/* Sidebar desktop rộng 15rem (fixed). Dùng `lg:pl-60` trên shell để
          chừa đúng khoảng đó, main chỉ việc chiếm 100% phần còn lại — không
          còn max-width / margin thủ công nên nội dung luôn full màn hình. */}
      <main className="admin-main w-full px-4 mt-14 lg:mt-0 lg:px-6 xl:px-8">
        {children}
      </main>

      {/* ---- Toasts ---- */}
      <ToastContainer />
    </div>
  )
}
