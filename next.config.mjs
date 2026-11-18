import { fileURLToPath } from 'node:url'

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

/** @type {import('next').NextConfig} */
export const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
  /** Build dưới dạng SSR (Node runtime) — tương thích với Server Actions / API routes. */
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.cfassets.net',
      },
      {
        protocol: 'https',
        hostname: 'images.tiemhoashopflower.com',
      },
    ],
  },
  /**
   * Security headers cho các route do Next.js xử lý.
   * Cache của static assets nằm trong `public/_headers` vì Cloudflare phục vụ
   * static assets trước worker.
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
  /** Alias `@/` (default của Next) vào thư mục `src/` để webpack/thử tự giải quyết `tsconfig paths`. */
  webpack(config) {
    const srcDir = fileURLToPath(new URL('./src', import.meta.url))
    config.resolve.alias = { ...config.resolve.alias, '@': srcDir, '@/': srcDir }
    return config
  },
}

export default nextConfig

// Cho phép `next dev` truy cập bindings/Cloudflare context cục bộ.
initOpenNextCloudflareForDev()
