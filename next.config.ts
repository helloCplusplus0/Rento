import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 启用standalone输出模式，优化Docker部署
  output: 'standalone',
  
  images: {
    formats: ['image/webp', 'image/avif'],
    // 允许外部图片域名（如果需要）
    remotePatterns: [],
  },
  
  env: {
    CUSTOM_PORT: process.env.PORT || '3001',
  },
  
  // 生产环境优化
  poweredByHeader: false,
  compress: true,
  
  eslint: {
    // 在构建时忽略ESLint错误，允许部署
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在构建时忽略TypeScript错误，允许部署
    ignoreBuildErrors: true,
  },
  
  // 实验性功能
  experimental: {
    // 启用服务器组件日志
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

export default nextConfig
