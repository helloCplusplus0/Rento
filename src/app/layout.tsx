import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'

import { AppLayout } from '@/components/layout'
import { AlertManagerProvider } from '@/components/providers/AlertManagerProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rento - 房屋租赁管理系统',
  description:
    '专业的房屋租赁管理系统，提供房源管理、租客管理、合同管理、账单管理等功能',
  keywords: [
    '房屋租赁',
    '租赁管理',
    '房源管理',
    '租客管理',
    '合同管理',
    '账单管理',
  ],
  authors: [{ name: 'Rento Team' }],
  manifest: '/manifest.json',
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Rento',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 基础PWA支持 */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/icon-72x72.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/icon-72x72.png"
        />
      </head>
      <body className={inter.className}>
        <AlertManagerProvider>
          <AppLayout>{children}</AppLayout>
        </AlertManagerProvider>
      </body>
    </html>
  )
}
