'use client'

import { useEffect, useState } from 'react'

import type {
  BillFormData,
  BillType,
  ContractWithDetailsForClient,
} from '@/types/database'
import { billCreateMobileStyles } from '@/components/business/bill-create-mobile-styles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  MobileForm,
  MobileFormActions,
  MobileInput,
  MobileTextarea,
} from '@/components/ui/mobile-form'

import { AmountCalculator } from './AmountCalculator'
import { PeriodSelector } from './PeriodSelector'

interface BillInfoFormProps {
  billType: BillType
  contract: ContractWithDetailsForClient
  onCancel: () => void
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
  onCancel,
  onSubmit,
  isSubmitting,
}: BillInfoFormProps) {
  const isBeforeToday = (date: Date) => {
    const candidate = new Date(date)
    candidate.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return candidate < today
  }

  const [formData, setFormData] = useState<BillFormData>({
    billNumber: '',
    amount: 0,
    dueDate: new Date(),
    period: '',
    itemLabel: '',
    remarks: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 自动生成账单编号
  useEffect(() => {
    const generateBillNumber = (
      type: string,
      contractNumber: string
    ): string => {
      const timestamp = Date.now().toString().slice(-6)
      const typePrefix =
        {
          RENT: 'R',
          DEPOSIT: 'D',
          UTILITIES: 'U',
          OTHER: 'O',
        }[type] || 'B'

      return `BILL${contractNumber.slice(-3)}${typePrefix}${timestamp}`
    }

    const billNumber = generateBillNumber(billType, contract.contractNumber)
    setFormData((prev) => ({ ...prev, billNumber }))
  }, [billType, contract.contractNumber])

  useEffect(() => {
    if (billType !== 'OTHER' && formData.itemLabel) {
      setFormData((prev) => ({
        ...prev,
        itemLabel: '',
      }))
    }
  }, [billType, formData.itemLabel])

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

    if (billType === 'OTHER' && !formData.itemLabel.trim()) {
      newErrors.itemLabel = '其他账单必须填写条目名'
    }

    if (isBeforeToday(formData.dueDate)) {
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
    <Card className={billCreateMobileStyles.card}>
      <CardHeader className={billCreateMobileStyles.cardHeader}>
        <CardTitle className={billCreateMobileStyles.cardTitle}>
          账单信息
        </CardTitle>
        <p className={billCreateMobileStyles.cardDescription}>
          填写账单的详细信息，带 * 的字段为必填项
        </p>
      </CardHeader>
      <CardContent className={billCreateMobileStyles.cardContent}>
        <MobileForm onSubmit={handleSubmit} className={billCreateMobileStyles.form}>
          {/* 账单编号 */}
          <MobileInput
            label="账单编号"
            value={formData.billNumber}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                billNumber: e.target.value,
              }))
            }
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
            onChange={(amount: number) =>
              setFormData((prev) => ({ ...prev, amount }))
            }
            error={errors.amount}
          />

          {/* 周期选择器 */}
          <PeriodSelector
            billType={billType}
            contract={contract}
            value={formData.period}
            dueDate={formData.dueDate}
            onPeriodChange={(period: string, dueDate: Date) =>
              setFormData((prev) => ({ ...prev, period, dueDate }))
            }
            error={errors.period}
            dueDateError={errors.dueDate}
          />

          {billType === 'OTHER' && (
            <MobileInput
              label="条目名"
              value={formData.itemLabel}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  itemLabel: e.target.value,
                }))
              }
              error={errors.itemLabel}
              required
              placeholder="例如：钥匙押金、卫生费、维修费"
              description="用于展示其他账单的具体收费项目，不会改变正式账单类型。"
            />
          )}

          {/* 备注 */}
          <MobileTextarea
            label="备注"
            value={formData.remarks}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                remarks: e.target.value,
              }))
            }
            placeholder="请输入备注信息（可选）"
            description="可以记录费用产生的原因、特殊说明等"
            rows={3}
          />

          {/* 提交按钮 */}
          <MobileFormActions className={billCreateMobileStyles.actionRow}>
            <Button
              type="button"
              variant="outline"
              className={billCreateMobileStyles.actionButton}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              className={billCreateMobileStyles.actionButton}
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
