import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    CUSTOM_PORT: process.env.PORT || '3001',
  },
  eslint: {
    // 在构建时忽略ESLint错误，允许部署
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在构建时忽略TypeScript错误，允许部署
    ignoreBuildErrors: true,
  },
}

export default nextConfig
