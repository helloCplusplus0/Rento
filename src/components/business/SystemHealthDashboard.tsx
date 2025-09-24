/**
 * 系统健康状态监控面板
 * 提供实时的系统健康状态展示和管理功能
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Activity,
  Database,
  FileText,
  TrendingUp,
  Clock
} from 'lucide-react'

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastCheck: string
  responseTime: number
  details?: Record<string, any>
  error?: string
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  checks: HealthCheck[]
  uptime: number
  version: string
  timestamp: string
  responseTime: number
}

export function SystemHealthDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [billSystemHealth, setBillSystemHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('开始获取系统健康数据...')
      
      // 获取系统整体健康状态
      const systemResponse = await fetch('/api/health/system')
      console.log('系统健康检查响应状态:', systemResponse.status)
      
      // 即使是503状态码，也可能包含有效的健康数据
      if (systemResponse.ok || systemResponse.status === 503) {
        const systemData = await systemResponse.json()
        console.log('系统健康数据:', systemData)
        setSystemHealth(systemData)
      } else {
        throw new Error(`系统健康检查失败: ${systemResponse.status} ${systemResponse.statusText}`)
      }

      // 获取账单系统详细健康状态
      try {
        const billResponse = await fetch('/api/health/bills')
        console.log('账单系统健康检查响应状态:', billResponse.status)
        
        if (billResponse.ok || billResponse.status === 503) {
          const billData = await billResponse.json()
          console.log('账单系统健康数据:', billData)
          setBillSystemHealth(billData)
        }
      } catch (billError) {
        console.warn('获取账单系统健康状态失败:', billError)
        // 账单系统健康检查失败不影响主要功能
      }

      setLastUpdate(new Date())
      console.log('健康数据获取完成')
    } catch (err) {
      console.error('获取健康数据失败:', err)
      setError(err instanceof Error ? err.message : '获取健康状态失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
    
    // 每30秒自动刷新
    const interval = setInterval(fetchHealthData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatUptime = (uptimeMs: number) => {
    const seconds = Math.floor(uptimeMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}天 ${hours % 24}小时`
    if (hours > 0) return `${hours}小时 ${minutes % 60}分钟`
    if (minutes > 0) return `${minutes}分钟 ${seconds % 60}秒`
    return `${seconds}秒`
  }

  if (loading && !systemHealth) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">系统健康监控</h2>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">系统健康监控</h2>
          <Button onClick={fetchHealthData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            重试
          </Button>
        </div>
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 标题和刷新按钮 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">系统健康监控</h2>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-1">
              最后更新: {lastUpdate.toLocaleString()}
            </p>
          )}
        </div>
        <Button onClick={fetchHealthData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 系统整体状态 */}
      {systemHealth && (
        <Card className={`border-2 ${getStatusColor(systemHealth.overall)}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              {getStatusIcon(systemHealth.overall)}
              系统整体状态
              <Badge variant="outline" className="ml-auto text-xs">
                {systemHealth.overall === 'healthy' ? '正常' :
                 systemHealth.overall === 'degraded' ? '降级' : '异常'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm">运行时间</p>
                <p className="font-medium text-sm sm:text-base">{formatUptime(systemHealth.uptime)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs sm:text-sm">版本</p>
                <p className="font-medium text-sm sm:text-base">{systemHealth.version}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs sm:text-sm">响应时间</p>
                <p className="font-medium text-sm sm:text-base">{systemHealth.responseTime}ms</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs sm:text-sm">检查项目</p>
                <p className="font-medium text-sm sm:text-base">{systemHealth.checks.length}个</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 详细健康检查项目 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {systemHealth?.checks.map((check) => (
          <Card key={check.name} className="relative">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                {check.name === 'database_connection' && <Database className="h-4 w-4" />}
                {check.name === 'bill_system' && <FileText className="h-4 w-4" />}
                {check.name === 'data_consistency' && <CheckCircle className="h-4 w-4" />}
                {check.name === 'error_rate' && <AlertTriangle className="h-4 w-4" />}
                {check.name === 'performance' && <TrendingUp className="h-4 w-4" />}
                
                <span className="flex-1 min-w-0">
                  {check.name === 'database_connection' ? '数据库连接' :
                   check.name === 'bill_system' ? '账单系统' :
                   check.name === 'data_consistency' ? '数据一致性' :
                   check.name === 'error_rate' ? '错误率' :
                   check.name === 'performance' ? '系统性能' : check.name}
                </span>
                
                <Badge 
                  variant="outline" 
                  className={`ml-auto ${getStatusColor(check.status)} text-xs`}
                >
                  {getStatusIcon(check.status)}
                  <span className="ml-1 hidden sm:inline">
                    {check.status === 'healthy' ? '正常' :
                     check.status === 'degraded' ? '降级' : '异常'}
                  </span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">响应时间</span>
                  <span className="font-medium">{check.responseTime}ms</span>
                </div>
                
                {check.error && (
                  <div className="text-red-600 text-xs bg-red-50 p-2 rounded">
                    {check.error}
                  </div>
                )}
                
                {check.details && (
                  <div className="mt-3 space-y-1">
                    {Object.entries(check.details).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-gray-500 capitalize truncate flex-1 mr-2">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                        <span className="font-mono text-right">
                          {typeof value === 'object' ? JSON.stringify(value).slice(0, 20) + '...' : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 账单系统详细状态 */}
      {billSystemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-5 w-5" />
              账单系统详细状态
              <Badge 
                variant="outline" 
                className={`ml-auto ${getStatusColor(billSystemHealth.status)} text-xs`}
              >
                {getStatusIcon(billSystemHealth.status)}
                <span className="ml-1">
                  {billSystemHealth.status === 'healthy' ? '正常' :
                   billSystemHealth.status === 'degraded' ? '降级' : '异常'}
                </span>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(billSystemHealth.details.checks).map(([checkName, checkData]: [string, any]) => (
                <div key={checkName} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-xs sm:text-sm">
                      {checkName === 'recent_bill_generation' ? '最近账单生成' :
                       checkName === 'bill_data_integrity' ? '账单数据完整性' :
                       checkName === 'meter_reading_status' ? '抄表记录状态' :
                       checkName === 'bill_processing_queue' ? '账单处理队列' : checkName}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(checkData.status)} text-xs`}
                    >
                      {getStatusIcon(checkData.status)}
                    </Badge>
                  </div>
                  
                  {checkData.details && (
                    <div className="space-y-1">
                      {Object.entries(checkData.details).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-gray-500 truncate flex-1 mr-2">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                          <span className="font-mono text-right">
                            {typeof value === 'boolean' ? (value ? '是' : '否') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {checkData.error && (
                    <div className="text-red-600 text-xs bg-red-50 p-2 rounded mt-2">
                      {checkData.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作建议 */}
      {systemHealth && systemHealth.overall !== 'healthy' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 text-base sm:text-lg">
              <AlertTriangle className="h-5 w-5" />
              系统状态建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs sm:text-sm text-yellow-700">
              {systemHealth.checks
                .filter(check => check.status !== 'healthy')
                .map(check => (
                  <div key={check.name} className="flex items-start gap-2">
                    <span>•</span>
                    <div className="flex-1">
                      <span className="font-medium">
                        {check.name === 'database_connection' ? '数据库连接异常' :
                         check.name === 'bill_system' ? '账单系统异常' :
                         check.name === 'data_consistency' ? '数据一致性问题' :
                         check.name === 'error_rate' ? '错误率过高' :
                         check.name === 'performance' ? '系统性能问题' : check.name}:
                      </span>
                      <span className="ml-1">
                        {check.error || '建议检查相关配置和日志'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}