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
  description: 'Rento 最小离线兜底页入口，仅用于受控环境下的最小 service worker 退化。',
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
              这里是 Rento 的最小离线兜底页。当前 service worker 只缓存静态壳资源、`manifest`、图标与本页本身，不缓存动态业务接口和鉴权态业务页面响应。
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <p>建议操作：</p>
            <p>1. 检查 Wi-Fi 或移动网络连接后刷新页面。</p>
            <p>2. 网络恢复后重新打开工作台或当前业务页面。</p>
            <p>3. 如当前处于登录态超时，请回到登录页重新进入。</p>
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
