'use client'

import { Home, Plus, Receipt, Zap } from 'lucide-react'

import type { BillType, ContractWithDetailsForClient } from '@/types/database'
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
  contract: ContractWithDetailsForClient
}

/**
 * 账单类型选择器组件
 * 提供四种账单类型的选择
 */
export function BillTypeSelector({
  selectedType,
  onTypeChange,
  contract,
}: BillTypeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">选择账单类型</CardTitle>
        <p className="text-sm text-gray-600">
          选择要创建的账单类型，系统会根据类型提供相应的计算和填写辅助
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.entries(billTypeConfig).map(([type, config]) => {
            const Icon = config.icon
            const isSelected = selectedType === type

            return (
              <Button
                key={type}
                variant={isSelected ? 'default' : 'outline'}
                className={`h-auto justify-start p-4 ${
                  isSelected ? '' : config.color
                }`}
                onClick={() => onTypeChange(type as BillType)}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs opacity-75">
                      {config.description}
                    </div>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>

        {/* 类型说明 */}
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <h4 className="mb-2 text-sm font-medium text-gray-700">使用建议</h4>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>
              • <strong>租金账单</strong>：合同期内的租金调整或补缴
            </li>
            <li>
              • <strong>押金账单</strong>：额外的押金收取或调整
            </li>
            <li>
              • <strong>水电费账单</strong>：抄表遗漏或特殊情况的水电费
            </li>
            <li>
              • <strong>其他费用</strong>：维修费、违约金等临时费用
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
