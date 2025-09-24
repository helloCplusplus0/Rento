import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppLayout } from '@/components/layout'
import { AlertManagerProvider } from '@/components/providers/AlertManagerProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rento - 房屋租赁管理系统',
  description: '专业的房屋租赁管理系统，提供房源管理、租客管理、合同管理、账单管理等功能',
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
          <AppLayout>
            {children}
          </AppLayout>
        </AlertManagerProvider>
      </body>
    </html>
  )
}
