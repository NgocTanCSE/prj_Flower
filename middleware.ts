import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------
// HTTP(route) bảo vệ:
//   - `/admin/*`       : chặn khi không có phiên (hoặc không phải admin).
//   - `/auth*`         : map proposal của route group (auth) -> `/login|/register|...`
// ---------------------------------------------------------------

// Trang mặc định khi đi đến `/auth` (route group `(auth)`).
const AUTH_DEFAULT = '/login'

export async function middleware(request: NextRequest) {
  // Middleware không thể chạy khi Supabase chưa được cấu hình (không có biến
  // môi trường); bỏ qua tất cả các bước trung gian để build giữ được ổn định.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.next()

  const response = NextResponse.next()

  const { pathname } = request.nextUrl

  // 1. Rewrite `/auth*` -> `/auth/*` (chuẩn hóa + ánh xạ về route group).
  if (pathname.startsWith('/auth')) {
    const rest = pathname.slice('/auth'.length)
    // `/auth` -> `/login`, `/auth/login` -> `/login`, `/auth/register` -> `/register`.
    const target = rest && rest !== '/' ? rest : AUTH_DEFAULT
    return NextResponse.rewrite(target)
  }

  // 2. Admin: chặn `/admin` khi không có session (và không phải admin).
  if (pathname.startsWith('/admin')) {
    const supabase = await createClient(request, response)

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Admin chỉ khi `profiles.role = 'admin'` (auth.users.id của session).
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return response
  }

  // Các đường dẫn khác (công cộng): đi tiếp.
  return response
}

// Chỉ theo dõi những đường dẫn cần bảo vệ / rewrite.
export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
}
