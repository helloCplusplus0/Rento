import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/**
 * 404 页面组件
 * 当用户访问不存在的页面时显示
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          {/* 404 图标 */}
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.007-5.691-2.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
              />
            </svg>
          </div>

          {/* 404 信息 */}
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            页面未找到
          </h2>
          <p className="text-gray-600 mb-6">
            抱歉，您访问的页面不存在或已被移动
          </p>

          {/* 导航按钮 */}
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/">
                返回首页
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/rooms">
                房源管理
              </Link>
            </Button>
          </div>

          {/* 快捷链接 */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">您可能在寻找：</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link 
                href="/bills" 
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                账单管理
              </Link>
              <Link 
                href="/contracts" 
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                合同管理
              </Link>
              <Link 
                href="/settings" 
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                系统设置
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}