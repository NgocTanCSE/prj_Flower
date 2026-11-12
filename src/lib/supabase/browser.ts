'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Environment. Các biến này chỉ tồn tại ở phía server (npm build), nhưng
// module này chỉ được import từ `use client` component nên luôn an toàn.
// ---------------------------------------------------------------------------

/** URL của Supabase project. */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
/** Khóa anon công khai, dùng cho trình duyệt (RLS). */
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * COOKIE_OPTIONS: tên cookie `sb-session` phải trùng với `src/lib/supabase/server.ts`
 * để tương quan client - server.
 */
const COOKIE_OPTIONS = {
  name: 'sb-session',
  path: '/',
  httpOnly: false,
  secure: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 365,
}

/**
 * Client dùng cho trình duyệt (client component).
 *
 * Session được lưu vào `document.cookie` (cookie `sb-session`), trùng với cookie
 * mà SSR client (`src/lib/supabase/server.ts`) đọc từ request header. Nhờ vậy,
 * server component / server action có thể xác thực phiên vừa được thiết lập.
 *
 * @see createBrowserClient @supabase/ssr
 */
export function createBrowserAuthClient(): SupabaseClient {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: COOKIE_OPTIONS,
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
  })
}
