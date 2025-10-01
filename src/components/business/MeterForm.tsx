'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { AlertCircle, CalendarIcon, Loader2 } from 'lucide-react'

import type { MeterFormData, MeterFormProps, MeterType } from '@/types/meter'
import { ErrorLogger, ErrorSeverity, ErrorType } from '@/lib/error-logger'
import {
  formatMeterType,
  getDefaultUnit,
  getDefaultUnitPriceSync,
  validateDisplayName,
  validateUnitPrice,
} from '@/lib/meter-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

/**
 * 表单字段配置
 */
const FORM_FIELDS = {
  displayName: { required: true, maxLength: 50 },
  meterType: { required: true },
  unitPrice: { required: true, min: 0.01, max: 100 },
  unit: { required: true, maxLength: 10 },
  location: { required: false, maxLength: 100 },
  remarks: { required: false, maxLength: 200 },
} as const

/**
 * 仪表类型选项配置
 */
const METER_TYPE_OPTIONS = [
  { value: 'ELECTRICITY', label: '⚡ 电表', icon: '⚡' },
  { value: 'COLD_WATER', label: '💧 冷水表', icon: '💧' },
  { value: 'HOT_WATER', label: '🔥 热水表', icon: '🔥' },
  { value: 'GAS', label: '🔥 燃气表', icon: '🔥' },
] as const

/**
 * 表单验证错误类型
 */
interface FormErrors {
  [key: string]: string
}

/**
 * 表单状态类型
 */
interface FormState {
  data: MeterFormData
  errors: FormErrors
  touched: Record<string, boolean>
  isSubmitting: boolean
  isDirty: boolean
}

/**
 * 重新设计的仪表配置表单组件
 * 采用最佳实践：
 * 1. 清晰的状态管理
 * 2. 完整的表单验证
 * 3. 良好的用户体验
 * 4. 可维护的代码结构
 */
