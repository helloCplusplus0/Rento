'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Wrench, Clock } from 'lucide-react'
import { ErrorAlert, SimpleErrorAlert, SuccessAlert } from './ErrorAlert'
import { ErrorLogger, ErrorType, ErrorSeverity } from '@/lib/error-logger'

/**
 * 数据一致性管理组件
 * 提供数据一致性检查和修复功能的用户界面
 */

interface ConsistencyIssue {
  id?: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  entityType: string
  entityId: string
  description: string
  suggestedFix: string
  metadata?: Record<string, any>
}

interface ConsistencyReport {
  timestamp: string
  summary: {
    totalChecks: number
    passedChecks: number
    failedChecks: number
    criticalIssues: number
    highIssues: number
    mediumIssues: number
    lowIssues: number
  }
  checks: Array<{
    name: string
    passed: boolean
    issueCount: number
    executedAt: string
  }>
  issues: ConsistencyIssue[]
  recommendations: string[]
}

interface RepairResult {
  totalIssues: number
  repairedIssues: number
  skippedIssues: number
  failedIssues: number
  errors: Array<{
    issueId?: string
    error: string
  }>
  executionTime: number
}

export function DataConsistencyManager() {
  const [isChecking, setIsChecking] = useState(false)
  const [isRepairing, setIsRepairing] = useState(false)
  const [report, setReport] = useState<ConsistencyReport | null>(null)
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null)
  const [selectedIssues, setSelectedIssues] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  /**
   * 执行数据一致性检查
   */
  const handleCheck = async () => {
    setIsChecking(true)
    setError(null)
    setSuccess(null)
    setRepairResult(null)
    
    try {
      const response = await fetch('/api/data-consistency')
      const result = await response.json()
      
      if (result.success) {
        setReport(result.data)
        setSuccess('数据一致性检查完成')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorMessage = result.details || result.error || '检查失败'
        setError(errorMessage)
        
        // 记录错误日志
        const logger = ErrorLogger.getInstance()
        await logger.logError(
          ErrorType.DATA_CONSISTENCY,
          ErrorSeverity.HIGH,
          `数据一致性检查失败: ${errorMessage}`,
          {
            module: 'DataConsistencyManager',
            function: 'handleCheck'
          }
        )
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '网络错误'
      setError(errorMessage)
      
      // 记录错误日志
      const logger = ErrorLogger.getInstance()
      await logger.logError(
        ErrorType.DATA_CONSISTENCY,
        ErrorSeverity.HIGH,
        `数据一致性检查异常: ${errorMessage}`,
        {
          module: 'DataConsistencyManager',
          function: 'handleCheck'
        },
        err instanceof Error ? err : undefined
      )
    } finally {
      setIsChecking(false)
    }
  }

  /**
   * 执行数据修复
   */
  const handleRepair = async (issueIds: string[] = []) => {
    setIsRepairing(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch('/api/data-consistency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueIds,
          repairOptions: {
            dryRun: false,
            maxRepairs: 100,
            skipCritical: false
          },
          performCheckFirst: issueIds.length === 0
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setRepairResult(result.data)
        setSuccess(`数据修复完成，共修复 ${result.data.repairedIssues} 个问题`)
        setTimeout(() => setSuccess(null), 5000)
        // 修复后重新检查
        setTimeout(() => handleCheck(), 1000)
      } else {
        setError(result.details || result.error || '修复失败')
        
        // 记录错误日志
        const logger = ErrorLogger.getInstance()
        await logger.logError(
          ErrorType.DATA_CONSISTENCY,
          ErrorSeverity.HIGH,
          `数据修复失败: ${result.details || result.error || '修复失败'}`,
          {
            module: 'DataConsistencyManager',
            function: 'handleRepair',
            issueIds
          }
        )
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '网络错误'
      setError(errorMessage)
      
      // 记录错误日志
      const logger = ErrorLogger.getInstance()
      await logger.logError(
        ErrorType.DATA_CONSISTENCY,
        ErrorSeverity.HIGH,
        `数据修复异常: ${errorMessage}`,
        {
          module: 'DataConsistencyManager',
          function: 'handleRepair',
          issueIds
        },
        err instanceof Error ? err : undefined
      )
    } finally {
      setIsRepairing(false)
    }
  }

  const handleRetry = () => {
    setError(null)
  }

  const handleDismissSuccess = () => {
    setSuccess(null)
  }

  /**
   * 获取严重级别的颜色和图标
   */
  const getSeverityInfo = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return { color: 'destructive', icon: XCircle, label: '关键' }
      case 'HIGH':
        return { color: 'destructive', icon: AlertTriangle, label: '高' }
      case 'MEDIUM':
        return { color: 'secondary', icon: AlertTriangle, label: '中' }
      case 'LOW':
        return { color: 'outline', icon: AlertTriangle, label: '低' }
      default:
        return { color: 'outline', icon: AlertTriangle, label: '未知' }
    }
  }

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <SimpleErrorAlert
          title="操作失败"
          message={error}
          onRetry={handleRetry}
        />
      )}
      
      {/* 成功提示 */}
      {success && (
        <SuccessAlert
          title="操作成功"
          message={success}
          onDismiss={handleDismissSuccess}
        />
      )}
      
      {/* 操作区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            数据一致性管理
          </CardTitle>
          <CardDescription>
            检查和修复系统数据一致性问题，确保数据完整性和准确性
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={handleCheck}
              disabled={isChecking || isRepairing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? '检查中...' : '执行检查'}
            </Button>
            
            {report && report.issues.length > 0 && (
              <Button 
                onClick={() => handleRepair()}
                disabled={isChecking || isRepairing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Wrench className={`h-4 w-4 ${isRepairing ? 'animate-spin' : ''}`} />
                {isRepairing ? '修复中...' : '修复所有问题'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 修复结果 */}
      {repairResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            修复完成: 成功 {repairResult.repairedIssues} 个, 跳过 {repairResult.skippedIssues} 个, 
            失败 {repairResult.failedIssues} 个 (耗时: {repairResult.executionTime}ms)
            {repairResult.errors.length > 0 && (
              <div className="mt-2">
                <strong>错误详情:</strong>
                <ul className="list-disc list-inside mt-1">
                  {repairResult.errors.map((error, index) => (
                    <li key={index} className="text-sm">{error.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* 检查结果 */}
      {report && (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">检查摘要</TabsTrigger>
            <TabsTrigger value="issues">问题详情</TabsTrigger>
            <TabsTrigger value="recommendations">修复建议</TabsTrigger>
          </TabsList>

          {/* 检查摘要 */}
          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">总检查项</p>
                      <p className="text-2xl font-bold">{report.summary.totalChecks}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">通过检查</p>
                      <p className="text-2xl font-bold text-green-600">{report.summary.passedChecks}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">失败检查</p>
                      <p className="text-2xl font-bold text-red-600">{report.summary.failedChecks}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">总问题数</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {report.summary.criticalIssues + report.summary.highIssues + 
                         report.summary.mediumIssues + report.summary.lowIssues}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 检查项详情 */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>检查项详情</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.checks.map((check, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {check.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-medium">{check.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {check.issueCount > 0 && (
                          <Badge variant="destructive">{check.issueCount} 问题</Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {new Date(check.executedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 问题详情 */}
          <TabsContent value="issues">
            <Card>
              <CardHeader>
                <CardTitle>问题详情 ({report.issues.length})</CardTitle>
                <CardDescription>
                  按严重级别排序的数据一致性问题
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.issues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>没有发现数据一致性问题</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {report.issues.map((issue, index) => {
                      const severityInfo = getSeverityInfo(issue.severity)
                      const Icon = severityInfo.icon
                      
                      return (
                        <div key={index} className="border rounded p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-5 w-5" />
                              <Badge variant={severityInfo.color as any}>
                                {severityInfo.label}
                              </Badge>
                              <Badge variant="outline">{issue.entityType}</Badge>
                            </div>
                            {issue.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRepair([issue.id!])}
                                disabled={isRepairing}
                                className="flex items-center gap-1"
                              >
                                <Wrench className="h-3 w-3" />
                                修复
                              </Button>
                            )}
                          </div>
                          
                          <p className="text-sm">{issue.description}</p>
                          
                          <div className="text-xs text-muted-foreground">
                            <span>类型: {issue.type}</span>
                            <span className="ml-4">建议修复: {issue.suggestedFix}</span>
                            {issue.entityId && (
                              <span className="ml-4">实体ID: {issue.entityId}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 修复建议 */}
          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle>修复建议</CardTitle>
                <CardDescription>
                  基于检查结果生成的修复建议和最佳实践
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.recommendations.length === 0 ? (
                  <p className="text-muted-foreground">暂无修复建议</p>
                ) : (
                  <ul className="space-y-2">
                    {report.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-500 flex-shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}