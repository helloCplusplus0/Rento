'use client'

import { useState } from 'react'
import { CheckCircle, Clock, Play, RefreshCw, XCircle } from 'lucide-react'

import type {
  ValidationReport,
  ValidationResult,
} from '@/lib/business-flow-validator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface ValidationStatus {
  isRunning: boolean
  progress: number
  currentFlow?: string
  report?: ValidationReport
  error?: string
}

export function BusinessFlowValidationPage() {
  const [status, setStatus] = useState<ValidationStatus>({
    isRunning: false,
    progress: 0,
  })

  const startValidation = async () => {
    setStatus({
      isRunning: true,
      progress: 0,
      currentFlow: '准备验证环境...',
    })

    try {
      const response = await fetch('/api/validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        setStatus({
          isRunning: false,
          progress: 100,
          report: result.data,
        })
      } else {
        setStatus({
          isRunning: false,
          progress: 0,
          error: result.error || '验证失败',
        })
      }
    } catch (error) {
      setStatus({
        isRunning: false,
        progress: 0,
        error: '网络请求失败',
      })
    }
  }

  const resetValidation = () => {
    setStatus({
      isRunning: false,
      progress: 0,
    })
  }

  const getFlowStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getFlowStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? 'default' : 'destructive'}>
        {success ? '通过' : '失败'}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">核心业务流程验证</h1>
        <p className="text-muted-foreground mt-2">
          验证Rento应用的核心业务流程完整性和数据一致性
        </p>
      </div>

      {/* 验证控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            验证控制台
          </CardTitle>
          <CardDescription>
            启动核心业务流程验证，检查系统各模块的完整性和一致性
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 控制按钮 */}
          <div className="flex gap-2">
            <Button
              onClick={startValidation}
              disabled={status.isRunning}
              className="flex items-center gap-2"
            >
              {status.isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {status.isRunning ? '验证中...' : '开始验证'}
            </Button>

            <Button
              variant="outline"
              onClick={resetValidation}
              disabled={status.isRunning}
            >
              重置
            </Button>
          </div>

          {/* 进度显示 */}
          {status.isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{status.currentFlow}</span>
                <span>{status.progress}%</span>
              </div>
              <Progress value={status.progress} className="w-full" />
            </div>
          )}

          {/* 错误显示 */}
          {status.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 验证结果 */}
      {status.report && (
        <div className="space-y-6">
          {/* 总体结果 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {status.report.overallSuccess ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
                验证结果总览
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {status.report.successfulFlows}
                  </div>
                  <div className="text-muted-foreground text-sm">成功流程</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {status.report.failedFlows}
                  </div>
                  <div className="text-muted-foreground text-sm">失败流程</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {status.report.totalFlows}
                  </div>
                  <div className="text-muted-foreground text-sm">总流程数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.round(status.report.executionTime / 1000)}s
                  </div>
                  <div className="text-muted-foreground text-sm">执行时间</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 各流程详细结果 */}
          <div className="grid gap-4">
            {status.report.results.map((result: ValidationResult) => (
              <Card key={result.flowName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFlowStatusIcon(result.success)}
                      {getFlowName(result.flowName)}
                    </div>
                    {getFlowStatusBadge(result.success)}
                  </CardTitle>
                  <CardDescription>
                    执行时间: {Math.round(result.executionTime / 1000)}s |
                    步骤数: {result.steps.length} | 错误数:{' '}
                    {result.errors.length} | 警告数: {result.warnings.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 验证步骤 */}
                  <div className="space-y-2">
                    <h4 className="font-medium">验证步骤:</h4>
                    {result.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        {step.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span>{step.stepName}</span>
                        <span className="text-muted-foreground">
                          ({step.duration}ms)
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 错误信息 */}
                  {result.errors.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-red-600">错误信息:</h4>
                      {result.errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertDescription>
                            <strong>{error.step}:</strong> {error.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {/* 警告信息 */}
                  {result.warnings.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-yellow-600">警告信息:</h4>
                      {result.warnings.map((warning, index) => (
                        <Alert key={index}>
                          <AlertDescription>
                            <strong>{warning.step}:</strong> {warning.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getFlowName(flowName: string): string {
  const flowNames: Record<string, string> = {
    RoomManagement: '房间管理流程',
    BillGeneration: '账单生成流程',
    MeterReading: '水电表抄表流程',
    ContractLifecycle: '合同生命周期流程',
    DataConsistency: '数据一致性检查',
  }
  return flowNames[flowName] || flowName
}
