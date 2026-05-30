'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { settingsMobileStyles } from '@/components/business/settings-mobile-styles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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
  const [value, setValue] = useState(String(config.value ?? ''))
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValue(String(config.value ?? ''))
    setIsEditing(false)
    setError(null)
  }, [config.value])

  const handleSave = () => {
    const trimmedValue = value.trim()

    if (typeof config.value === 'number') {
      if (trimmedValue === '') {
        setError('请输入有效数值')
        return
      }

      const numericValue = Number(trimmedValue)

      if (Number.isNaN(numericValue)) {
        setError('请输入有效数值')
        return
      }

      if (config.min !== undefined && numericValue < config.min) {
        setError(`数值不能小于 ${config.min}`)
        return
      }

      if (config.max !== undefined && numericValue > config.max) {
        setError(`数值不能大于 ${config.max}`)
        return
      }

      onValueChange?.(config.id, numericValue)
    } else {
      if (trimmedValue === '') {
        setError('请输入有效内容')
        return
      }

      onValueChange?.(config.id, trimmedValue)
    }

    setError(null)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setValue(String(config.value ?? ''))
    setIsEditing(false)
    setError(null)
  }

  return (
    <div className="space-y-1.5">
      <div className={settingsMobileStyles.itemRow}>
        <div className={settingsMobileStyles.itemMain}>
          <div className={settingsMobileStyles.itemTitle}>{config.title}</div>
          {config.description && (
            <div className={settingsMobileStyles.itemDescription}>
              {config.description}
            </div>
          )}
        </div>

        <div className={settingsMobileStyles.itemControlRow}>
          {isEditing ? (
            <>
              <Input
                type={typeof config.value === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  if (error) {
                    setError(null)
                  }
                }}
                placeholder={config.placeholder}
                min={config.min}
                max={config.max}
                step={config.step}
                className={settingsMobileStyles.inlineInput}
              />
              {config.unit && (
                <span className={settingsMobileStyles.itemUnit}>{config.unit}</span>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                className={settingsMobileStyles.inlineButton}
              >
                保存
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className={settingsMobileStyles.inlineButton}
              >
                取消
              </Button>
            </>
          ) : (
            <>
              <span className={settingsMobileStyles.itemValue}>
                {config.value}
                {config.unit && (
                  <span className={settingsMobileStyles.itemUnit}>{config.unit}</span>
                )}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setValue(String(config.value ?? ''))
                  setIsEditing(true)
                }}
                disabled={config.disabled}
                className={settingsMobileStyles.inlineButton}
              >
                编辑
              </Button>
            </>
          )}
        </div>
      </div>
      {error && <div className={settingsMobileStyles.inlineError}>{error}</div>}
    </div>
  )
}

/**
 * 选择器设置项
 */
function SelectSettingItem({ config, onValueChange }: SettingItemProps) {
  return (
    <div className={settingsMobileStyles.itemRow}>
      <div className={settingsMobileStyles.itemMain}>
        <div className={settingsMobileStyles.itemTitle}>{config.title}</div>
        {config.description && (
          <div className={settingsMobileStyles.itemDescription}>
            {config.description}
          </div>
        )}
      </div>

      <div className={settingsMobileStyles.inlineSelectWrap}>
        <select
          value={config.value}
          onChange={(e) => onValueChange?.(config.id, e.target.value)}
          disabled={config.disabled}
          className={settingsMobileStyles.inlineSelect}
        >
          {config.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className={settingsMobileStyles.inlineSelectIcon} />
      </div>
    </div>
  )
}

/**
 * 开关设置项
 */
function SwitchSettingItem({ config, onValueChange }: SettingItemProps) {
  return (
    <div className={settingsMobileStyles.itemRow}>
      <div className={settingsMobileStyles.itemMain}>
        <div className={settingsMobileStyles.itemTitle}>{config.title}</div>
        {config.description && (
          <div className={settingsMobileStyles.itemDescription}>
            {config.description}
          </div>
        )}
      </div>

      <div className={settingsMobileStyles.itemControlRow}>
        <button
          onClick={() => onValueChange?.(config.id, !config.value)}
          disabled={config.disabled}
          type="button"
          role="switch"
          aria-checked={Boolean(config.value)}
          aria-label={config.title}
          className={cn(
            settingsMobileStyles.switchButton,
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
    <div className={settingsMobileStyles.itemRow}>
      <div className={settingsMobileStyles.itemMain}>
        <div className={settingsMobileStyles.itemTitle}>{config.title}</div>
        {config.description && (
          <div className={settingsMobileStyles.itemDescription}>
            {config.description}
          </div>
        )}
      </div>

      <div className={settingsMobileStyles.itemControlRow}>
        <Button
          size="sm"
          variant="outline"
          onClick={config.action}
          disabled={config.disabled}
          className={settingsMobileStyles.inlineButton}
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
    <div className={settingsMobileStyles.itemRow}>
      <div className={settingsMobileStyles.itemMain}>
        <div className={settingsMobileStyles.itemTitle}>{config.title}</div>
        {config.description && (
          <div className={settingsMobileStyles.itemDescription}>
            {config.description}
          </div>
        )}
      </div>

      <div className={settingsMobileStyles.itemControlRow}>
        <span className={settingsMobileStyles.itemValueMuted}>{config.value}</span>
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
      className={cn(settingsMobileStyles.item, className)}
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
    <Card className={cn(settingsMobileStyles.card, className)}>
      <CardHeader className={settingsMobileStyles.cardHeader}>
        <CardTitle className={settingsMobileStyles.cardTitle}>{title}</CardTitle>
      </CardHeader>
      <CardContent className={settingsMobileStyles.cardContent}>
        <div className={settingsMobileStyles.itemList}>
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
