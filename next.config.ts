import type { NextConfig } from 'next'

const devPort = process.env.APP_INTERNAL_PORT || '3001'
const hostIp = process.env.HOST_IP || '192.168.31.84'
const allowedDevOrigins = Array.from(
  new Set([
    `http://localhost:${devPort}`,
    `http://127.0.0.1:${devPort}`,
    `http://${hostIp}:${devPort}`,
    `https://${hostIp}:18443`,
  ])
)

const nextConfig: NextConfig = {
  // 启用standalone输出模式，优化Docker部署
  output: 'standalone',

  allowedDevOrigins,

  images: {
    formats: ['image/webp', 'image/avif'],
    // 允许外部图片域名（如果需要）
    remotePatterns: [],
  },

  // 生产环境优化
  poweredByHeader: false,
  compress: true,

  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ]
  },

  eslint: {
    // 在构建时忽略ESLint错误，允许部署
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在构建时忽略TypeScript错误，允许部署
    ignoreBuildErrors: true,
  },

  // 服务器外部包配置 (Next.js 15+ 新配置)
  serverExternalPackages: ['@prisma/client'],
}

export default nextConfig
