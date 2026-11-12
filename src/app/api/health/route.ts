import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

/**
 * Kiểm tra mức độ sẵn sàng của Supabase (healthcheck) ngoài giờ deploy
 * và từ các service (dùng để gọi ping từ phân phối hoặc trách nhiệm tốt).
 */
export async function GET() {
  const start = Date.now()
  let status: 'ok' | 'degraded' | 'down' = 'ok'
  const errors: string[] = []

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { status: 'degraded', elapsed_ms: Date.now() - start, details: 'Thiếu biến môi trường Supabase' },
      { status: 200 }
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // 1. Kiểm tra trạng thái DB.
  try {
    const { error } = await supabase.from('products').select('id').limit(1)
    if (error) {
      status = 'degraded'
      errors.push(`db: ${error.message}`)
    }
  } catch (error) {
    status = 'down'
    errors.push(`db: ${(error as Error).message}`)
  }

  // 2. Kiểm tra trạng thái Storage.
  try {
    const { data } = await supabase.storage.from('assets').getPublicUrl('does-not-exist.webp')
    if (!data?.publicUrl) {
      status = 'degraded'
      errors.push('storage: không có publicUrl')
    }
  } catch (error) {
    status = 'down'
    errors.push(`storage: ${(error as Error).message}`)
  }

  return NextResponse.json({
    status,
    elapsed_ms: Date.now() - start,
    healthcheck: 'ok',
    details: errors.length ? errors : undefined,
    timestamp: new Date().toISOString(),
  })
}
