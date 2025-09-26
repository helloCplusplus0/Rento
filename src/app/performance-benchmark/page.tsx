'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

/**
 * 性能基准测试页面
 * 进行详细的性能分析和对比测试
 */
export default function PerformanceBenchmarkPage() {
  const [benchmarkResults, setBenchmarkResults] = useState<Record<string, any>>({})
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState('')
  const [progress, setProgress] = useState(0)

  // 基准测试1: 页面加载性能
  const testPageLoadPerformance = useCallback(async () => {
    setCurrentTest('页面加载性能测试')
    
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigationTiming && navigationTiming.domContentLoadedEventEnd) {
      return {
        domContentLoaded: Math.round(navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart),
        loadComplete: Math.round(navigationTiming.loadEventEnd - navigationTiming.fetchStart),
        firstPaint: Math.round(navigationTiming.responseStart - navigationTiming.fetchStart),
        domInteractive: Math.round(navigationTiming.domInteractive - navigationTiming.fetchStart),
        networkLatency: Math.round(navigationTiming.responseStart - navigationTiming.requestStart),
        serverResponseTime: Math.round(navigationTiming.responseEnd - navigationTiming.responseStart)
      }
    }
    
    return {
      message: '无法获取导航时间信息',
      timestamp: Date.now()
    }
  }, [])

  // 基准测试2: JavaScript执行性能
  const testJavaScriptPerformance = useCallback(async () => {
    setCurrentTest('JavaScript执行性能测试')
    
    const results = []
    
    // 测试1: 数组操作性能
    const arraySize = 100000
    const testArray = Array.from({ length: arraySize }, (_, i) => i)
    
    const arrayStart = performance.now()
    const filteredArray = testArray.filter(x => x % 2 === 0).map(x => x * 2)
    const arrayEnd = performance.now()
    
    results.push({
      test: '数组操作',
      time: Math.round((arrayEnd - arrayStart) * 1000) / 1000, // 微秒
      operations: arraySize,
      opsPerMs: Math.round(arraySize / (arrayEnd - arrayStart))
    })
    
    // 测试2: DOM操作性能
    const domStart = performance.now()
    const testDiv = document.createElement('div')
    for (let i = 0; i < 1000; i++) {
      const child = document.createElement('span')
      child.textContent = `Item ${i}`
      testDiv.appendChild(child)
    }
    document.body.appendChild(testDiv)
    const domEnd = performance.now()
    document.body.removeChild(testDiv)
    
    results.push({
      test: 'DOM操作',
      time: Math.round((domEnd - domStart) * 1000) / 1000,
      operations: 1000,
      opsPerMs: Math.round(1000 / (domEnd - domStart))
    })
    
    // 测试3: JSON序列化性能
    const largeObject = {
      data: Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000,
        nested: {
          prop1: `Property ${i}`,
          prop2: Math.random(),
          prop3: [1, 2, 3, 4, 5]
        }
      }))
    }
    
    const jsonStart = performance.now()
    const serialized = JSON.stringify(largeObject)
    const parsed = JSON.parse(serialized)
    const jsonEnd = performance.now()
    
    results.push({
      test: 'JSON序列化',
      time: Math.round((jsonEnd - jsonStart) * 1000) / 1000,
      dataSize: Math.round(serialized.length / 1024), // KB
      throughput: Math.round((serialized.length / 1024) / (jsonEnd - jsonStart)) // KB/ms
    })
    
    return {
      results,
      totalTime: results.reduce((sum, r) => sum + r.time, 0),
      averageTime: Math.round(results.reduce((sum, r) => sum + r.time, 0) / results.length * 1000) / 1000
    }
  }, [])

  // 基准测试3: 网络请求性能
  const testNetworkPerformance = useCallback(async () => {
    setCurrentTest('网络请求性能测试')
    
    const endpoints = [
      { url: '/api/bills', name: '账单API' },
      { url: '/api/rooms', name: '房间API' },
      { url: '/api/renters', name: '租客API' },
      { url: '/api/contracts', name: '合同API' }
    ]
    
    const results = []
    
    for (const endpoint of endpoints) {
      const measurements = []
      
      // 进行3次测试取平均值
      for (let i = 0; i < 3; i++) {
        const start = performance.now()
        try {
          const response = await fetch(endpoint.url)
          const end = performance.now()
          const data = await response.json()
          
          measurements.push({
            responseTime: end - start,
            status: response.status,
            size: JSON.stringify(data).length,
            cached: response.headers.get('X-Cache') === 'HIT'
          })
        } catch (error) {
          measurements.push({
            responseTime: -1,
            status: 'ERROR',
            size: 0,
            error: (error as Error).message
          })
        }
        
        // 短暂延迟避免缓存影响
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      const validMeasurements = measurements.filter(m => m.responseTime > 0)
      if (validMeasurements.length > 0) {
        const avgResponseTime = validMeasurements.reduce((sum, m) => sum + m.responseTime, 0) / validMeasurements.length
        const avgSize = validMeasurements.reduce((sum, m) => sum + m.size, 0) / validMeasurements.length
        
        results.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          averageResponseTime: Math.round(avgResponseTime),
          averageSize: Math.round(avgSize),
          successRate: (validMeasurements.length / measurements.length) * 100,
          measurements: validMeasurements.length
        })
      }
    }
    
    return {
      results,
      overallAverage: Math.round(results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length),
      totalDataTransferred: Math.round(results.reduce((sum, r) => sum + r.averageSize, 0) / 1024), // KB
      successfulRequests: results.filter(r => r.successRate === 100).length
    }
  }, [])

  // 基准测试4: 内存使用分析
  const testMemoryUsage = useCallback(async () => {
    setCurrentTest('内存使用分析')
    
    const memoryInfo = (performance as any).memory
    
    if (memoryInfo) {
      // 创建一些测试数据来观察内存变化
      const initialMemory = memoryInfo.usedJSHeapSize
      
      // 创建大量对象
      const testData = Array.from({ length: 50000 }, (_, i) => ({
        id: i,
        data: `Test data ${i}`.repeat(10),
        timestamp: Date.now(),
        nested: {
          values: Array.from({ length: 10 }, (_, j) => j * i)
        }
      }))
      
      const afterCreationMemory = memoryInfo.usedJSHeapSize
      
      // 清理数据
      testData.length = 0
      
      // 强制垃圾回收（如果可用）
      if ((window as any).gc) {
        (window as any).gc()
      }
      
      const afterCleanupMemory = memoryInfo.usedJSHeapSize
      
      return {
        initialMemory: Math.round(initialMemory / 1024 / 1024 * 100) / 100, // MB
        afterCreationMemory: Math.round(afterCreationMemory / 1024 / 1024 * 100) / 100,
        afterCleanupMemory: Math.round(afterCleanupMemory / 1024 / 1024 * 100) / 100,
        memoryIncrease: Math.round((afterCreationMemory - initialMemory) / 1024 / 1024 * 100) / 100,
        memoryRecovered: Math.round((afterCreationMemory - afterCleanupMemory) / 1024 / 1024 * 100) / 100,
        totalHeapSize: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024 * 100) / 100,
        heapSizeLimit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024 * 100) / 100,
        memoryUsagePercentage: Math.round((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100)
      }
    }
    
    return {
      message: '浏览器不支持内存监控API',
      domNodeCount: document.querySelectorAll('*').length,
      estimatedMemoryUsage: 'N/A'
    }
  }, [])

  // 基准测试5: 渲染性能测试
  const testRenderingPerformance = useCallback(async () => {
    setCurrentTest('渲染性能测试')
    
    const results = []
    
    // 测试1: 大量DOM节点渲染
    const renderStart = performance.now()
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    
    for (let i = 0; i < 5000; i++) {
      const element = document.createElement('div')
      element.className = 'test-element'
      element.innerHTML = `<span>Item ${i}</span><button>Action</button>`
      container.appendChild(element)
    }
    
    document.body.appendChild(container)
    const renderEnd = performance.now()
    
    results.push({
      test: 'DOM节点渲染',
      elementsCreated: 5000,
      renderTime: Math.round((renderEnd - renderStart) * 1000) / 1000,
      elementsPerMs: Math.round(5000 / (renderEnd - renderStart))
    })
    
    // 测试2: 样式计算性能
    const styleStart = performance.now()
    const elements = container.querySelectorAll('.test-element')
    elements.forEach((el, index) => {
      const htmlEl = el as HTMLElement
      if (htmlEl) {
        htmlEl.style.backgroundColor = index % 2 === 0 ? '#f0f0f0' : '#ffffff'
        htmlEl.style.padding = '10px'
        htmlEl.style.margin = '2px'
      }
    })
    const styleEnd = performance.now()
    
    results.push({
      test: '样式计算',
      elementsStyled: elements.length,
      styleTime: Math.round((styleEnd - styleStart) * 1000) / 1000,
      stylesPerMs: Math.round(elements.length / (styleEnd - styleStart))
    })
    
    // 清理测试元素
    document.body.removeChild(container)
    
    return {
      results,
      totalRenderTime: results.reduce((sum, r) => sum + (r.renderTime || r.styleTime || 0), 0),
      totalElements: results.reduce((sum, r) => sum + (r.elementsCreated || r.elementsStyled || 0), 0)
    }
  }, [])

  // 运行所有基准测试
  const runBenchmarkTests = useCallback(async () => {
    setIsRunning(true)
    setBenchmarkResults({})
    setProgress(0)
    
    try {
      const tests = [
        { name: 'pageLoad', fn: testPageLoadPerformance },
        { name: 'javascript', fn: testJavaScriptPerformance },
        { name: 'network', fn: testNetworkPerformance },
        { name: 'memory', fn: testMemoryUsage },
        { name: 'rendering', fn: testRenderingPerformance }
      ]
      
      for (let i = 0; i < tests.length; i++) {
        const test = tests[i]
        const result = await test.fn()
        setBenchmarkResults(prev => ({ ...prev, [test.name]: result }))
        setProgress(((i + 1) / tests.length) * 100)
        
        // 短暂延迟让UI更新
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
    } catch (error) {
      console.error('基准测试执行失败:', error)
    } finally {
      setIsRunning(false)
      setCurrentTest('')
    }
  }, [testPageLoadPerformance, testJavaScriptPerformance, testNetworkPerformance, testMemoryUsage, testRenderingPerformance])

  // 生成性能评分
  const calculatePerformanceScore = useCallback(() => {
    if (Object.keys(benchmarkResults).length === 0) return 0
    
    let score = 100
    
    // 页面加载性能评分
    if (benchmarkResults.pageLoad?.domContentLoaded) {
      const loadTime = benchmarkResults.pageLoad.domContentLoaded
      if (loadTime > 3000) score -= 20
      else if (loadTime > 1500) score -= 10
      else if (loadTime > 800) score -= 5
    }
    
    // 网络性能评分
    if (benchmarkResults.network?.overallAverage) {
      const avgResponse = benchmarkResults.network.overallAverage
      if (avgResponse > 1000) score -= 15
      else if (avgResponse > 500) score -= 8
      else if (avgResponse > 300) score -= 3
    }
    
    // JavaScript性能评分
    if (benchmarkResults.javascript?.averageTime) {
      const avgTime = benchmarkResults.javascript.averageTime
      if (avgTime > 100) score -= 10
      else if (avgTime > 50) score -= 5
    }
    
    // 内存使用评分
    if (benchmarkResults.memory?.memoryUsagePercentage) {
      const memoryUsage = benchmarkResults.memory.memoryUsagePercentage
      if (memoryUsage > 80) score -= 15
      else if (memoryUsage > 60) score -= 8
      else if (memoryUsage > 40) score -= 3
    }
    
    return Math.max(0, Math.min(100, score))
  }, [benchmarkResults])

  const performanceScore = calculatePerformanceScore()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">性能基准测试</h1>
        <p className="text-gray-600">详细的性能分析和基准测试</p>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={runBenchmarkTests} 
          disabled={isRunning}
          size="lg"
          className="px-8"
        >
          {isRunning ? '测试进行中...' : '开始基准测试'}
        </Button>
      </div>

      {isRunning && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">当前测试: {currentTest}</p>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600">{Math.round(progress)}% 完成</p>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(benchmarkResults).length > 0 && (
        <div className="space-y-6">
          {/* 性能评分 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">综合性能评分</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 ${
                  performanceScore >= 90 ? 'text-green-600' :
                  performanceScore >= 70 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {performanceScore}
                </div>
                <div className="text-lg text-gray-600">/ 100</div>
                <Badge 
                  variant={
                    performanceScore >= 90 ? 'default' :
                    performanceScore >= 70 ? 'secondary' :
                    'destructive'
                  }
                  className="mt-2"
                >
                  {performanceScore >= 90 ? '优秀' :
                   performanceScore >= 70 ? '良好' :
                   '需要优化'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 详细测试结果 */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* 页面加载性能 */}
            {benchmarkResults.pageLoad && (
              <Card>
                <CardHeader>
                  <CardTitle>页面加载性能</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>DOM内容加载:</span>
                      <span className="font-medium">{benchmarkResults.pageLoad.domContentLoaded}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>完全加载:</span>
                      <span className="font-medium">{benchmarkResults.pageLoad.loadComplete}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>服务器响应:</span>
                      <span className="font-medium">{benchmarkResults.pageLoad.serverResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>网络延迟:</span>
                      <span className="font-medium">{benchmarkResults.pageLoad.networkLatency}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* JavaScript性能 */}
            {benchmarkResults.javascript && (
              <Card>
                <CardHeader>
                  <CardTitle>JavaScript执行性能</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {benchmarkResults.javascript.averageTime}ms
                      </div>
                      <div className="text-sm text-gray-600">平均执行时间</div>
                    </div>
                    {benchmarkResults.javascript.results.map((result: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{result.test}:</span>
                        <span className="font-medium">{result.time}ms</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 网络性能 */}
            {benchmarkResults.network && (
              <Card>
                <CardHeader>
                  <CardTitle>网络请求性能</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {benchmarkResults.network.overallAverage}ms
                      </div>
                      <div className="text-sm text-gray-600">平均响应时间</div>
                    </div>
                    {benchmarkResults.network.results.map((result: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{result.endpoint}:</span>
                        <span className="font-medium">{result.averageResponseTime}ms</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 内存使用 */}
            {benchmarkResults.memory && (
              <Card>
                <CardHeader>
                  <CardTitle>内存使用分析</CardTitle>
                </CardHeader>
                <CardContent>
                  {benchmarkResults.memory.message ? (
                    <div className="text-center text-gray-600">
                      {benchmarkResults.memory.message}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>当前内存使用:</span>
                        <span className="font-medium">{benchmarkResults.memory.initialMemory}MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>总堆大小:</span>
                        <span className="font-medium">{benchmarkResults.memory.totalHeapSize}MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>堆使用率:</span>
                        <span className="font-medium">{benchmarkResults.memory.memoryUsagePercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>内存回收:</span>
                        <span className="font-medium">{benchmarkResults.memory.memoryRecovered}MB</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 渲染性能 */}
          {benchmarkResults.rendering && (
            <Card>
              <CardHeader>
                <CardTitle>渲染性能测试</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {benchmarkResults.rendering.results.map((result: any, index: number) => (
                    <div key={index} className="text-center">
                      <div className="text-xl font-bold text-purple-600">
                        {result.renderTime || result.styleTime}ms
                      </div>
                      <div className="text-sm text-gray-600">{result.test}</div>
                      <div className="text-xs text-gray-500">
                        {result.elementsCreated || result.elementsStyled} 元素
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}