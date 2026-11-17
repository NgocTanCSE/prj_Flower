import path from 'node:path'

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
  /** Alias `@/` (default của Next) vào thư mục `src/` để webpack/thử tự giải quyết `tsconfig paths`. */
  webpack(config) {
    const srcDir = path.resolve(new URL('.', import.meta.url).pathname, 'src')
    config.resolve.alias = { ...config.resolve.alias, '@': srcDir, '@/': srcDir }
    return config
  },
}

export default nextConfig
