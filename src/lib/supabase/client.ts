import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Environment.
// `PUBLIC_` supers được cung cấp bởi CI / Netlify / Vercel.
//钥 (service_role) KHÔNG bao giờ xuống phía client.
// ---------------------------------------------------------------------------

/** Đường dẫn cơ sở Supabase project (ví dụ: https://abc123.supabase.co). */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
/** Khóa anon công khai. Dùng cho tài nguyên đọc công cộng (RLS). */
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

/**
 * Supabase client dùng cho truy vấn công cộng (RLS cho phép ẩn danh đọc/select).
 *
 * Chỉ dùng để đọc dữ liệu (products, reviews, gallery, settings), vì vậy
 * `persist: false` giúp session không bị ghi xuống trình duyệt - tránh việc
 * một truy vấn công cộng tự ý khởi tạo session.
 *
 * @see `browser.ts` cho client side (chứa session thực).
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export default supabase
