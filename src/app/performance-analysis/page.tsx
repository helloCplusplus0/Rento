'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface NavigationMetric {
  id: string
  from: string
  to: string
  startTime: number
  endTime?: number
  duration?: number
  type: 'client' | 'server'
  status: 'pending' | 'completed' | 'failed'
  timestamp: Date
}

interface PerformanceData {
  navigationTiming?: PerformanceNavigationTiming
  resourceTiming: PerformanceResourceTiming[]
  paintTiming: PerformanceEntry[]
  memoryInfo?: any
}

// 使用localStorage持久化数据
const STORAGE_KEY = 'rento-performance-metrics'
const PERFORMANCE_DATA_KEY = 'rento-performance-data'

/**
 * 页面跳转性能分析组件
 * 实时监测和分析页面跳转的性能瓶颈
 *
 * 修复问题：
 * 1. 使用localStorage持久化数据，避免页面刷新丢失
 * 2. 使用新窗口打开测试页面，避免当前页面被替换
 * 3. 添加返回按钮监听，自动记录跳转时间
 */
export default function PerformanceAnalysisPage() {
  const router = useRouter()
  const pathname = usePathname()

  const [metrics, setMetrics] = useState<NavigationMetric[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    resourceTiming: [],
    paintTiming: [],
  })
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [currentNavigation, setCurrentNavigation] =
    useState<NavigationMetric | null>(null)

  // 从localStorage加载数据
  const loadStoredData = useCallback(() => {
    try {
      const storedMetrics = localStorage.getItem(STORAGE_KEY)
      const storedPerformanceData = localStorage.getItem(PERFORMANCE_DATA_KEY)

      if (storedMetrics) {
        const parsedMetrics = JSON.parse(storedMetrics).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
        setMetrics(parsedMetrics)
      }

      if (storedPerformanceData) {
        setPerformanceData(JSON.parse(storedPerformanceData))
      }
    } catch (error) {
      console.error('Failed to load stored performance data:', error)
    }
  }, []) // 移除依赖，避免循环更新

  // 保存数据到localStorage
  const saveToStorage = useCallback(
    (newMetrics: NavigationMetric[], newPerformanceData?: PerformanceData) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMetrics))
        if (newPerformanceData) {
          localStorage.setItem(
            PERFORMANCE_DATA_KEY,
            JSON.stringify(newPerformanceData)
          )
        }
      } catch (error) {
        console.error('Failed to save performance data:', error)
      }
    },
    []
  )

  // 收集性能数据
  const collectPerformanceData = useCallback(() => {
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming
    const resources = performance.getEntriesByType(
      'resource'
    ) as PerformanceResourceTiming[]
    const paints = performance.getEntriesByType('paint')

    // 获取内存信息（如果可用）
    const memoryInfo = (performance as any).memory
      ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        }
      : null

    const newPerformanceData = {
      navigationTiming: navigation,
      resourceTiming: resources.slice(-20), // 只保留最近20个资源
      paintTiming: paints,
      memoryInfo,
    }

    setPerformanceData(newPerformanceData)

    // 只在有metrics数据时才保存，避免循环依赖
    if (metrics.length > 0) {
      saveToStorage(metrics, newPerformanceData)
    }
  }, [metrics, saveToStorage])

  // 在新窗口中打开页面进行测试
  const testNavigationInNewWindow = useCallback(
    (path: string) => {
      const startTime = performance.now()
      const metric: NavigationMetric = {
        id: Date.now().toString(),
        from: pathname,
        to: path,
        startTime,
        type: 'client',
        status: 'pending',
        timestamp: new Date(),
      }

      const newMetrics = [metric, ...metrics.slice(0, 9)]
      setMetrics(newMetrics)
      saveToStorage(newMetrics)

      // 在新窗口中打开页面
      const newWindow = window.open(path, '_blank', 'width=1200,height=800')

      // 监听新窗口关闭事件
      if (newWindow) {
        const checkClosed = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(checkClosed)
            const endTime = performance.now()
            const duration = endTime - startTime

            const updatedMetric: NavigationMetric = {
              ...metric,
              endTime,
              duration,
              status: 'completed',
            }

            const updatedMetrics = newMetrics.map((m) =>
              m.id === metric.id ? updatedMetric : m
            )
            setMetrics(updatedMetrics)
            saveToStorage(updatedMetrics)

            // 收集性能数据
            setTimeout(collectPerformanceData, 100)
          }
        }, 1000)
      }
    },
    [pathname, metrics, saveToStorage, collectPerformanceData]
  )

  // 在当前窗口测试（用于对比）
  const testNavigationInCurrentWindow = useCallback(
    (path: string) => {
      const startTime = performance.now()
      const metric: NavigationMetric = {
        id: Date.now().toString(),
        from: pathname,
        to: path,
        startTime,
        type: 'client',
        status: 'pending',
        timestamp: new Date(),
      }

      const newMetrics = [metric, ...metrics.slice(0, 9)]
      setMetrics(newMetrics)
      saveToStorage(newMetrics)

      // 保存当前测试信息到sessionStorage，用于返回时恢复
      sessionStorage.setItem('current-navigation-test', JSON.stringify(metric))

      // 跳转到目标页面
      router.push(path)
    },
    [pathname, metrics, saveToStorage, router]
  )

  // 启动/停止监控
  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(!isMonitoring)
    if (!isMonitoring) {
      collectPerformanceData()
    }
  }, [isMonitoring, collectPerformanceData])

  // 清除记录
  const clearMetrics = useCallback(() => {
    setMetrics([])
    setCurrentNavigation(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(PERFORMANCE_DATA_KEY)
  }, [])

  // 页面加载时恢复数据
  useEffect(() => {
    // 只在组件首次挂载时加载数据
    if (metrics.length === 0) {
      loadStoredData()
    }

    // 检查是否从其他页面返回
    const navigationTest = sessionStorage.getItem('current-navigation-test')
    if (navigationTest) {
      try {
        const testMetric = JSON.parse(navigationTest)
        const endTime = performance.now()
        const duration = endTime - testMetric.startTime

        const completedMetric: NavigationMetric = {
          ...testMetric,
          endTime,
          duration,
          status: 'completed',
          timestamp: new Date(testMetric.timestamp),
        }

        setMetrics((prev) => {
          const updated = prev.map((m) =>
            m.id === testMetric.id ? completedMetric : m
          )
          saveToStorage(updated)
          return updated
        })

        sessionStorage.removeItem('current-navigation-test')
        setTimeout(collectPerformanceData, 100)
      } catch (error) {
        console.error('Failed to process navigation test:', error)
      }
    }
  }, []) // 只在组件挂载时执行一次

  // 格式化时间
  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A'
    return `${Math.round(duration)}ms`
  }

  // 获取状态颜色
  const getStatusColor = (status: string, duration?: number) => {
    if (status === 'pending') return 'bg-yellow-500'
    if (status === 'failed') return 'bg-red-500'
    if (!duration) return 'bg-gray-500'
    if (duration < 100) return 'bg-green-500'
    if (duration < 500) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">页面跳转性能分析</h1>
        <div className="flex gap-2">
          <Button
            onClick={toggleMonitoring}
            variant={isMonitoring ? 'destructive' : 'default'}
          >
            {isMonitoring ? '停止监控' : '开始监控'}
          </Button>
          <Button onClick={clearMetrics} variant="outline">
            清除记录
          </Button>
        </div>
      </div>

      {/* 测试说明 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">测试说明</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-2">
            <p>
              <strong>新窗口测试</strong>
              ：在新窗口打开页面，关闭窗口时记录时间（推荐）
            </p>
            <p>
              <strong>当前窗口测试</strong>：在当前窗口跳转，返回时自动记录时间
            </p>
            <p>
              <strong>数据持久化</strong>
              ：所有测试数据会自动保存，页面刷新不会丢失
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 快速测试按钮 */}
      <Card>
        <CardHeader>
          <CardTitle>快速跳转测试</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium">新窗口测试（推荐）</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button
                  onClick={() => testNavigationInNewWindow('/')}
                  variant="outline"
                  size="sm"
                >
                  首页
                </Button>
                <Button
                  onClick={() => testNavigationInNewWindow('/rooms')}
                  variant="outline"
                  size="sm"
                >
                  房源管理
                </Button>
                <Button
                  onClick={() => testNavigationInNewWindow('/contracts')}
                  variant="outline"
                  size="sm"
                >
                  合同管理
                </Button>
                <Button
                  onClick={() => testNavigationInNewWindow('/bills')}
                  variant="outline"
                  size="sm"
                >
                  账单管理
                </Button>
                <Button
                  onClick={() => testNavigationInNewWindow('/renters')}
                  variant="outline"
                  size="sm"
                >
                  租客管理
                </Button>
                <Button
                  onClick={() => testNavigationInNewWindow('/performance-test')}
                  variant="outline"
                  size="sm"
                >
                  性能测试
                </Button>
                <Button
                  onClick={() => testNavigationInNewWindow('/system-health')}
                  variant="outline"
                  size="sm"
                >
                  系统监控
                </Button>
                <Button
                  onClick={() => testNavigationInNewWindow('/components')}
                  variant="outline"
                  size="sm"
                >
                  组件展示
                </Button>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">当前窗口测试</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button
                  onClick={() => testNavigationInCurrentWindow('/')}
                  variant="secondary"
                  size="sm"
                >
                  首页
                </Button>
                <Button
                  onClick={() => testNavigationInCurrentWindow('/rooms')}
                  variant="secondary"
                  size="sm"
                >
                  房源管理
                </Button>
                <Button
                  onClick={() => testNavigationInCurrentWindow('/contracts')}
                  variant="secondary"
                  size="sm"
                >
                  合同管理
                </Button>
                <Button
                  onClick={() => testNavigationInCurrentWindow('/bills')}
                  variant="secondary"
                  size="sm"
                >
                  账单管理
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 导航记录 */}
      <Card>
        <CardHeader>
          <CardTitle>导航记录 ({metrics.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.length === 0 ? (
              <p className="py-4 text-center text-gray-500">暂无导航记录</p>
            ) : (
              metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      className={getStatusColor(metric.status, metric.duration)}
                    >
                      {metric.status}
                    </Badge>
                    <div>
                      <div className="font-medium">
                        {metric.from} → {metric.to}
                      </div>
                      <div className="text-sm text-gray-500">
                        {metric.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">
                      {formatDuration(metric.duration)}
                    </div>
                    <div className="text-xs text-gray-500">{metric.type}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 性能数据 */}
      {performanceData.navigationTiming && (
        <Card>
          <CardHeader>
            <CardTitle>页面加载性能</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(
                    performanceData.navigationTiming.domContentLoadedEventEnd -
                      performanceData.navigationTiming.fetchStart
                  )}
                  ms
                </div>
                <div className="text-sm text-gray-500">DOM加载</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(
                    performanceData.navigationTiming.loadEventEnd -
                      performanceData.navigationTiming.fetchStart
                  )}
                  ms
                </div>
                <div className="text-sm text-gray-500">完全加载</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(
                    performanceData.navigationTiming.responseStart -
                      performanceData.navigationTiming.fetchStart
                  )}
                  ms
                </div>
                <div className="text-sm text-gray-500">首字节</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {performanceData.resourceTiming.length}
                </div>
                <div className="text-sm text-gray-500">资源数量</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 内存使用 */}
      {performanceData.memoryInfo && (
        <Card>
          <CardHeader>
            <CardTitle>内存使用情况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {Math.round(
                    performanceData.memoryInfo.usedJSHeapSize / 1024 / 1024
                  )}
                  MB
                </div>
                <div className="text-sm text-gray-500">已使用</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round(
                    performanceData.memoryInfo.totalJSHeapSize / 1024 / 1024
                  )}
                  MB
                </div>
                <div className="text-sm text-gray-500">总分配</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {Math.round(
                    performanceData.memoryInfo.jsHeapSizeLimit / 1024 / 1024
                  )}
                  MB
                </div>
                <div className="text-sm text-gray-500">限制</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
