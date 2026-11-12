import type { MetadataRoute } from 'next'

import { createClient } from '@/lib/supabase/server'

/** Tái tạo lại sitemap sau mỗi giờ (chu kỳ chuẩn: 1 giờ). */
export const revalidate = 3600

/**
 * Sitemap động theo dữ liệu DB (chỉ các sản phẩm công khai).
 * Các trang tĩnh (`/`, `/bo-suu-tap`, `/gioi-thieu`, `/lien-he`) được hardcode.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL ?? 'https://tiemhoa-cobe-cube.pages.dev'

  const urls: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/bo-suu-tap`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/gioi-thieu`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/lien-he`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    // Client không có session (anon) → RLS tự lọc chỉ các sản phẩm `published + is_active`.
    const client = await createClient()
    if (!client) return urls

    const { data: products } = await client
      .from('products')
      .select('slug,updated_at')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })

    for (const product of products ?? []) {
      urls.push({
        url: `${siteUrl}/san-pham/${product.slug}`,
        lastModified: product.updated_at,
        changeFrequency: 'daily',
        priority: 0.7,
      })
    }
  } catch {
    // Sitemap chỉ cần đọc cho Google: lỗi DB không được làm trắng trang.
  }

  return urls
}
