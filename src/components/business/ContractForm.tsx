'use client'

import { useEffect, useState } from 'react'

import type {
  RenterWithContractsForClient,
  RoomWithBuildingForClient,
} from '@/types/database'
import { ErrorLogger, ErrorSeverity, ErrorType } from '@/lib/error-logger'
import { contractCreateMobileStyles } from '@/components/business/contract-create-mobile-styles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { ContractBillPreview } from './ContractBillPreview'
import { SimpleErrorAlert } from './ErrorAlert'
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
  onSubmit: (data: ContractFormData) => Promise<void> | void
  onCancel: () => void
  loading?: boolean
  mode: 'create' | 'edit'
  initialData?: Partial<ContractFormData>
  contractDefaults?: {
    defaultRentCycle: string
    defaultPaymentTiming: string
    defaultDepositMonths: number
  }
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function normalizeDefaultPaymentMethod(defaultRentCycle?: string): string {
  switch (defaultRentCycle) {
    case 'monthly':
    case '月付':
      return '月付'
    case 'quarterly':
    case '季付':
      return '季付'
    case 'semiannual':
    case '半年付':
      return '半年付'
    case 'yearly':
    case '年付':
      return '年付'
    default:
      return '月付'
  }
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
  contractDefaults,
}: ContractFormProps) {
  const [selectedRenter, setSelectedRenter] =
    useState<RenterWithContractsForClient | null>(null)
  const [selectedRoom, setSelectedRoom] =
    useState<RoomWithBuildingForClient | null>(null)
  // 新增：仪表相关状态
  const [roomMeters, setRoomMeters] = useState<MeterForClient[]>([])
  const [metersLoading, setMetersLoading] = useState(false)
  const [meterReadings, setMeterReadings] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<ContractFormData>({
    renterId: '',
    roomId: '',
    startDate: '',
    endDate: '',
    monthlyRent: 0,
    deposit: 0,
    keyDeposit: 0,
    cleaningFee: 0,
    paymentMethod: normalizeDefaultPaymentMethod(
      contractDefaults?.defaultRentCycle
    ),
    paymentTiming: contractDefaults?.defaultPaymentTiming || '每月1号前',
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
          const initialReadings: Record<string, string> = {}
          activeMeters.forEach((meter: MeterForClient) => {
            initialReadings[meter.id] = ''
          })
          setMeterReadings(initialReadings)
          setFormData((prev) => ({
            ...prev,
            meterInitialReadings: {},
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
        deposit:
          mode === 'create'
            ? selectedRoom.rent * (contractDefaults?.defaultDepositMonths ?? 2)
            : prev.deposit,
      }))

      // 新增：加载房间仪表数据
      if (mode === 'create') {
        loadRoomMeters(selectedRoom.id)
      }
    }
  }, [selectedRoom, mode, contractDefaults?.defaultDepositMonths])

  useEffect(() => {
    if (mode !== 'create') {
      return
    }

    setFormData((prev) => ({
      ...prev,
      paymentMethod: normalizeDefaultPaymentMethod(
        contractDefaults?.defaultRentCycle
      ),
      paymentTiming: contractDefaults?.defaultPaymentTiming || '每月1号前',
      deposit: selectedRoom
        ? selectedRoom.rent * (contractDefaults?.defaultDepositMonths ?? 2)
        : prev.deposit,
    }))
  }, [contractDefaults, mode, selectedRoom])

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
    const startDateStr = formatDateForInput(startDate)

    // 计算结束日期：开始日期 + 指定月数 - 1天
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + months)
    endDate.setDate(endDate.getDate() - 1) // 减去1天，确保是准确的月数

    const endDateStr = formatDateForInput(endDate)

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
  const handleMeterReadingChange = (meterId: string, value: string) => {
    const newReadings = {
      ...meterReadings,
      [meterId]: value,
    }
    setMeterReadings(newReadings)
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
      // 仅在房间已配置活跃仪表时要求录入底数；无仪表不阻断合同创建
      for (const meter of roomMeters) {
        const reading = meterReadings[meter.id]
        if (reading === undefined || reading.trim() === '') {
          return `请为仪表"${meter.displayName}"录入当前读数`
        }

        const parsedReading = Number(reading)
        if (Number.isNaN(parsedReading) || parsedReading < 0) {
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
      const submissionData: ContractFormData = {
        ...formData,
        meterInitialReadings:
          mode === 'create' && roomMeters.length > 0
            ? Object.fromEntries(
                roomMeters.map((meter) => [
                  meter.id,
                  Number(meterReadings[meter.id]),
                ])
              )
            : {},
      }

      await onSubmit(submissionData)
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

  const submitting = loading || isSubmitting

  return (
    <form onSubmit={handleSubmit} className={contractCreateMobileStyles.form}>
      {/* 错误提示 */}
      {error && (
        <SimpleErrorAlert
          title="合同表单验证失败"
          message={error}
          onRetry={handleRetry}
        />
      )}

      {/* 租客选择 */}
      <Card className={contractCreateMobileStyles.card}>
        <CardHeader className={contractCreateMobileStyles.cardHeader}>
          <CardTitle className={contractCreateMobileStyles.cardTitle}>
            选择租客
          </CardTitle>
        </CardHeader>
        <CardContent className={contractCreateMobileStyles.cardContent}>
          <RenterSelector
            renters={renters}
            selectedRenter={selectedRenter}
            onRenterSelect={setSelectedRenter}
            disabled={submitting || mode === 'edit'}
          />
          {mode === 'edit' && (
            <p className={contractCreateMobileStyles.helperText}>
              编辑模式下不能更改租客
            </p>
          )}
        </CardContent>
      </Card>

      {/* 房间选择 */}
      <Card className={contractCreateMobileStyles.card}>
        <CardHeader className={contractCreateMobileStyles.cardHeader}>
          <CardTitle className={contractCreateMobileStyles.cardTitle}>
            选择房间
          </CardTitle>
        </CardHeader>
        <CardContent className={contractCreateMobileStyles.cardContent}>
          <RoomSelector
            rooms={availableRooms}
            selectedRoom={selectedRoom}
            onRoomSelect={setSelectedRoom}
            disabled={submitting || mode === 'edit'}
          />
          {mode === 'edit' && (
            <p className={contractCreateMobileStyles.helperText}>
              编辑模式下不能更改房间
            </p>
          )}
        </CardContent>
      </Card>

      {/* 新增：仪表初始读数录入 */}
      {mode === 'create' && selectedRoom && (
        <Card className={contractCreateMobileStyles.card}>
          <CardHeader className={contractCreateMobileStyles.cardHeader}>
            <CardTitle className={contractCreateMobileStyles.cardTitle}>
              仪表初始读数（底数）
            </CardTitle>
            <p className={contractCreateMobileStyles.cardDescription}>
              请录入房间内各仪表的当前读数作为租期开始的底数
            </p>
          </CardHeader>
          <CardContent className={contractCreateMobileStyles.cardContent}>
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
              <div className={contractCreateMobileStyles.meterList}>
                {roomMeters.map((meter) => (
                  <div
                    key={meter.id}
                    className={contractCreateMobileStyles.meterCard}
                  >
                    <div className={contractCreateMobileStyles.meterHeader}>
                      <div>
                        <h4 className={contractCreateMobileStyles.meterTitle}>
                          {meter.displayName}
                        </h4>
                        <p className={contractCreateMobileStyles.meterMeta}>
                          {meter.meterNumber} • {meter.location || '未设置位置'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={contractCreateMobileStyles.meterPrice}>
                          单价: ¥{meter.unitPrice}/{meter.unit}
                        </p>
                        <p className={contractCreateMobileStyles.meterType}>
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
                    <div className={contractCreateMobileStyles.meterInputRow}>
                      <Label
                        htmlFor={`meter-${meter.id}`}
                        className={contractCreateMobileStyles.label}
                      >
                        初始读数:
                      </Label>
                      <Input
                        id={`meter-${meter.id}`}
                        type="number"
                        value={meterReadings[meter.id] ?? ''}
                        onChange={(e) =>
                          handleMeterReadingChange(meter.id, e.target.value)
                        }
                        disabled={submitting}
                        min="0"
                        step="0.01"
                        className={contractCreateMobileStyles.meterInput}
                        placeholder="请输入当前读数"
                      />
                      <span className={contractCreateMobileStyles.meterUnit}>
                        {meter.unit}
                      </span>
                    </div>
                  </div>
                ))}
                <div className={contractCreateMobileStyles.infoBox}>
                  <p className={contractCreateMobileStyles.infoText}>
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
      <Card className={contractCreateMobileStyles.card}>
        <CardHeader className={contractCreateMobileStyles.cardHeader}>
          <CardTitle className={contractCreateMobileStyles.cardTitle}>
            合同信息
          </CardTitle>
        </CardHeader>
        <CardContent className={contractCreateMobileStyles.cardContent}>
          {/* 租期快速选择 */}
          {mode === 'create' && (
            <div className={contractCreateMobileStyles.fieldStack}>
              <Label className={contractCreateMobileStyles.label}>
                租期快速选择
              </Label>
              <div className={contractCreateMobileStyles.quickActions}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriodSelect(3)}
                  disabled={submitting}
                  className={contractCreateMobileStyles.quickButton}
                >
                  3个月
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriodSelect(6)}
                  disabled={submitting}
                  className={contractCreateMobileStyles.quickButton}
                >
                  6个月
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriodSelect(12)}
                  disabled={submitting}
                  className={contractCreateMobileStyles.quickButton}
                >
                  12个月
                </Button>
              </div>
              <p className={contractCreateMobileStyles.helperText}>
                点击快速设置标准租期，或手动选择具体日期
              </p>
            </div>
          )}

          <div className={contractCreateMobileStyles.fieldGrid}>
            <div className={contractCreateMobileStyles.fieldStack}>
              <Label htmlFor="startDate" className={contractCreateMobileStyles.label}>
                开始日期 *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                disabled={submitting || mode === 'edit'}
                required
                className={contractCreateMobileStyles.input}
              />
              {mode === 'edit' && (
                <p className={contractCreateMobileStyles.helperText}>
                  编辑模式下不能更改合同日期
                </p>
              )}
            </div>
            <div className={contractCreateMobileStyles.fieldStack}>
              <Label htmlFor="endDate" className={contractCreateMobileStyles.label}>
                结束日期 *
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                disabled={submitting || mode === 'edit'}
                required
                className={contractCreateMobileStyles.input}
              />
              {formData.startDate && formData.endDate && (
                <p className={contractCreateMobileStyles.helperText}>
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
      <Card className={contractCreateMobileStyles.card}>
        <CardHeader className={contractCreateMobileStyles.cardHeader}>
          <CardTitle className={contractCreateMobileStyles.cardTitle}>
            租金信息
          </CardTitle>
          {mode === 'edit' && (
            <p className={contractCreateMobileStyles.inlineWarning}>
              ⚠️ 为保证合同的完整性和租客信任，合同生效后不建议修改费用信息。
              如需处理额外费用，请使用"创建账单"功能；如需调整租金，请在合同到期后重新签约。
            </p>
          )}
        </CardHeader>
        <CardContent className={contractCreateMobileStyles.cardContent}>
          <div className={contractCreateMobileStyles.fieldGrid}>
            <div className={contractCreateMobileStyles.fieldStack}>
              <Label
                htmlFor="monthlyRent"
                className={contractCreateMobileStyles.label}
              >
                月租金 (元) *
              </Label>
              <Input
                id="monthlyRent"
                type="number"
                value={formData.monthlyRent}
                onChange={(e) =>
                  handleInputChange('monthlyRent', Number(e.target.value))
                }
                disabled={submitting || mode === 'edit'}
                required
                min="0"
                step="0.01"
                className={contractCreateMobileStyles.input}
              />
              {mode === 'edit' && (
                <p className={contractCreateMobileStyles.helperText}>
                  合同生效后不可修改租金，如需调整请在续约时处理
                </p>
              )}
            </div>
            <div className={contractCreateMobileStyles.fieldStack}>
              <Label htmlFor="deposit" className={contractCreateMobileStyles.label}>
                押金 (元) *
              </Label>
              <Input
                id="deposit"
                type="number"
                value={formData.deposit}
                onChange={(e) =>
                  handleInputChange('deposit', Number(e.target.value))
                }
                disabled={submitting || mode === 'edit'}
                required
                min="0"
                step="0.01"
                className={contractCreateMobileStyles.input}
              />
              {mode === 'edit' && (
                <p className={contractCreateMobileStyles.helperText}>
                  合同生效后不可修改押金
                </p>
              )}
            </div>
          </div>

          <div className={contractCreateMobileStyles.fieldGrid}>
            <div className={contractCreateMobileStyles.fieldStack}>
              <Label
                htmlFor="keyDeposit"
                className={contractCreateMobileStyles.label}
              >
                钥匙押金 (元)
              </Label>
              <Input
                id="keyDeposit"
                type="number"
                value={formData.keyDeposit || ''}
                onChange={(e) =>
                  handleInputChange('keyDeposit', Number(e.target.value) || 0)
                }
                disabled={submitting || mode === 'edit'}
                min="0"
                step="0.01"
                className={contractCreateMobileStyles.input}
              />
              {mode === 'edit' && (
                <p className={contractCreateMobileStyles.helperText}>
                  合同生效后不可修改钥匙押金
                </p>
              )}
            </div>
            <div className={contractCreateMobileStyles.fieldStack}>
              <Label
                htmlFor="cleaningFee"
                className={contractCreateMobileStyles.label}
              >
                卫生费 (元)
              </Label>
              <Input
                id="cleaningFee"
                type="number"
                value={formData.cleaningFee || ''}
                onChange={(e) =>
                  handleInputChange('cleaningFee', Number(e.target.value) || 0)
                }
                disabled={submitting || mode === 'edit'}
                min="0"
                step="0.01"
                className={contractCreateMobileStyles.input}
              />
              {mode === 'edit' && (
                <p className={contractCreateMobileStyles.helperText}>
                  合同生效后不可修改卫生费
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 支付信息 */}
      <Card className={contractCreateMobileStyles.card}>
        <CardHeader className={contractCreateMobileStyles.cardHeader}>
          <CardTitle className={contractCreateMobileStyles.cardTitle}>
            支付信息
          </CardTitle>
          {mode === 'edit' && (
            <p className={contractCreateMobileStyles.inlineWarning}>
              ⚠️ 支付信息涉及合同核心条款，生效后不建议修改。
              如有特殊情况需要调整，请在合同续约时处理。
            </p>
          )}
        </CardHeader>
        <CardContent className={contractCreateMobileStyles.cardContent}>
          <div className={contractCreateMobileStyles.fieldGrid}>
            <div className={contractCreateMobileStyles.fieldStack}>
              <Label
                htmlFor="paymentMethod"
                className={contractCreateMobileStyles.label}
              >
                支付方式
              </Label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) =>
                  handleInputChange('paymentMethod', e.target.value)
                }
                disabled={submitting || mode === 'edit'}
                className={contractCreateMobileStyles.select}
              >
                <option value="月付">月付</option>
                <option value="季付">季付</option>
                <option value="半年付">半年付</option>
                <option value="年付">年付</option>
              </select>
              {mode === 'edit' && (
                <p className={contractCreateMobileStyles.helperText}>
                  支付方式影响账单生成，生效后不可修改
                </p>
              )}
            </div>
            <div className={contractCreateMobileStyles.fieldStack}>
              <Label
                htmlFor="paymentTiming"
                className={contractCreateMobileStyles.label}
              >
                付款时间
              </Label>
              <Input
                id="paymentTiming"
                value={formData.paymentTiming || ''}
                onChange={(e) =>
                  handleInputChange('paymentTiming', e.target.value)
                }
                disabled={submitting || mode === 'edit'}
                placeholder="如：每月1号前"
                className={contractCreateMobileStyles.input}
              />
              {mode === 'edit' && (
                <p className={contractCreateMobileStyles.helperText}>
                  付款时间涉及合同条款，生效后不可修改
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 签约信息 */}
      <Card className={contractCreateMobileStyles.card}>
        <CardHeader className={contractCreateMobileStyles.cardHeader}>
          <CardTitle className={contractCreateMobileStyles.cardTitle}>
            签约信息
          </CardTitle>
          <p className={contractCreateMobileStyles.cardDescription}>
            签约人默认为租客本人，如需代签请修改签约人信息
          </p>
        </CardHeader>
        <CardContent className={contractCreateMobileStyles.cardContent}>
          <div className={contractCreateMobileStyles.fieldGrid}>
            <div className={contractCreateMobileStyles.fieldStack}>
              <Label htmlFor="signedBy" className={contractCreateMobileStyles.label}>
                签约人 *
              </Label>
              <Input
                id="signedBy"
                value={formData.signedBy || ''}
                onChange={(e) => handleInputChange('signedBy', e.target.value)}
                disabled={submitting}
                placeholder="签约人姓名"
                required
                className={contractCreateMobileStyles.input}
              />
              <p className={contractCreateMobileStyles.helperText}>
                合同签署人，默认为租客本人
              </p>
            </div>
            <div className={contractCreateMobileStyles.fieldStack}>
              <Label
                htmlFor="signedDate"
                className={contractCreateMobileStyles.label}
              >
                签约日期
              </Label>
              <Input
                id="signedDate"
                type="date"
                value={formData.signedDate || ''}
                onChange={(e) =>
                  handleInputChange('signedDate', e.target.value)
                }
                disabled={submitting}
                className={contractCreateMobileStyles.input}
              />
              <p className={contractCreateMobileStyles.helperText}>
                合同正式签署的日期
              </p>
            </div>
          </div>

          <div className={contractCreateMobileStyles.fieldStack}>
            <Label htmlFor="remarks" className={contractCreateMobileStyles.label}>
              备注
            </Label>
            <Textarea
              id="remarks"
              value={formData.remarks || ''}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              disabled={submitting}
              placeholder="合同备注信息"
              rows={3}
              className={contractCreateMobileStyles.textarea}
            />
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className={contractCreateMobileStyles.actionsRow}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className={contractCreateMobileStyles.actionButton}
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={submitting || !selectedRenter || !selectedRoom}
          className={contractCreateMobileStyles.actionButton}
        >
          {submitting ? '处理中...' : mode === 'create' ? '创建合同' : '保存修改'}
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