export function MeterForm({
  roomId,
  meter,
  onSubmit,
  onCancel,
  loading = false,
}: MeterFormProps) {
  // 初始表单数据
  const initialFormData = useMemo(
    (): MeterFormData => ({
      displayName: meter?.displayName || '',
      meterType: meter?.meterType || ('' as MeterType),
      unitPrice: meter?.unitPrice || 0,
      unit: meter?.unit || '',
      location: meter?.location || '',
      installDate: meter?.installDate || undefined,
      remarks: meter?.remarks || '',
    }),
    [meter]
  )

  // 表单状态
  const [formState, setFormState] = useState<FormState>({
    data: initialFormData,
    errors: {},
    touched: {},
    isSubmitting: false,
    isDirty: false,
  })

  // 重置表单状态
  const resetForm = useCallback(() => {
    setFormState({
      data: initialFormData,
      errors: {},
      touched: {},
      isSubmitting: false,
      isDirty: false,
    })
  }, [initialFormData])

  // 当meter变化时重置表单
  useEffect(() => {
    resetForm()
  }, [resetForm])

  /**
   * 字段验证函数
   */
  const validateField = useCallback(
    (field: keyof MeterFormData, value: any): string => {
      const config = FORM_FIELDS[field as keyof typeof FORM_FIELDS]

      switch (field) {
        case 'displayName':
          if (!value || !value.trim()) {
            return '显示名称不能为空'
          }
          if (!validateDisplayName(value)) {
            return '显示名称格式不正确，最多50字符，支持中文、英文、数字、横线、下划线'
          }
          break

        case 'meterType':
          if (!value || value === '') {
            return '请选择仪表类型'
          }
          break

        case 'unitPrice':
          if (
            value === null ||
            value === undefined ||
            value === '' ||
            value <= 0
          ) {
            return '单价必须大于0'
          }
          if (!validateUnitPrice(Number(value))) {
            return '单价范围应在0.01-100元之间'
          }
          break

        case 'unit':
          if (!value || value.trim() === '') {
            return '计量单位不能为空'
          }
          if (value.length > 10) {
            return '计量单位最多10个字符'
          }
          break

        case 'location':
          if (value && value.length > 100) {
            return '安装位置最多100个字符'
          }
          break

        case 'remarks':
          if (value && value.length > 200) {
            return '备注信息最多200个字符'
          }
          break
      }

      return ''
    },
    []
  )

  /**
   * 验证整个表单
   */
  const validateForm = useCallback((): FormErrors => {
    const errors: FormErrors = {}

    Object.keys(FORM_FIELDS).forEach((field) => {
      const fieldKey = field as keyof MeterFormData
      const error = validateField(fieldKey, formState.data[fieldKey])
      if (error) {
        errors[field] = error
      }
    })

    return errors
  }, [formState.data, validateField])

  /**
   * 更新字段值
   */
  const updateField = useCallback(
    (field: keyof MeterFormData, value: any) => {
      setFormState((prev) => {
        const newData = { ...prev.data, [field]: value }
        const fieldError = validateField(field, value)
        const newErrors = { ...prev.errors }

        if (fieldError) {
          newErrors[field] = fieldError
        } else {
          delete newErrors[field]
        }

        return {
          ...prev,
          data: newData,
          errors: newErrors,
          touched: { ...prev.touched, [field]: true },
          isDirty: true,
        }
      })
    },
    [validateField]
  )

  /**
   * 仪表类型变更处理
   */
  const handleMeterTypeChange = useCallback(
    (meterType: MeterType) => {
      const defaultUnit = getDefaultUnit(meterType)
      const defaultPrice = getDefaultUnitPriceSync(meterType)

      setFormState((prev) => {
        const newData = {
          ...prev.data,
          meterType,
          unit: defaultUnit,
          unitPrice: defaultPrice,
        }

        // 重新验证所有受影响的字段
        const newErrors = { ...prev.errors }

        // 验证meterType
        const meterTypeError = validateField('meterType', meterType)
        if (meterTypeError) {
          newErrors.meterType = meterTypeError
        } else {
          delete newErrors.meterType
        }

        // 验证unit
        const unitError = validateField('unit', defaultUnit)
        if (unitError) {
          newErrors.unit = unitError
        } else {
          delete newErrors.unit
        }

        // 验证unitPrice
        const unitPriceError = validateField('unitPrice', defaultPrice)
        if (unitPriceError) {
          newErrors.unitPrice = unitPriceError
        } else {
          delete newErrors.unitPrice
        }

        return {
          ...prev,
          data: newData,
          errors: newErrors,
          touched: {
            ...prev.touched,
            meterType: true,
            unit: true,
            unitPrice: true,
          },
          isDirty: true,
        }
      })
    },
    [validateField]
  )

  /**
   * 表单提交处理
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // 验证表单
      const errors = validateForm()
      if (Object.keys(errors).length > 0) {
        setFormState((prev) => ({
          ...prev,
          errors,
          touched: Object.keys(FORM_FIELDS).reduce(
            (acc, field) => ({
              ...acc,
              [field]: true,
            }),
            {}
          ),
        }))
        return
      }

      setFormState((prev) => ({ ...prev, isSubmitting: true }))

      try {
        await onSubmit(formState.data)
      } catch (error) {
        // 记录错误日志
        const logger = ErrorLogger.getInstance()
        await logger.logError(
          ErrorType.VALIDATION_ERROR,
          ErrorSeverity.MEDIUM,
          '仪表表单提交失败',
          {
            module: 'meter-form-v2',
            function: 'handleSubmit',
            formData: JSON.stringify(formState.data),
            isEdit: !!meter,
          },
          error instanceof Error ? error : undefined
        )

        // 重新抛出错误，让父组件处理
        throw error
      } finally {
        setFormState((prev) => ({ ...prev, isSubmitting: false }))
      }
    },
    [formState.data, validateForm, onSubmit, meter]
  )

  /**
   * 取消操作处理
   */
  const handleCancel = useCallback(() => {
    if (formState.isDirty) {
      // 可以在这里添加确认对话框
      const confirmed = window.confirm('表单内容已修改，确定要取消吗？')
      if (!confirmed) return
    }
    onCancel()
  }, [formState.isDirty, onCancel])

  // 计算是否禁用表单
  const isDisabled = loading || formState.isSubmitting

  /**
   * 渲染字段错误信息
   */
  const renderFieldError = (field: string) => {
    const error = formState.errors[field]
    const touched = formState.touched[field]

    if (!error || !touched) return null

    return (
      <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
        <AlertCircle className="h-3 w-3" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 仪表类型选择 */}
      <div className="space-y-2">
        <Label htmlFor="meterType" className="text-sm font-medium">
          仪表类型 <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formState.data.meterType}
          onValueChange={handleMeterTypeChange}
          disabled={isDisabled}
        >
          <SelectTrigger
            className={cn(
              'w-full',
              formState.errors.meterType &&
                formState.touched.meterType &&
                'border-red-500'
            )}
          >
            <SelectValue placeholder="请选择仪表类型" />
          </SelectTrigger>
          <SelectContent>
            {METER_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {renderFieldError('meterType')}
      </div>

      {/* 显示名称 */}
      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-sm font-medium">
          显示名称 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="displayName"
          value={formState.data.displayName}
          onChange={(e) => updateField('displayName', e.target.value)}
          placeholder="如：电表-客厅、冷水表1"
          disabled={isDisabled}
          className={cn(
            formState.errors.displayName &&
              formState.touched.displayName &&
              'border-red-500'
          )}
        />
        {renderFieldError('displayName')}
      </div>

      {/* 计量单位和单价设置 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="unit" className="text-sm font-medium">
            计量单位 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="unit"
            value={formState.data.unit}
            onChange={(e) => updateField('unit', e.target.value)}
            placeholder="度、吨、立方米"
            disabled={isDisabled}
            className={cn(
              formState.errors.unit &&
                formState.touched.unit &&
                'border-red-500'
            )}
          />
          {renderFieldError('unit')}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitPrice" className="text-sm font-medium">
            单价设置 <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              value={formState.data.unitPrice}
              onChange={(e) =>
                updateField('unitPrice', parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              disabled={isDisabled}
              className={cn(
                'pr-16',
                formState.errors.unitPrice &&
                  formState.touched.unitPrice &&
                  'border-red-500'
              )}
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">
              元/{formState.data.unit || '单位'}
            </span>
          </div>
          {renderFieldError('unitPrice')}
        </div>
      </div>

      {/* 安装位置 */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm font-medium">
          安装位置
        </Label>
        <Input
          id="location"
          value={formState.data.location}
          onChange={(e) => updateField('location', e.target.value)}
          placeholder="如：客厅配电箱、厨房水表井"
          disabled={isDisabled}
          className={cn(
            formState.errors.location &&
              formState.touched.location &&
              'border-red-500'
          )}
        />
        {renderFieldError('location')}
      </div>

      {/* 安装日期 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">安装日期</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !formState.data.installDate && 'text-muted-foreground'
              )}
              disabled={isDisabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formState.data.installDate ? (
                format(formState.data.installDate, 'PPP', { locale: zhCN })
              ) : (
                <span>选择安装日期</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formState.data.installDate}
              onSelect={(date) => updateField('installDate', date)}
              disabled={(date: Date) =>
                date > new Date() || date < new Date('1900-01-01')
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 备注信息 */}
      <div className="space-y-2">
        <Label htmlFor="remarks" className="text-sm font-medium">
          备注信息
        </Label>
        <Textarea
          id="remarks"
          value={formState.data.remarks}
          onChange={(e) => updateField('remarks', e.target.value)}
          placeholder="如：主电表，负责客厅和卧室照明"
          rows={3}
          disabled={isDisabled}
          className={cn(
            formState.errors.remarks &&
              formState.touched.remarks &&
              'border-red-500'
          )}
        />
        {renderFieldError('remarks')}
        <div className="text-right text-xs text-gray-500">
          {formState.data.remarks?.length || 0}/200
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isDisabled}
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={
            isDisabled ||
            (Object.keys(formState.errors).length > 0 && formState.isDirty)
          }
          title={
            isDisabled
              ? '表单正在提交中...'
              : Object.keys(formState.errors).length > 0 && formState.isDirty
                ? `表单有错误: ${Object.values(formState.errors).join(', ')}`
                : '点击添加仪表'
          }
        >
          {formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {meter ? '更新仪表' : '添加仪表'}
        </Button>
      </div>
    </form>
  )
}
