'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, X } from 'lucide-react'
import { ErrorAlert, SimpleErrorAlert } from './ErrorAlert'
import { ErrorLogger, ErrorType, ErrorSeverity } from '@/lib/error-logger'

interface RenterFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  loading?: boolean
  mode?: 'create' | 'edit'
}

export function RenterForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false,
  mode = 'create'
}: RenterFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    gender: initialData?.gender || '',
    phone: initialData?.phone || '',
    idCard: initialData?.idCard || '',
    emergencyContact: initialData?.emergencyContact || '',
    emergencyPhone: initialData?.emergencyPhone || '',
    occupation: initialData?.occupation || '',
    company: initialData?.company || '',
    moveInDate: initialData?.moveInDate ? new Date(initialData.moveInDate).toISOString().split('T')[0] : '',
    tenantCount: initialData?.tenantCount || '',
    remarks: initialData?.remarks || ''
  })
  
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // 清除错误状态
    if (error) {
      setError(null)
    }
  }
  
  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return '请输入租客姓名'
    }
    
    if (!formData.phone.trim()) {
      return '请输入手机号'
    }
    
    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(formData.phone)) {
      return '请输入正确的手机号格式'
    }
    
    // 身份证号格式验证（如果填写了）
    if (formData.idCard && formData.idCard.length !== 18) {
      return '请输入正确的身份证号格式'
    }
    
    return null
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 数据验证
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      // 准备提交数据
      const submitData = {
        ...formData,
        moveInDate: formData.moveInDate ? new Date(formData.moveInDate) : null,
        tenantCount: formData.tenantCount ? parseInt(formData.tenantCount) : null
      }
      
      await onSubmit(submitData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提交失败，请重试'
      setError(errorMessage)
      
      // 记录错误日志
      const logger = ErrorLogger.getInstance()
      await logger.logError(
        ErrorType.VALIDATION_ERROR,
        ErrorSeverity.MEDIUM,
        `租客表单提交失败: ${errorMessage}`,
        {
          module: 'RenterForm',
          function: 'handleSubmit',
          formData: { ...formData, idCard: '***' } // 脱敏处理
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
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* 错误提示 */}
        {error && (
          <SimpleErrorAlert
            title="表单验证失败"
            message={error}
            onRetry={handleRetry}
          />
        )}
        
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="请输入租客姓名"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="gender">性别</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择性别</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="phone">手机号 *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="请输入手机号"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="idCard">身份证号</Label>
                <Input
                  id="idCard"
                  value={formData.idCard}
                  onChange={(e) => handleChange('idCard', e.target.value)}
                  placeholder="请输入身份证号"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 联系信息 */}
        <Card>
          <CardHeader>
            <CardTitle>紧急联系人</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContact">联系人姓名</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => handleChange('emergencyContact', e.target.value)}
                  placeholder="请输入紧急联系人姓名"
                />
              </div>
              
              <div>
                <Label htmlFor="emergencyPhone">联系人电话</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                  placeholder="请输入紧急联系人电话"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 职业信息 */}
        <Card>
          <CardHeader>
            <CardTitle>职业信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="occupation">职业</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleChange('occupation', e.target.value)}
                  placeholder="请输入职业"
                />
              </div>
              
              <div>
                <Label htmlFor="company">公司名称</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="请输入公司名称"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 入住信息 */}
        <Card>
          <CardHeader>
            <CardTitle>入住信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="moveInDate">入住日期</Label>
                <Input
                  id="moveInDate"
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => handleChange('moveInDate', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="tenantCount">入住人数</Label>
                <Input
                  id="tenantCount"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.tenantCount}
                  onChange={(e) => handleChange('tenantCount', e.target.value)}
                  placeholder="请输入入住人数"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 备注信息 */}
        <Card>
          <CardHeader>
            <CardTitle>备注信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="remarks">备注</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                placeholder="请输入备注信息"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* 操作按钮 */}
        <div className="flex space-x-4">
          <Button
            type="submit"
            disabled={loading || isSubmitting}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {(loading || isSubmitting) ? '保存中...' : (mode === 'edit' ? '保存修改' : '创建租客')}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading || isSubmitting}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            取消
          </Button>
        </div>
      </div>
    </form>
  )
}