import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 图片优化配置
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // 自定义端口配置 (避免与 podman 冲突)
  env: {
    CUSTOM_PORT: process.env.PORT || '3001',
  },
}

export default nextConfig
