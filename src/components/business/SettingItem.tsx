'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * 设置项类型定义
 */
export interface SettingItemConfig {
  id: string
  title: string
  description?: string
  type: 'input' | 'select' | 'switch' | 'button' | 'info'
  value?: any
  options?: { label: string; value: any }[]
  unit?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  action?: () => void
  disabled?: boolean
}

interface SettingItemProps {
  config: SettingItemConfig
  onValueChange?: (id: string, value: any) => void
  className?: string
}

/**
 * 输入框设置项
 */
function InputSettingItem({ config, onValueChange }: SettingItemProps) {
  const [value, setValue] = useState(config.value || '')
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    const numericValue =
      config.type === 'input' && typeof config.value === 'number'
        ? parseFloat(value) || 0
        : value

    onValueChange?.(config.id, numericValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setValue(config.value || '')
    setIsEditing(false)
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{config.title}</div>
        {config.description && (
          <div className="mt-1 text-sm text-gray-500">{config.description}</div>
        )}
      </div>

      <div className="ml-4 flex items-center gap-2">
        {isEditing ? (
          <>
            <Input
              type={typeof config.value === 'number' ? 'number' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={config.placeholder}
              min={config.min}
              max={config.max}
              step={config.step}
              className="h-8 w-24 text-sm"
            />
            {config.unit && (
              <span className="text-sm text-gray-500">{config.unit}</span>
            )}
            <Button size="sm" onClick={handleSave} className="h-8 px-2">
              保存
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-8 px-2"
            >
              取消
            </Button>
          </>
        ) : (
          <>
            <span className="min-w-[60px] text-right text-sm text-gray-900">
              {config.value}
              {config.unit && (
                <span className="ml-1 text-gray-500">{config.unit}</span>
              )}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setValue(config.value || '')
                setIsEditing(true)
              }}
              disabled={config.disabled}
              className="h-8 px-2"
            >
              编辑
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * 选择器设置项
 */
function SelectSettingItem({ config, onValueChange }: SettingItemProps) {
  const currentOption = config.options?.find(
    (opt) => opt.value === config.value
  )

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{config.title}</div>
        {config.description && (
          <div className="mt-1 text-sm text-gray-500">{config.description}</div>
        )}
      </div>

      <div className="ml-4">
        <select
          value={config.value}
          onChange={(e) => onValueChange?.(config.id, e.target.value)}
          disabled={config.disabled}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          {config.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

/**
 * 开关设置项
 */
function SwitchSettingItem({ config, onValueChange }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{config.title}</div>
        {config.description && (
          <div className="mt-1 text-sm text-gray-500">{config.description}</div>
        )}
      </div>

      <div className="ml-4">
        <button
          onClick={() => onValueChange?.(config.id, !config.value)}
          disabled={config.disabled}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
            config.value ? 'bg-blue-600' : 'bg-gray-200'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              config.value ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>
    </div>
  )
}

/**
 * 按钮设置项
 */
function ButtonSettingItem({ config }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{config.title}</div>
        {config.description && (
          <div className="mt-1 text-sm text-gray-500">{config.description}</div>
        )}
      </div>

      <div className="ml-4">
        <Button
          size="sm"
          variant="outline"
          onClick={config.action}
          disabled={config.disabled}
        >
          执行
        </Button>
      </div>
    </div>
  )
}

/**
 * 信息显示设置项
 */
function InfoSettingItem({ config }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{config.title}</div>
        {config.description && (
          <div className="mt-1 text-sm text-gray-500">{config.description}</div>
        )}
      </div>

      <div className="ml-4">
        <span className="text-sm text-gray-600">{config.value}</span>
      </div>
    </div>
  )
}

/**
 * 设置项组件
 * 根据配置类型渲染不同的设置项
 */
export function SettingItem({
  config,
  onValueChange,
  className,
}: SettingItemProps) {
  const renderSettingItem = () => {
    switch (config.type) {
      case 'input':
        return (
          <InputSettingItem config={config} onValueChange={onValueChange} />
        )
      case 'select':
        return (
          <SelectSettingItem config={config} onValueChange={onValueChange} />
        )
      case 'switch':
        return (
          <SwitchSettingItem config={config} onValueChange={onValueChange} />
        )
      case 'button':
        return (
          <ButtonSettingItem config={config} onValueChange={onValueChange} />
        )
      case 'info':
        return <InfoSettingItem config={config} onValueChange={onValueChange} />
      default:
        return null
    }
  }

  return (
    <div
      className={cn('border-b border-gray-100 py-4 last:border-b-0', className)}
    >
      {renderSettingItem()}
    </div>
  )
}

/**
 * 设置分类组件
 */
interface SettingCategoryProps {
  title: string
  items: SettingItemConfig[]
  onValueChange?: (id: string, value: any) => void
  className?: string
}

export function SettingCategory({
  title,
  items,
  onValueChange,
  className,
}: SettingCategoryProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
        <div className="space-y-0">
          {items.map((item) => (
            <SettingItem
              key={item.id}
              config={item}
              onValueChange={onValueChange}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
