'use client'

import { useState } from 'react'
import { Calculator } from 'lucide-react'

import type { BillType, ContractWithDetailsForClient } from '@/types/database'
import { calculateUtilityBillSync } from '@/lib/bill-calculations'
import { formatCurrency } from '@/lib/format'
import { getSettings } from '@/hooks/useSettings'
import { billCreateMobileStyles } from '@/components/business/bill-create-mobile-styles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MobileFormField } from '@/components/ui/mobile-form'

interface AmountCalculatorProps {
  billType: BillType
  contract: ContractWithDetailsForClient
  value: number
  onChange: (amount: number) => void
  error?: string
}

/**
 * 金额计算器组件
 * 根据账单类型提供不同的计算方式
 */
export function AmountCalculator({
  billType,
  contract,
  value,
  onChange,
  error,
}: AmountCalculatorProps) {
  const [utilityData, setUtilityData] = useState({
    electricityUsage: 0,
    waterUsage: 0,
  })

  // 自动计算逻辑
  const handleAutoCalculate = () => {
    switch (billType) {
      case 'RENT':
        // 基于合同月租金
        onChange(contract.monthlyRent)
        break

      case 'DEPOSIT':
        // 基于合同押金
        onChange(contract.deposit)
        break

      case 'UTILITIES':
        // 基于用量计算
        const result = calculateUtilityBillSync(
          utilityData.electricityUsage,
          utilityData.waterUsage
        )
        onChange(result.totalCost)
        break

      default:
        // OTHER类型需要手动输入
        break
    }
  }

  // 渲染不同类型的计算界面
  const renderCalculator = () => {
    switch (billType) {
      case 'RENT':
        return (
          <div className={billCreateMobileStyles.helperBox}>
            <div className={billCreateMobileStyles.helperText}>
              基于合同月租金: {formatCurrency(contract.monthlyRent)}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoCalculate}
              className="mt-2 h-8 px-3 text-sm"
            >
              <Calculator className="mr-2 h-4 w-4" />
              使用合同租金
            </Button>
          </div>
        )

      case 'DEPOSIT':
        return (
          <div className="rounded-lg border border-green-200 bg-green-50 p-2.5">
            <div className="text-sm leading-5 text-green-700">
              基于合同押金: {formatCurrency(contract.deposit)}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoCalculate}
              className="mt-2 h-8 px-3 text-sm"
            >
              <Calculator className="mr-2 h-4 w-4" />
              使用合同押金
            </Button>
          </div>
        )

      case 'UTILITIES':
        const settings = getSettings()
        return (
          <div className="space-y-2.5 rounded-lg border border-orange-200 bg-orange-50 p-2.5">
            <div className="text-sm leading-5 text-orange-700">
              水电费计算 (电费: {settings.electricityPrice}元/度, 水费:{' '}
              {settings.waterPrice}元/吨)
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Input
                type="number"
                placeholder="用电量(度)"
                value={utilityData.electricityUsage || ''}
                onChange={(e) =>
                  setUtilityData((prev) => ({
                    ...prev,
                    electricityUsage: Number(e.target.value) || 0,
                  }))
                }
                className="h-10 text-sm placeholder:text-sm"
              />
              <Input
                type="number"
                placeholder="用水量(吨)"
                value={utilityData.waterUsage || ''}
                onChange={(e) =>
                  setUtilityData((prev) => ({
                    ...prev,
                    waterUsage: Number(e.target.value) || 0,
                  }))
                }
                className="h-10 text-sm placeholder:text-sm"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoCalculate}
              className="h-8 w-full text-sm"
            >
              <Calculator className="mr-2 h-4 w-4" />
              计算水电费
            </Button>
          </div>
        )

      default:
        return (
          <div className="rounded-lg bg-gray-50 p-2.5">
            <div className="text-sm leading-5 text-gray-600">
              其他费用需要手动输入金额
            </div>
          </div>
        )
    }
  }

  return (
    <MobileFormField
      label="账单金额"
      required
      error={error}
      description="可使用自动计算或手动输入"
    >
      <div className="space-y-3">
        <Input
          type="number"
          step="0.01"
          min="0"
          max="999999.99"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder="请输入金额"
          className="h-10 text-sm font-medium placeholder:text-sm sm:h-11 sm:text-base sm:placeholder:text-base"
        />
        {renderCalculator()}
      </div>
    </MobileFormField>
  )
}
