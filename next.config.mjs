/** @type {import('next').NextConfig} */
export const nextConfig = {
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
        hostname: 'images.tiemhoacobecube.com',
      },
    ],
  },
};

export default nextConfig;
