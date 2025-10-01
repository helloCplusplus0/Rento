'use client'

import { useEffect, useState } from 'react'

import type {
  RenterWithContractsForClient,
  RoomWithBuildingForClient,
} from '@/types/database'
import { ErrorLogger, ErrorSeverity, ErrorType } from '@/lib/error-logger'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { ContractBillPreview } from './ContractBillPreview'
import { ErrorAlert, SimpleErrorAlert } from './ErrorAlert'
import { RenterSelector } from './RenterSelector'
import { RoomSelector } from './RoomSelector'

interface ContractFormData {
  renterId: string
  roomId: string
  startDate: string
  endDate: string
  monthlyRent: number
  deposit: number
  keyDeposit?: number
  cleaningFee?: number
  paymentMethod?: string
  paymentTiming?: string
  signedBy?: string
  signedDate?: string
  remarks?: string
  // 新增：仪表初始读数
  meterInitialReadings?: Record<string, number>
}

interface ContractFormProps {
  renters: RenterWithContractsForClient[]
  availableRooms: RoomWithBuildingForClient[]
  preselectedRoomId?: string // 预选房间ID
  preselectedRenterId?: string // 预选租客ID
  onSubmit: (data: ContractFormData) => void
  onCancel: () => void
  loading?: boolean
  mode: 'create' | 'edit'
  initialData?: Partial<ContractFormData>
}

/**
 * 合同表单组件
 * 支持创建和编辑模式
 */
