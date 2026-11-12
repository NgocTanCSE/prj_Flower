import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Environment.
// `NEXT_PUBLIC_` biến được cung cấp bởi CI / Netlify / Vercel.
// Service role key KHÔNG bao giờ xuống phía client.
// ---------------------------------------------------------------------------

/** Đường dẫn cơ sở Supabase project (rỗng khi chưa cấu hình). */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
/** Khóa anon công khai (rỗng khi chưa cấu hình). */
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * Client supabase dùng để đọc dữ liệu công cộng (RLS cho phép ẩn danh đọc/select).
 *
 * Được tạo theo nhu cầu và trả về `null` khi Supabase chưa được cấu hình:
 * `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` ném lỗi `supabaseUrl is required.`
 * ngay khi tải module, điều này khiến toàn bộ dự án không thể build trong một
 * môi trường không có biến môi trường.
 *
 * Chỉ dùng để đọc dữ liệu ngày (products, reviews, gallery, settings), vì vậy
 * `persist: false` giúp session không bị ghi xuống trình duyệt - tránh việck
 * một truy vấn công cộng tự ý khởi tạo session.
 *
 * @see `browser.ts` cho client side (chứa session thực).
 */
export function createSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL) return null
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default createSupabaseClient
