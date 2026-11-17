import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------
// HTTP(route) bảo vệ:
//   - `/admin/*`      : chặn khi không có phiên (hoặc không phải admin).
//   - `/admin/login`  : trang đăng nhập ẩn (không cần session).
// ---------------------------------------------------------------

const ADMIN_LOGIN = '/admin/login'

export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next()

  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // 1. Cho phép truy cập `/admin/login` mà không cần session.
  if (pathname === ADMIN_LOGIN) {
    return response
  }

  // 2. Admin: chặn `/admin/*` khi không có session (hoặc không phải admin).
  if (pathname.startsWith('/admin')) {
    const supabase = await createClient(request, response)

    if (!supabase) {
      return response
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url))
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return response
  }

  // Các đường dẫn khác (công cộng): đi tiếp.
  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}