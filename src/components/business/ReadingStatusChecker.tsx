'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, RefreshCw, Wrench } from 'lucide-react'

interface StatusCheckResult {
  success: boolean
  data: {
    isConsistent: boolean
    inconsistencies: number
    details: {
      orphanedReadings: number
      inconsistentReadings: number
    }
    orphanedReadings: any[]
    inconsistentReadings: any[]
    statistics: any
  }
  message: string
}

interface RepairResult {
  success: boolean
  data: {
    repairedOrphaned: number
    repairedInconsistent: number
    errors: string[]
    preRepairInconsistencies: number
    postRepairInconsistencies: number
    fullyRepaired: boolean
  }
  message: string
}

/**
 * 抄表状态一致性检查组件
 * 提供状态检查和自动修复功能
 */
export function ReadingStatusChecker() {
  const [checking, setChecking] = useState(false)
  const [repairing, setRepairing] = useState(false)
  const [checkResult, setCheckResult] = useState<StatusCheckResult | null>(null)
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null)

  const handleCheck = async () => {
    setChecking(true)
    setRepairResult(null)
    
    try {
      const response = await fetch('/api/meter-readings/status-check')
      const data = await response.json()
      setCheckResult(data)
    } catch (error) {
      console.error('状态检查失败:', error)
      alert('状态检查失败，请稍后重试')
    } finally {
      setChecking(false)
    }
  }

  const handleRepair = async () => {
    setRepairing(true)
    
    try {
      const response = await fetch('/api/meter-readings/repair-status', {
        method: 'POST'
      })
      const data = await response.json()
      setRepairResult(data)
      
      // 修复后重新检查状态
      if (data.success) {
        setTimeout(() => {
          handleCheck()
        }, 1000)
      }
    } catch (error) {
      console.error('状态修复失败:', error)
      alert('状态修复失败，请稍后重试')
    } finally {
      setRepairing(false)
    }
  }

  const getStatusColor = (isConsistent: boolean) => {
    return isConsistent ? 'text-green-600' : 'text-yellow-600'
  }

  const getStatusIcon = (isConsistent: boolean) => {
    return isConsistent ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <AlertCircle className="w-5 h-5 text-yellow-600" />
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          抄表状态一致性检查
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button 
            onClick={handleCheck} 
            disabled={checking || repairing}
            variant="outline"
          >
            {checking ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                检查中...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                检查状态
              </>
            )}
          </Button>
          
          {checkResult && !checkResult.data.isConsistent && (
            <Button 
              onClick={handleRepair} 
              disabled={checking || repairing}
              variant="default"
            >
              {repairing ? (
                <>
                  <Wrench className="w-4 h-4 mr-2 animate-pulse" />
                  修复中...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  自动修复
                </>
              )}
            </Button>
          )}
        </div>

        {/* 检查结果 */}
        {checkResult && (
          <div className={`p-4 rounded-lg border ${
            checkResult.data.isConsistent ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(checkResult.data.isConsistent)}
              <span className={`font-medium ${getStatusColor(checkResult.data.isConsistent)}`}>
                {checkResult.message}
              </span>
            </div>
            
            {!checkResult.data.isConsistent && (
              <div className="text-sm space-y-1">
                <p>• 孤立记录: {checkResult.data.details.orphanedReadings}个 (状态为BILLED但无账单明细)</p>
                <p>• 不一致记录: {checkResult.data.details.inconsistentReadings}个 (有账单明细但状态错误)</p>
              </div>
            )}
            
            {/* 统计信息 */}
            {checkResult.data.statistics && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p>总抄表记录: {checkResult.data.statistics.summary.totalReadings}个</p>
                  <p>已生成账单: {checkResult.data.statistics.summary.totalBilled}个 ({checkResult.data.statistics.summary.billedPercentage}%)</p>
                  <p>最近7天变更: {checkResult.data.statistics.summary.recentChanges}个</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 修复结果 */}
        {repairResult && (
          <div className={`p-4 rounded-lg border ${
            repairResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {repairResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                repairResult.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {repairResult.message}
              </span>
            </div>
            
            <div className="text-sm space-y-1">
              <p>• 修复前不一致记录: {repairResult.data.preRepairInconsistencies}个</p>
              <p>• 修复后不一致记录: {repairResult.data.postRepairInconsistencies}个</p>
              <p>• 孤立记录修复: {repairResult.data.repairedOrphaned}个</p>
              <p>• 不一致记录修复: {repairResult.data.repairedInconsistent}个</p>
              
              {repairResult.data.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-red-600 font-medium">修复错误:</p>
                  <ul className="list-disc list-inside text-red-600">
                    {repairResult.data.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 详细记录列表 */}
        {checkResult && !checkResult.data.isConsistent && (
          <div className="space-y-3">
            {/* 孤立记录 */}
            {checkResult.data.orphanedReadings.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">孤立记录 (状态为BILLED但无账单明细)</h4>
                <div className="space-y-2">
                  {checkResult.data.orphanedReadings.map((reading) => (
                    <div key={reading.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{reading.meterName}</span>
                          <Badge variant="outline" className="ml-2">
                            {reading.meterType}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {reading.roomInfo && (
                            <span>{reading.roomInfo.buildingName} - {reading.roomInfo.roomNumber}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        状态: {reading.status} | 已生成账单: {reading.isBilled ? '是' : '否'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 不一致记录 */}
            {checkResult.data.inconsistentReadings.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">不一致记录 (有账单明细但状态错误)</h4>
                <div className="space-y-2">
                  {checkResult.data.inconsistentReadings.map((reading) => (
                    <div key={reading.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{reading.meterName}</span>
                          <Badge variant="outline" className="ml-2">
                            {reading.meterType}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {reading.roomInfo && (
                            <span>{reading.roomInfo.buildingName} - {reading.roomInfo.roomNumber}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        状态: {reading.status} | 已生成账单: {reading.isBilled ? '是' : '否'} | 账单明细: {reading.billDetailsCount}个
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}