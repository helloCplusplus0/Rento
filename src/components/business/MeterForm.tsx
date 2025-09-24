'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { 
  formatMeterType, 
  getDefaultUnit, 
  getDefaultUnitPriceSync,
  validateDisplayName,
  validateUnitPrice
} from '@/lib/meter-utils'
import { ErrorLogger, ErrorType, ErrorSeverity } from '@/lib/error-logger'
import type { MeterFormProps, MeterFormData, MeterType } from '@/types/meter'

/**
 * 仪表配置表单组件
 * 支持添加和编辑仪表配置
 */
export function MeterForm({
  roomId,
  meter,
  onSubmit,
  onCancel,
  loading = false
}: MeterFormProps) {
  const [formData, setFormData] = useState<MeterFormData>({
    displayName: '',
    meterType: 'ELECTRICITY',
    unitPrice: 0,
    unit: '',
    location: '',
    installDate: undefined,
    remarks: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 编辑模式时初始化表单数据
  useEffect(() => {
    if (meter) {
      setFormData({
        displayName: meter.displayName,
        meterType: meter.meterType,
        unitPrice: meter.unitPrice,
        unit: meter.unit,
        location: meter.location || '',
        installDate: meter.installDate || undefined,
        remarks: meter.remarks || ''
      })
    }
  }, [meter])

  // 仪表类型改变时自动设置默认值
  const handleMeterTypeChange = (meterType: MeterType) => {
    setFormData(prev => ({
      ...prev,
      meterType,
      unit: getDefaultUnit(meterType),
      unitPrice: getDefaultUnitPriceSync(meterType)
    }))
    
    // 清除相关错误
    setErrors(prev => ({
      ...prev,
      meterType: '',
      unit: '',
      unitPrice: ''
    }))
  }

  // 表单字段变更处理
  const handleFieldChange = (field: keyof MeterFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 显示名称验证
    if (!formData.displayName.trim()) {
      newErrors.displayName = '显示名称不能为空'
    } else if (!validateDisplayName(formData.displayName)) {
      newErrors.displayName = '显示名称格式不正确，最多50字符，支持中文、英文、数字、横线、下划线'
    }

    // 仪表类型验证
    if (!formData.meterType) {
      newErrors.meterType = '请选择仪表类型'
    }

    // 单价验证
    if (formData.unitPrice <= 0) {
      newErrors.unitPrice = '单价必须大于0'
    } else if (!validateUnitPrice(formData.unitPrice)) {
      newErrors.unitPrice = '单价范围应在0-100元之间'
    }

    // 计量单位验证
    if (!formData.unit.trim()) {
      newErrors.unit = '计量单位不能为空'
    } else if (formData.unit.length > 10) {
      newErrors.unit = '计量单位最多10个字符'
    }

    // 安装位置验证
    if (formData.location && formData.location.length > 100) {
      newErrors.location = '安装位置最多100个字符'
    }

    // 备注验证
    if (formData.remarks && formData.remarks.length > 200) {
      newErrors.remarks = '备注信息最多200个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 表单提交处理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      const logger = ErrorLogger.getInstance()
      await logger.logError(
        ErrorType.VALIDATION_ERROR,
        ErrorSeverity.MEDIUM,
        '仪表表单提交失败',
        {
          module: 'meter-form',
          function: 'handleSubmit',
          formData: JSON.stringify(formData)
        },
        error instanceof Error ? error : undefined
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled = loading || isSubmitting

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 仪表类型 */}
      <div className="space-y-2">
        <Label htmlFor="meterType">仪表类型 *</Label>
        <Select
          value={formData.meterType}
          onValueChange={handleMeterTypeChange}
          disabled={isDisabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="请选择仪表类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ELECTRICITY">⚡ {formatMeterType('ELECTRICITY')}</SelectItem>
            <SelectItem value="COLD_WATER">💧 {formatMeterType('COLD_WATER')}</SelectItem>
            <SelectItem value="HOT_WATER">🔥 {formatMeterType('HOT_WATER')}</SelectItem>
            <SelectItem value="GAS">🔥 {formatMeterType('GAS')}</SelectItem>
          </SelectContent>
        </Select>
        {errors.meterType && (
          <p className="text-sm text-red-600">{errors.meterType}</p>
        )}
      </div>

      {/* 显示名称 */}
      <div className="space-y-2">
        <Label htmlFor="displayName">显示名称 *</Label>
        <Input
          id="displayName"
          value={formData.displayName}
          onChange={(e) => handleFieldChange('displayName', e.target.value)}
          placeholder="如：电表-客厅、冷水表1"
          disabled={isDisabled}
        />
        {errors.displayName && (
          <p className="text-sm text-red-600">{errors.displayName}</p>
        )}
      </div>

      {/* 安装位置 */}
      <div className="space-y-2">
        <Label htmlFor="location">安装位置</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => handleFieldChange('location', e.target.value)}
          placeholder="如：客厅配电箱、厨房水表井"
          disabled={isDisabled}
        />
        {errors.location && (
          <p className="text-sm text-red-600">{errors.location}</p>
        )}
      </div>

      {/* 计量单位和单价 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">计量单位 *</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => handleFieldChange('unit', e.target.value)}
            placeholder="度、吨、立方米"
            disabled={isDisabled}
          />
          {errors.unit && (
            <p className="text-sm text-red-600">{errors.unit}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="unitPrice">单价设置 *</Label>
          <div className="relative">
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.unitPrice}
              onChange={(e) => handleFieldChange('unitPrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              disabled={isDisabled}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              元/{formData.unit}
            </span>
          </div>
          {errors.unitPrice && (
            <p className="text-sm text-red-600">{errors.unitPrice}</p>
          )}
        </div>
      </div>

      {/* 安装日期 */}
      <div className="space-y-2">
        <Label>安装日期</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.installDate && "text-muted-foreground"
              )}
              disabled={isDisabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.installDate ? (
                format(formData.installDate, "PPP", { locale: zhCN })
              ) : (
                <span>选择安装日期</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.installDate}
              onSelect={(date) => handleFieldChange('installDate', date)}
              disabled={(date: Date) => date > new Date() || date < new Date("1900-01-01")}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 备注信息 */}
      <div className="space-y-2">
        <Label htmlFor="remarks">备注信息</Label>
        <Textarea
          id="remarks"
          value={formData.remarks}
          onChange={(e) => handleFieldChange('remarks', e.target.value)}
          placeholder="如：主电表，负责客厅和卧室照明"
          rows={3}
          disabled={isDisabled}
        />
        {errors.remarks && (
          <p className="text-sm text-red-600">{errors.remarks}</p>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isDisabled}
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={isDisabled}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {meter ? '更新仪表' : '添加仪表'}
        </Button>
      </div>
    </form>
  )
}