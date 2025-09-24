'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MobileForm, MobileInput, MobileTextarea, MobileFormActions } from '@/components/ui/mobile-form'
import { Button } from '@/components/ui/button'
import { AmountCalculator } from './AmountCalculator'
import { PeriodSelector } from './PeriodSelector'
import type { BillType, ContractWithDetailsForClient, BillFormData } from '@/types/database'

interface BillInfoFormProps {
  billType: BillType
  contract: ContractWithDetailsForClient
  onSubmit: (data: BillFormData) => void
  isSubmitting: boolean
}

/**
 * 账单信息表单组件
 * 提供账单信息的录入和验证
 */
export function BillInfoForm({ 
  billType, 
  contract, 
  onSubmit, 
  isSubmitting 
}: BillInfoFormProps) {
  const [formData, setFormData] = useState<BillFormData>({
    billNumber: '',
    amount: 0,
    dueDate: new Date(),
    period: '',
    remarks: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 自动生成账单编号
  useEffect(() => {
    const generateBillNumber = (type: string, contractNumber: string): string => {
      const timestamp = Date.now().toString().slice(-6)
      const typePrefix = {
        'RENT': 'R',
        'DEPOSIT': 'D', 
        'UTILITIES': 'U',
        'OTHER': 'O'
      }[type] || 'B'
      
      return `BILL${contractNumber.slice(-3)}${typePrefix}${timestamp}`
    }

    const billNumber = generateBillNumber(billType, contract.contractNumber)
    setFormData(prev => ({ ...prev, billNumber }))
  }, [billType, contract.contractNumber])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 表单验证
    const newErrors: Record<string, string> = {}
    
    if (!formData.billNumber) {
      newErrors.billNumber = '账单编号不能为空'
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = '金额必须大于0'
    }
    
    if (formData.amount > 999999.99) {
      newErrors.amount = '金额不能超过999999.99'
    }
    
    if (!formData.period) {
      newErrors.period = '账单周期不能为空'
    }
    
    if (formData.dueDate < new Date()) {
      newErrors.dueDate = '到期日期不能早于今天'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // 清除错误并提交
    setErrors({})
    onSubmit(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">账单信息</CardTitle>
        <p className="text-sm text-gray-600">
          填写账单的详细信息，带 * 的字段为必填项
        </p>
      </CardHeader>
      <CardContent>
        <MobileForm onSubmit={handleSubmit}>
          {/* 账单编号 */}
          <MobileInput
            label="账单编号"
            value={formData.billNumber}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              billNumber: e.target.value 
            }))}
            error={errors.billNumber}
            required
            placeholder="自动生成"
            description="系统自动生成，也可手动修改"
          />
          
          {/* 金额计算器 */}
          <AmountCalculator
            billType={billType}
            contract={contract}
            value={formData.amount}
            onChange={(amount: number) => setFormData(prev => ({ ...prev, amount }))}
            error={errors.amount}
          />
          
          {/* 周期选择器 */}
          <PeriodSelector
            billType={billType}
            contract={contract}
            value={formData.period}
            dueDate={formData.dueDate}
            onPeriodChange={(period: string, dueDate: Date) => 
              setFormData(prev => ({ ...prev, period, dueDate }))
            }
            error={errors.period}
            dueDateError={errors.dueDate}
          />
          
          {/* 备注 */}
          <MobileTextarea
            label="备注"
            value={formData.remarks}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              remarks: e.target.value 
            }))}
            placeholder="请输入备注信息（可选）"
            description="可以记录费用产生的原因、特殊说明等"
            rows={3}
          />
          
          {/* 提交按钮 */}
          <MobileFormActions>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '创建中...' : '创建账单'}
            </Button>
          </MobileFormActions>
        </MobileForm>
      </CardContent>
    </Card>
  )
}