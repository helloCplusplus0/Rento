import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface FormField {
  id: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'select' | 'date' | 'tags'
  placeholder?: string
  required?: boolean
  description?: string
  options?: { value: string; label: string }[]
  validation?: (value: any) => string | null
}

interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
}

interface AdvancedFormProps {
  sections: FormSection[]
  onSubmit: (data: Record<string, any>) => void
  onCancel?: () => void
  submitText?: string
  cancelText?: string
  className?: string
}

/**
 * 高级表单组件
 * 支持分组、多字段类型、验证等生产级功能
 */
export function AdvancedForm({
  sections,
  onSubmit,
  onCancel,
  submitText = '保存',
  cancelText = '取消',
  className
}: AdvancedFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    
    // 清除该字段的错误
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    sections.forEach(section => {
      section.fields.forEach(field => {
        const value = formData[field.id]
        
        // 必填验证
        if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
          newErrors[field.id] = `${field.label}不能为空`
          return
        }
        
        // 自定义验证
        if (field.validation && value) {
          const error = field.validation(value)
          if (error) {
            newErrors[field.id] = error
          }
        }
      })
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {sections.map((section, sectionIndex) => (
        <Card key={section.id}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{section.title}</CardTitle>
            {section.description && (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map((field, fieldIndex) => (
              <FormFieldRenderer
                key={field.id}
                field={field}
                value={formData[field.id]}
                error={errors[field.id]}
                onChange={(value) => handleFieldChange(field.id, value)}
              />
            ))}
            {sectionIndex < sections.length - 1 && (
              <Separator className="mt-6" />
            )}
          </CardContent>
        </Card>
      ))}
      
      {/* 表单操作按钮 */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            {cancelText}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? '保存中...' : submitText}
        </Button>
      </div>
    </form>
  )
}

/**
 * 表单字段渲染器
 */
function FormFieldRenderer({
  field,
  value,
  error,
  onChange
}: {
  field: FormField
  value: any
  error?: string
  onChange: (value: any) => void
}) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'h-12 text-base',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
        )
      
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className={cn(
              'text-base resize-none',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
        )
      
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
          >
            <option value="">{field.placeholder || '请选择'}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'h-12 text-base',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
        )
      
      case 'tags':
        return (
          <TagsInput
            value={value || []}
            onChange={onChange}
            placeholder={field.placeholder}
            error={!!error}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {field.description && !error && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

/**
 * 标签输入组件
 */
function TagsInput({
  value = [],
  onChange,
  placeholder,
  error
}: {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  error?: boolean
}) {
  const [inputValue, setInputValue] = useState('')

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag])
    }
    setInputValue('')
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className={cn(
      'flex flex-wrap gap-2 p-3 border rounded-md bg-background min-h-[48px]',
      'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
      error && 'border-red-500 focus-within:ring-red-500'
    )}>
      {value.map(tag => (
        <Badge
          key={tag}
          variant="secondary"
          className="px-2 py-1 text-sm cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => removeTag(tag)}
        >
          {tag}
          <span className="ml-1 text-xs">×</span>
        </Badge>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputValue && addTag(inputValue)}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-base placeholder:text-muted-foreground"
      />
    </div>
  )
}

/**
 * 预定义的表单配置示例
 */
export const sampleFormSections: FormSection[] = [
  {
    id: 'basic-info',
    title: '基本信息',
    description: '请填写租客的基本信息',
    fields: [
      {
        id: 'name',
        label: '姓名',
        type: 'text',
        placeholder: '请输入姓名',
        required: true
      },
      {
        id: 'phone',
        label: '手机号',
        type: 'text',
        placeholder: '请输入手机号',
        required: true,
        validation: (value) => {
          const phoneRegex = /^1[3-9]\d{9}$/
          return phoneRegex.test(value) ? null : '请输入正确的手机号'
        }
      },
      {
        id: 'idCard',
        label: '身份证号',
        type: 'text',
        placeholder: '请输入身份证号'
      }
    ]
  },
  {
    id: 'contact-info',
    title: '联系信息',
    fields: [
      {
        id: 'emergencyContact',
        label: '紧急联系人',
        type: 'text',
        placeholder: '请输入紧急联系人姓名'
      },
      {
        id: 'emergencyPhone',
        label: '紧急联系人电话',
        type: 'text',
        placeholder: '请输入紧急联系人电话'
      },
      {
        id: 'occupation',
        label: '职业',
        type: 'text',
        placeholder: '请输入职业'
      }
    ]
  },
  {
    id: 'rental-info',
    title: '租赁信息',
    fields: [
      {
        id: 'moveInDate',
        label: '入住日期',
        type: 'date',
        required: true
      },
      {
        id: 'tenantCount',
        label: '入住人数',
        type: 'number',
        placeholder: '请输入入住人数'
      },
      {
        id: 'remarks',
        label: '备注',
        type: 'textarea',
        placeholder: '请输入备注信息',
        description: '可填写特殊要求或其他说明'
      }
    ]
  }
]