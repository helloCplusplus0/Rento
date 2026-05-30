'use client'

import { Home, Plus, Receipt, Zap } from 'lucide-react'

import type { BillType } from '@/types/database'
import { billCreateMobileStyles } from '@/components/business/bill-create-mobile-styles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const billTypeConfig = {
  RENT: {
    label: '租金账单',
    icon: Home,
    description: '基于合同租金生成',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  DEPOSIT: {
    label: '押金账单',
    icon: Receipt,
    description: '基于合同押金信息',
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  UTILITIES: {
    label: '水电费账单',
    icon: Zap,
    description: '基于用量计算费用',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  OTHER: {
    label: '其他费用',
    icon: Plus,
    description: '临时费用或特殊收费',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
}

interface BillTypeSelectorProps {
  selectedType: BillType
  onTypeChange: (type: BillType) => void
}

/**
 * 账单类型选择器组件
 * 提供四种账单类型的选择
 */
export function BillTypeSelector({
  selectedType,
  onTypeChange,
}: BillTypeSelectorProps) {
  return (
    <Card className={billCreateMobileStyles.card}>
      <CardHeader className={billCreateMobileStyles.cardHeader}>
        <CardTitle className={billCreateMobileStyles.cardTitle}>
          选择账单类型
        </CardTitle>
        <p className={billCreateMobileStyles.cardDescription}>
          选择要创建的账单类型，系统会根据类型提供相应的计算和填写辅助
        </p>
      </CardHeader>
      <CardContent className={billCreateMobileStyles.cardContent}>
        <div className={billCreateMobileStyles.typeGrid}>
          {Object.entries(billTypeConfig).map(([type, config]) => {
            const Icon = config.icon
            const isSelected = selectedType === type

            return (
              <Button
                key={type}
                variant={isSelected ? 'default' : 'outline'}
                className={`${billCreateMobileStyles.typeButton} ${
                  isSelected
                    ? billCreateMobileStyles.typeButtonActive
                    : config.color
                }`}
                onClick={() => onTypeChange(type as BillType)}
              >
                <div className={billCreateMobileStyles.typeButtonBody}>
                  <Icon className={billCreateMobileStyles.typeButtonIcon} />
                  <div className={billCreateMobileStyles.typeButtonText}>
                    <div className={billCreateMobileStyles.typeButtonTitle}>
                      {config.label}
                    </div>
                    <div
                      className={billCreateMobileStyles.typeButtonDescription}
                    >
                      {config.description}
                    </div>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
