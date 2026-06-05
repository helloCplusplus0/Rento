import { WifiOff } from 'lucide-react'

import { StatusPageShell } from './StatusPageShell'

export function OfflinePage() {
  return (
    <StatusPageShell
      badge="Offline Fallback"
      title="当前网络不可用"
      description="这里是 Rento-miniX 的最小离线兜底页。当前仅承接静态壳、manifest、图标与本页本身，不缓存动态业务接口和登录态业务页面响应。"
      icon={<WifiOff className="h-6 w-6" />}
      accentClassName="bg-slate-900 text-white"
      tips={[
        '建议操作：',
        '1. 检查 Wi-Fi 或移动网络连接后刷新页面。',
        '2. 网络恢复后重新打开工作台或当前业务页面。',
        '3. 如当前处于登录态超时，请回到登录页重新进入。',
      ]}
      actions={[
        { label: '返回工作台', to: '/' },
        { label: '返回登录页', to: '/login', variant: 'outline' },
      ]}
    />
  )
}
