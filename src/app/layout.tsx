import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'

import { AppLayout } from '@/components/layout'
import { PwaInstallPrompt } from '@/components/layout/PwaInstallPrompt'
import { AlertManagerProvider } from '@/components/providers/AlertManagerProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rento - 房屋租赁管理系统',
  applicationName: 'Rento',
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
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
  },
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Rento',
  },
  other: {
    'mobile-web-app-capable': 'yes',
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
      <body className={inter.className}>
        <AlertManagerProvider>
          <>
            <AppLayout>{children}</AppLayout>
            <PwaInstallPrompt />
          </>
        </AlertManagerProvider>
      </body>
    </html>
  )
}
