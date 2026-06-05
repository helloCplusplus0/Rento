import { Compass } from 'lucide-react'

import { StatusPageShell } from './StatusPageShell'

export function NotFoundPage() {
  return (
    <StatusPageShell
      badge="404"
      title="页面未找到"
      description="抱歉，您访问的页面不存在或尚未迁移到新的 React Router 宿主中。当前 404 页继续沿用现有产品的最小回退信息结构。"
      icon={<Compass className="h-6 w-6" />}
      accentClassName="bg-blue-600 text-white"
      tips={[
        '您可以先返回工作台，再通过新的统一导航进入已承接的模块页面。',
        '若当前是深链接访问，说明该路由仍保留在旧宿主参考侧或尚未进入迁移范围。',
      ]}
      actions={[
        { label: '返回工作台', to: '/' },
        { label: '前往房源', to: '/rooms', variant: 'outline' },
      ]}
    />
  )
}
