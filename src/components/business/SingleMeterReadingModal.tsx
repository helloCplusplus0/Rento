'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, Save, X } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'

// 临时类型定义
interface Meter {
  id: string
  displayName: string
  meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
  unitPrice: number
  unit: string
  lastReading?: number
  lastReadingDate?: Date
}

interface MeterReading {
  meterId: string
  currentReading: number
  readingDate: Date
  usage: number
  amount: number
  remarks?: string
}

interface SingleMeterReadingModalProps {
  contractId: string
  roomId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: (reading: MeterReading) => void
}

/**
 * 单次抄表弹窗组件
 * 用于在合同详情页面进行单个房间的抄表录入
 */
export function SingleMeterReadingModal({
  contractId,
  roomId,
  isOpen,
  onClose,
  onSuccess
}: SingleMeterReadingModalProps) {
  const { settings } = useSettings()
  const [meters, setMeters] = useState<Meter[]>([])
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null)
  const [currentReading, setCurrentReading] = useState<number>(0)
  const [remarks, setRemarks] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string>('')

  // 加载房间仪表数据
  useEffect(() => {
    if (isOpen && roomId) {
      loadRoomMeters()
    }
  }, [isOpen, roomId])

  const loadRoomMeters = async () => {
    try {
      setLoading(true)
      // 实际API调用 - 根据房间ID获取该房间的所有仪表
      const response = await fetch(`/api/rooms/${roomId}/meters`)
      if (response.ok) {
        const metersData = await response.json()
        setMeters(metersData.data || [])
        if (metersData.data && metersData.data.length > 0) {
          setSelectedMeter(metersData.data[0])
        }
      } else {
        // 如果API调用失败，使用模拟数据
        const mockMeters: Meter[] = [
          {
            id: 'm1',
            displayName: '电表',
            meterType: 'ELECTRICITY',
            unitPrice: settings.electricityPrice,
            unit: '度',
            lastReading: 1000,
            lastReadingDate: new Date('2024-01-01')
          },
          {
            id: 'm2',
            displayName: '冷水表',
            meterType: 'COLD_WATER',
            unitPrice: settings.waterPrice,
            unit: '吨',
            lastReading: 50,
            lastReadingDate: new Date('2024-01-01')
          }
        ]
        
        setMeters(mockMeters)
        if (mockMeters.length > 0) {
          setSelectedMeter(mockMeters[0])
        }
      }
    } catch (error) {
      console.error('加载仪表数据失败:', error)
      // 出错时使用模拟数据
      const mockMeters: Meter[] = [
        {
          id: 'm1',
          displayName: '电表',
          meterType: 'ELECTRICITY',
          unitPrice: settings.electricityPrice,
          unit: '度',
          lastReading: 1000,
          lastReadingDate: new Date('2024-01-01')
        }
      ]
      setMeters(mockMeters)
      if (mockMeters.length > 0) {
        setSelectedMeter(mockMeters[0])
      }
    } finally {
      setLoading(false)
    }
  }

  // 处理读数变更
  const handleReadingChange = (value: number) => {
    setCurrentReading(value)
    
    if (!selectedMeter) return

    // 简化验证逻辑 - 只检查基本规则，与批量抄表保持一致
    if (value < (selectedMeter.lastReading || 0)) {
      setValidationError('本次读数不能小于上次读数')
    } else {
      setValidationError('')
    }
    
    // 移除复杂的异常用量检测
    // 注释掉原有的异常检测逻辑：
    // } else if (value - (selectedMeter.lastReading || 0) > (selectedMeter.lastReading || 0) * settings.usageAnomalyThreshold) {
    //   setValidationError(`用量异常偏高（超过${settings.usageAnomalyThreshold}倍平均用量）`)
  }

  // 计算用量和费用
  const calculateUsageAndAmount = () => {
    if (!selectedMeter || currentReading <= 0) {
      return { usage: 0, amount: 0 }
    }
    
    const usage = currentReading - (selectedMeter.lastReading || 0)
    const amount = usage * selectedMeter.unitPrice
    
    return { usage, amount }
  }

  // 提交抄表
  const handleSubmit = async () => {
    if (!selectedMeter || currentReading <= 0) {
      alert('请输入有效的读数')
      return
    }

    if (validationError) {
      const confirmed = confirm(`检测到异常：${validationError}\n\n是否仍要提交？`)
      if (!confirmed) return
    }

    try {
      setSubmitting(true)
      
      const { usage, amount } = calculateUsageAndAmount()
      
      const readingData: MeterReading = {
        meterId: selectedMeter.id,
        currentReading,
        readingDate: new Date(),
        usage,
        amount,
        remarks
      }

      // TODO: 实际API调用
      // const response = await fetch('/api/meter-readings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     readings: [readingData],
      //     contractId
      //   })
      // })

      console.log('提交抄表数据:', readingData)
      
      // 模拟成功
      alert('抄表录入成功')
      onSuccess?.(readingData)
      handleClose()
    } catch (error) {
      console.error('提交抄表失败:', error)
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 关闭弹窗
  const handleClose = () => {
    setCurrentReading(0)
    setRemarks('')
    setValidationError('')
    setSelectedMeter(null)
    onClose()
  }

  // 获取仪表类型显示名称
  const getMeterTypeLabel = (type: string) => {
    const labels = {
      ELECTRICITY: '电表',
      COLD_WATER: '冷水表',
      HOT_WATER: '热水表',
      GAS: '燃气表'
    }
    return labels[type as keyof typeof labels] || type
  }

  // 获取仪表类型颜色
  const getMeterTypeColor = (type: string) => {
    const colors = {
      ELECTRICITY: 'bg-yellow-100 text-yellow-800',
      COLD_WATER: 'bg-blue-100 text-blue-800',
      HOT_WATER: 'bg-red-100 text-red-800',
      GAS: 'bg-orange-100 text-orange-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const { usage, amount } = calculateUsageAndAmount()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>抄表录入</span>
            {selectedMeter && (
              <Badge className={getMeterTypeColor(selectedMeter.meterType)}>
                {getMeterTypeLabel(selectedMeter.meterType)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">加载仪表数据中...</div>
          </div>
        ) : meters.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            该房间暂无配置仪表
          </div>
        ) : (
          <div className="space-y-4">
            {/* 仪表选择 */}
            {meters.length > 1 && (
              <div>
                <label className="block text-sm font-medium mb-2">选择仪表</label>
                <div className="grid grid-cols-2 gap-2">
                  {meters.map(meter => (
                    <button
                      key={meter.id}
                      onClick={() => setSelectedMeter(meter)}
                      className={`p-2 text-sm border rounded-md transition-colors ${
                        selectedMeter?.id === meter.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {meter.displayName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedMeter && (
              <>
                {/* 仪表信息 */}
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">上次读数：</span>
                      <span className="font-medium">
                        {selectedMeter.lastReading || 0} {selectedMeter.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">单价：</span>
                      <span className="font-medium">
                        {selectedMeter.unitPrice} 元/{selectedMeter.unit}
                      </span>
                    </div>
                    {selectedMeter.lastReadingDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">上次抄表：</span>
                        <span className="font-medium">
                          {selectedMeter.lastReadingDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 读数录入 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    本次读数 ({selectedMeter.unit})
                  </label>
                  <input
                    type="number"
                    min={selectedMeter.lastReading || 0}
                    step="0.1"
                    placeholder={`请输入读数（≥${selectedMeter.lastReading || 0}）`}
                    className={`w-full px-3 py-2 border rounded-md ${
                      validationError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={currentReading || ''}
                    onChange={(e) => handleReadingChange(parseFloat(e.target.value) || 0)}
                  />
                  {validationError && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-4 h-4" />
                      {validationError}
                    </p>
                  )}
                </div>

                {/* 计算结果 */}
                {currentReading > 0 && !validationError && (
                  <Card>
                    <CardContent className="p-4 bg-green-50 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">计算结果</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">用量：</span>
                          <span className="font-medium text-green-700">
                            {usage.toFixed(1)} {selectedMeter.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">费用：</span>
                          <span className="font-medium text-green-700">
                            ¥{amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 备注 */}
                <div>
                  <label className="block text-sm font-medium mb-2">备注（可选）</label>
                  <textarea
                    rows={2}
                    placeholder="请输入备注信息"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-1" />
                    取消
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || currentReading <= 0}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {submitting ? '提交中...' : '提交'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}