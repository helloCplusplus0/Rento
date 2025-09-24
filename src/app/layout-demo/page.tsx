'use client'

import { AppLayout, PageContainer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * 布局系统演示页面
 * 用于测试和展示响应式布局系统的各种功能
 */
export default function LayoutDemoPage() {
  return (
    <AppLayout>
      <PageContainer
        title="响应式布局系统"
        subtitle="T1.5 布局系统演示和测试"
        showBackButton
        actions={
          <Button size="sm" variant="outline">
            设置
          </Button>
        }
      >
        <div className="space-y-6">
          {/* 布局特性展示 */}
          <Card>
            <CardHeader>
              <CardTitle>布局特性</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">移动端优先</h3>
                  <p className="text-sm text-blue-700">
                    采用 Mobile First 设计策略，在小屏幕设备上提供最佳体验
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">响应式导航</h3>
                  <p className="text-sm text-green-700">
                    移动端显示底部导航栏，桌面端显示顶部导航栏
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">安全区域适配</h3>
                  <p className="text-sm text-purple-700">
                    自动处理 iOS 刘海屏等设备的安全区域
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 断点测试 */}
          <Card>
            <CardHeader>
              <CardTitle>响应式断点测试</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div className="p-3 bg-gray-100 rounded text-center">
                  <div className="block sm:hidden">
                    <span className="text-xs font-medium">XS</span>
                    <p className="text-xs text-gray-600">&lt; 640px</p>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-100 rounded text-center">
                  <div className="hidden sm:block md:hidden">
                    <span className="text-xs font-medium">SM</span>
                    <p className="text-xs text-gray-600">640px+</p>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-100 rounded text-center">
                  <div className="hidden md:block lg:hidden">
                    <span className="text-xs font-medium">MD</span>
                    <p className="text-xs text-gray-600">768px+</p>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-100 rounded text-center">
                  <div className="hidden lg:block xl:hidden">
                    <span className="text-xs font-medium">LG</span>
                    <p className="text-xs text-gray-600">1024px+</p>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-100 rounded text-center">
                  <div className="hidden xl:block">
                    <span className="text-xs font-medium">XL</span>
                    <p className="text-xs text-gray-600">1280px+</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 容器测试 */}
          <Card>
            <CardHeader>
              <CardTitle>容器宽度测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="container-mobile bg-red-50 p-4 rounded">
                <p className="text-sm font-medium text-red-900">移动端容器</p>
                <p className="text-xs text-red-700">100% 宽度，16px 内边距</p>
              </div>
              
              <div className="container-tablet bg-yellow-50 p-4 rounded">
                <p className="text-sm font-medium text-yellow-900">平板端容器</p>
                <p className="text-xs text-yellow-700">最大 768px 宽度，24px 内边距</p>
              </div>
              
              <div className="container-desktop bg-blue-50 p-4 rounded">
                <p className="text-sm font-medium text-blue-900">桌面端容器</p>
                <p className="text-xs text-blue-700">最大 1200px 宽度，32px 内边距</p>
              </div>
            </CardContent>
          </Card>

          {/* 导航测试 */}
          <Card>
            <CardHeader>
              <CardTitle>导航系统测试</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">当前导航状态</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• 移动端 (&lt; 1024px): 显示底部导航栏</p>
                    <p>• 桌面端 (≥ 1024px): 显示顶部导航栏</p>
                    <p>• 导航项包含激活状态和徽章显示</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {['工作台', '房源', '添加', '合同', '消息'].map((item, index) => (
                    <div key={item} className="p-2 bg-blue-50 rounded text-center">
                      <div className="w-6 h-6 bg-blue-200 rounded mx-auto mb-1"></div>
                      <span className="text-xs text-blue-700">{item}</span>
                      {index === 4 && (
                        <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">3</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 性能指标 */}
          <Card>
            <CardHeader>
              <CardTitle>性能和可访问性</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700">✅ 已实现特性</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 触摸友好的交互区域 (最小 44px)</li>
                    <li>• 键盘导航支持</li>
                    <li>• 屏幕阅读器兼容</li>
                    <li>• 无布局偏移 (CLS)</li>
                    <li>• 流畅的页面切换</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-700">📊 技术指标</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• TypeScript 类型安全</li>
                    <li>• React.memo 性能优化</li>
                    <li>• CSS 变量系统</li>
                    <li>• 响应式断点</li>
                    <li>• 安全区域适配</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  )
}