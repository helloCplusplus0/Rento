import type { Metadata } from 'next'
import Link from 'next/link'
import { WifiOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: '离线提示 | Rento',
  description: 'Rento 最小离线兜底页入口，供 phase05 后续 service worker 复用。',
  robots: {
    index: false,
    follow: false,
  },
}

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-lg border-slate-200 shadow-lg shadow-slate-200/60">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white">
            <WifiOff className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl text-slate-900">
              当前网络不可用
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-600">
              这里是 `phase05-pwa-delivery-02` 预留的最小离线入口。当前阶段尚未启用
              service worker 缓存，后续 `phase05-pwa-delivery-03` 会在不扩张业务离线写入的前提下复用此页。
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <p>建议操作：</p>
            <p>1. 检查 Wi-Fi 或移动网络连接后刷新页面。</p>
            <p>2. 如已登录，可重新回到工作台继续在线使用。</p>
            <p>3. 如尚未登录，可先回到登录页等待网络恢复。</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/">返回工作台</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/login">返回登录页</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