export function ContractForm({
  renters,
  availableRooms,
  preselectedRoomId,
  preselectedRenterId,
  onSubmit,
  onCancel,
  loading = false,
  mode,
  initialData,
}: ContractFormProps) {
  const [selectedRenter, setSelectedRenter] =
    useState<RenterWithContractsForClient | null>(null)
  const [selectedRoom, setSelectedRoom] =
    useState<RoomWithBuildingForClient | null>(null)
  // 新增：仪表相关状态
  const [roomMeters, setRoomMeters] = useState<MeterForClient[]>([])
  const [metersLoading, setMetersLoading] = useState(false)
  const [meterReadings, setMeterReadings] = useState<Record<string, number>>({})

  const [formData, setFormData] = useState<ContractFormData>({
    renterId: '',
    roomId: '',
    startDate: '',
    endDate: '',
    monthlyRent: 0,
    deposit: 0,
    keyDeposit: 0,
    cleaningFee: 0,
    paymentMethod: '月付',
    paymentTiming: '每月1号前',
    signedBy: '',
    signedDate: '',
    remarks: '',
    meterInitialReadings: {},
  })

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 新增：加载房间仪表数据
  const loadRoomMeters = async (roomId: string) => {
    if (!roomId) return

    setMetersLoading(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}/meters`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // 只显示活跃的仪表
          const activeMeters = result.data.filter(
            (meter: any) => meter.isActive
          )
          setRoomMeters(activeMeters)

          // 初始化仪表读数为0
          const initialReadings: Record<string, number> = {}
          activeMeters.forEach((meter: MeterForClient) => {
            initialReadings[meter.id] = 0
          })
          setMeterReadings(initialReadings)
          setFormData((prev) => ({
            ...prev,
            meterInitialReadings: initialReadings,
          }))
        } else {
          setRoomMeters([])
          setMeterReadings({})
        }
      } else {
        console.error('获取房间仪表失败:', response.status)
        setRoomMeters([])
        setMeterReadings({})
      }
    } catch (error) {
      console.error('加载房间仪表数据失败:', error)
      setRoomMeters([])
      setMeterReadings({})
    } finally {
      setMetersLoading(false)
    }
  }

  // 初始化表单数据和预选房间/租客
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }))
    }

    // 如果有预选房间ID，自动选择该房间
    if (preselectedRoomId) {
      const preselectedRoom = availableRooms.find(
        (room) => room.id === preselectedRoomId
      )
      if (preselectedRoom) {
        setSelectedRoom(preselectedRoom)
      }
    }

    // 如果有预选租客ID，自动选择该租客
    if (preselectedRenterId) {
      const preselectedRenter = renters.find(
        (renter) => renter.id === preselectedRenterId
      )
      if (preselectedRenter) {
        setSelectedRenter(preselectedRenter)
      }
    }
  }, [
    initialData,
    preselectedRoomId,
    preselectedRenterId,
    availableRooms,
    renters,
  ])

  // 当选择房间时，自动填充租金信息
  useEffect(() => {
    if (selectedRoom) {
      setFormData((prev) => ({
        ...prev,
        roomId: selectedRoom.id,
        monthlyRent: selectedRoom.rent,
        deposit: selectedRoom.rent * 2, // 默认2个月押金
      }))

      // 新增：加载房间仪表数据
      if (mode === 'create') {
        loadRoomMeters(selectedRoom.id)
      }
    }
  }, [selectedRoom, mode])

  // 当选择租客时，自动填充签约人信息
  useEffect(() => {
    if (selectedRenter) {
      setFormData((prev) => ({
        ...prev,
        renterId: selectedRenter.id,
        signedBy: selectedRenter.name, // 自动填充签约人为租客姓名
      }))
    }
  }, [selectedRenter])

  // 租期快速选择处理函数
  const handleQuickPeriodSelect = (months: number) => {
    const today = new Date()
    const startDate = new Date(today)

    // 设置开始日期为今天
    const startDateStr = startDate.toISOString().split('T')[0]

    // 计算结束日期：开始日期 + 指定月数 - 1天
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + months)
    endDate.setDate(endDate.getDate() - 1) // 减去1天，确保是准确的月数

    const endDateStr = endDate.toISOString().split('T')[0]

    setFormData((prev) => ({
      ...prev,
      startDate: startDateStr,
      endDate: endDateStr,
    }))
  }

  // 计算并显示租期信息
  const calculateRentPeriodDisplay = (
    startDateStr: string,
    endDateStr: string
  ): string => {
    if (!startDateStr || !endDateStr) return ''

    const start = new Date(startDateStr)
    const end = new Date(endDateStr)

    // 计算天数
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 包含结束日期当天

    // 计算月数（使用与后端相同的逻辑）
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))

    return `${diffDays}天 (约${diffMonths}个月)`
  }

  // 根据支付方式计算租金倍数
  const calculateRentMultiplier = (paymentMethod: string): number => {
    if (paymentMethod.includes('季') || paymentMethod.includes('3个月')) {
      return 3
    }
    if (paymentMethod.includes('半年') || paymentMethod.includes('6个月')) {
      return 6 // 半年付必须在年付之前检查
    }
    if (paymentMethod.includes('年') || paymentMethod.includes('12个月')) {
      return 12
    }
    return 1 // 默认月付
  }

  // 计算实际租金金额（根据支付周期）
  const actualRentAmount =
    formData.monthlyRent *
    calculateRentMultiplier(formData.paymentMethod || '月付')

  const handleInputChange = (
    field: keyof ContractFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // 清除错误状态
    if (error) {
      setError(null)
    }
  }

  // 新增：处理仪表读数变化
  const handleMeterReadingChange = (meterId: string, value: number) => {
    const newReadings = {
      ...meterReadings,
      [meterId]: value,
    }
    setMeterReadings(newReadings)
    setFormData((prev) => ({
      ...prev,
      meterInitialReadings: newReadings,
    }))
  }

  const validateForm = (): string | null => {
    if (
      !formData.renterId ||
      !formData.roomId ||
      !formData.startDate ||
      !formData.endDate
    ) {
      return '请填写必填信息'
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      return '结束日期必须晚于开始日期'
    }

    if (formData.monthlyRent <= 0) {
      return '月租金必须大于0'
    }

    // 新增：仪表配置验证（仅在创建模式下）
    if (mode === 'create' && selectedRoom) {
      if (roomMeters.length === 0 && !metersLoading) {
        return '该房间未配置仪表，建议先配置仪表后再创建合同'
      }

      // 检查是否所有仪表都有初始读数
      for (const meter of roomMeters) {
        const reading = meterReadings[meter.id]
        if (reading === undefined || reading < 0) {
          return `请为仪表"${meter.displayName}"设置有效的初始读数`
        }
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 表单验证
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(formData)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '提交失败，请重试'
      setError(errorMessage)

      // 记录错误日志
      const logger = ErrorLogger.getInstance()
      await logger.logError(
        ErrorType.VALIDATION_ERROR,
        ErrorSeverity.HIGH,
        `合同表单提交失败: ${errorMessage}`,
        {
          module: 'ContractForm',
          function: 'handleSubmit',
          formData: { ...formData, renterId: '***', roomId: '***' }, // 脱敏处理
        },
        err instanceof Error ? err : undefined
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => {
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <SimpleErrorAlert
          title="合同表单验证失败"
          message={error}
          onRetry={handleRetry}
        />
      )}

      {/* 租客选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择租客</CardTitle>
        </CardHeader>
        <CardContent>
          <RenterSelector
            renters={renters}
            selectedRenter={selectedRenter}
            onRenterSelect={setSelectedRenter}
            disabled={loading || mode === 'edit'}
          />
          {mode === 'edit' && (
            <p className="mt-2 text-sm text-gray-500">编辑模式下不能更改租客</p>
          )}
        </CardContent>
      </Card>

      {/* 房间选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择房间</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomSelector
            rooms={availableRooms}
            selectedRoom={selectedRoom}
            onRoomSelect={setSelectedRoom}
            disabled={loading || mode === 'edit'}
          />
          {mode === 'edit' && (
            <p className="mt-2 text-sm text-gray-500">编辑模式下不能更改房间</p>
          )}
        </CardContent>
      </Card>

      {/* 新增：仪表初始读数录入 */}
      {mode === 'create' && selectedRoom && (
        <Card>
          <CardHeader>
            <CardTitle>仪表初始读数（底数）</CardTitle>
            <p className="text-sm text-gray-600">
              请录入房间内各仪表的当前读数作为租期开始的底数
            </p>
          </CardHeader>
          <CardContent>
            {metersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-500">加载仪表数据中...</p>
                </div>
              </div>
            ) : roomMeters.length === 0 ? (
              <div className="py-8 text-center">
                <p className="mb-2 text-gray-500">该房间暂未配置仪表</p>
                <p className="text-sm text-amber-600">
                  ⚠️ 建议先为房间配置仪表后再创建合同
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {roomMeters.map((meter) => (
                  <div key={meter.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {meter.displayName}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {meter.meterNumber} • {meter.location || '未设置位置'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          单价: ¥{meter.unitPrice}/{meter.unit}
                        </p>
                        <p className="text-xs text-gray-500">
                          {meter.meterType === 'ELECTRICITY'
                            ? '电表'
                            : meter.meterType === 'COLD_WATER'
                              ? '冷水表'
                              : meter.meterType === 'HOT_WATER'
                                ? '热水表'
                                : '燃气表'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Label
                        htmlFor={`meter-${meter.id}`}
                        className="text-sm font-medium"
                      >
                        初始读数:
                      </Label>
                      <Input
                        id={`meter-${meter.id}`}
                        type="number"
                        value={meterReadings[meter.id] || 0}
                        onChange={(e) =>
                          handleMeterReadingChange(
                            meter.id,
                            Number(e.target.value) || 0
                          )
                        }
                        disabled={loading}
                        min="0"
                        step="0.01"
                        className="w-32"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-500">
                        {meter.unit}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm text-blue-800">
                    💡
                    提示：仪表初始读数将作为租期开始的底数，用于后续抄表计费。请确保读数准确无误。
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 合同基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>合同信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 租期快速选择 */}
          {mode === 'create' && (
            <div className="mb-4">
              <Label className="mb-2 block text-sm font-medium text-gray-700">
                租期快速选择
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriodSelect(3)}
                  disabled={loading}
                  className="text-xs"
                >
                  3个月
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriodSelect(6)}
                  disabled={loading}
                  className="text-xs"
                >
                  6个月
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriodSelect(12)}
                  disabled={loading}
                  className="text-xs"
                >
                  12个月
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                点击快速设置标准租期，或手动选择具体日期
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="startDate">开始日期 *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                disabled={loading || mode === 'edit'}
                required
              />
              {mode === 'edit' && (
                <p className="mt-1 text-xs text-gray-500">
                  编辑模式下不能更改合同日期
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="endDate">结束日期 *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                disabled={loading || mode === 'edit'}
                required
              />
              {formData.startDate && formData.endDate && (
                <p className="mt-1 text-xs text-gray-500">
                  租期:{' '}
                  {calculateRentPeriodDisplay(
                    formData.startDate,
                    formData.endDate
                  )}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 租金信息 */}
      <Card>
        <CardHeader>
          <CardTitle>租金信息</CardTitle>
          {mode === 'edit' && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-600">
              ⚠️ 为保证合同的完整性和租客信任，合同生效后不建议修改费用信息。
              如需处理额外费用，请使用"创建账单"功能；如需调整租金，请在合同到期后重新签约。
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="monthlyRent">月租金 (元) *</Label>
              <Input
                id="monthlyRent"
                type="number"
                value={formData.monthlyRent}
                onChange={(e) =>
                  handleInputChange('monthlyRent', Number(e.target.value))
                }
                disabled={loading || mode === 'edit'}
                required
                min="0"
                step="0.01"
              />
              {mode === 'edit' && (
                <p className="mt-1 text-xs text-gray-500">
                  合同生效后不可修改租金，如需调整请在续约时处理
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="deposit">押金 (元) *</Label>
              <Input
                id="deposit"
                type="number"
                value={formData.deposit}
                onChange={(e) =>
                  handleInputChange('deposit', Number(e.target.value))
                }
                disabled={loading || mode === 'edit'}
                required
                min="0"
                step="0.01"
              />
              {mode === 'edit' && (
                <p className="mt-1 text-xs text-gray-500">
                  合同生效后不可修改押金
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="keyDeposit">钥匙押金 (元)</Label>
              <Input
                id="keyDeposit"
                type="number"
                value={formData.keyDeposit || ''}
                onChange={(e) =>
                  handleInputChange('keyDeposit', Number(e.target.value) || 0)
                }
                disabled={loading || mode === 'edit'}
                min="0"
                step="0.01"
              />
              {mode === 'edit' && (
                <p className="mt-1 text-xs text-gray-500">
                  合同生效后不可修改钥匙押金
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="cleaningFee">清洁费 (元)</Label>
              <Input
                id="cleaningFee"
                type="number"
                value={formData.cleaningFee || ''}
                onChange={(e) =>
                  handleInputChange('cleaningFee', Number(e.target.value) || 0)
                }
                disabled={loading || mode === 'edit'}
                min="0"
                step="0.01"
              />
              {mode === 'edit' && (
                <p className="mt-1 text-xs text-gray-500">
                  合同生效后不可修改清洁费
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 支付信息 */}
      <Card>
        <CardHeader>
          <CardTitle>支付信息</CardTitle>
          {mode === 'edit' && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-600">
              ⚠️ 支付信息涉及合同核心条款，生效后不建议修改。
              如有特殊情况需要调整，请在合同续约时处理。
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="paymentMethod">支付方式</Label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) =>
                  handleInputChange('paymentMethod', e.target.value)
                }
                disabled={loading || mode === 'edit'}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="月付">月付</option>
                <option value="季付">季付</option>
                <option value="半年付">半年付</option>
                <option value="年付">年付</option>
              </select>
              {mode === 'edit' && (
                <p className="mt-1 text-xs text-gray-500">
                  支付方式影响账单生成，生效后不可修改
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="paymentTiming">付款时间</Label>
              <Input
                id="paymentTiming"
                value={formData.paymentTiming || ''}
                onChange={(e) =>
                  handleInputChange('paymentTiming', e.target.value)
                }
                disabled={loading || mode === 'edit'}
                placeholder="如：每月1号前"
              />
              {mode === 'edit' && (
                <p className="mt-1 text-xs text-gray-500">
                  付款时间涉及合同条款，生效后不可修改
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 签约信息 */}
      <Card>
        <CardHeader>
          <CardTitle>签约信息</CardTitle>
          <p className="text-sm text-gray-600">
            签约人默认为租客本人，如需代签请修改签约人信息
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="signedBy">签约人 *</Label>
              <Input
                id="signedBy"
                value={formData.signedBy || ''}
                onChange={(e) => handleInputChange('signedBy', e.target.value)}
                disabled={loading}
                placeholder="签约人姓名"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                合同签署人，默认为租客本人
              </p>
            </div>
            <div>
              <Label htmlFor="signedDate">签约日期</Label>
              <Input
                id="signedDate"
                type="date"
                value={formData.signedDate || ''}
                onChange={(e) =>
                  handleInputChange('signedDate', e.target.value)
                }
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">合同正式签署的日期</p>
            </div>
          </div>

          <div>
            <Label htmlFor="remarks">备注</Label>
            <Textarea
              id="remarks"
              value={formData.remarks || ''}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              disabled={loading}
              placeholder="合同备注信息"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={loading || !selectedRenter || !selectedRoom}
        >
          {loading ? '处理中...' : mode === 'create' ? '创建合同' : '保存修改'}
        </Button>
      </div>

      {/* 账单预览 - 仅在创建模式下显示 */}
      {mode === 'create' &&
        selectedRoom &&
        formData.monthlyRent > 0 &&
        formData.startDate &&
        formData.endDate && (
          <ContractBillPreview
            contractData={{
              startDate: formData.startDate,
              endDate: formData.endDate,
              monthlyRent: formData.monthlyRent,
              deposit: formData.deposit,
              keyDeposit: formData.keyDeposit,
              cleaningFee: formData.cleaningFee,
              paymentMethod: formData.paymentMethod,
            }}
          />
        )}
    </form>
  )
}

// 新增：仪表类型定义
interface MeterForClient {
  id: string
  meterNumber: string
  displayName: string
  meterType: 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'
  unitPrice: number
  unit: string
  location?: string
  isActive: boolean
}
