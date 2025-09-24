'use client'

import { useState, useEffect } from 'react'
import { MobileFormField } from '@/components/ui/mobile-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import type { BillType, ContractWithDetailsForClient } from '@/types/database'

interface PeriodSelectorProps {
  billType: BillType
  contract: ContractWithDetailsForClient
  value: string
  dueDate: Date
  onPeriodChange: (period: string, dueDate: Date) => void
  error?: string
  dueDateError?: string
}

/**
 * 周期选择器组件
 * 根据账单类型智能生成账单周期和到期日期
 */
export function PeriodSelector({ 
  billType, 
  contract, 
  value,
  dueDate,
  onPeriodChange, 
  error,
  dueDateError
}: PeriodSelectorProps) {
  const [period, setPeriod] = useState(value)
  const [dueDateStr, setDueDateStr] = useState(dueDate.toISOString().split('T')[0])

  // 同步外部值变化
  useEffect(() => {
    setPeriod(value)
  }, [value])

  useEffect(() => {
    setDueDateStr(dueDate.toISOString().split('T')[0])
  }, [dueDate])

  // 自动生成周期
  const generatePeriod = () => {
    const now = new Date()
    let periodStr = ''
    let dueDateObj = new Date()

    switch (billType) {
      case 'RENT':
        // 租金账单：当月周期
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        const nextMonth = month === 12 ? 1 : month + 1
        const nextYear = month === 12 ? year + 1 : year
        
        periodStr = `${year}年${month}月1日 至 ${year}年${month}月${new Date(year, month, 0).getDate()}日`
        dueDateObj = new Date(nextYear, nextMonth - 1, 15) // 下月15日到期
        break
        
      case 'UTILITIES':
        // 水电费：上月周期
        const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth()
        const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        const lastMonthEnd = new Date(lastYear, lastMonth, 0).getDate()
        
        periodStr = `${lastYear}年${lastMonth}月1日 至 ${lastYear}年${lastMonth}月${lastMonthEnd}日`
        dueDateObj = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) // 10天后到期
        break
        
      case 'DEPOSIT':
        // 押金：合同期间
        periodStr = `${contract.startDate.toISOString().slice(0, 10)} 至 ${contract.endDate.toISOString().slice(0, 10)}`
        dueDateObj = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7天后到期
        break
        
      default:
        // 其他类型：当前日期
        periodStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
        dueDateObj = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30天后到期
        break
    }

    setPeriod(periodStr)
    setDueDateStr(dueDateObj.toISOString().split('T')[0])
    onPeriodChange(periodStr, dueDateObj)
  }

  // 手动更新周期
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
    const dueDateObj = new Date(dueDateStr)
    onPeriodChange(newPeriod, dueDateObj)
  }

  // 手动更新到期日期
  const handleDueDateChange = (newDueDate: string) => {
    setDueDateStr(newDueDate)
    const dueDateObj = new Date(newDueDate)
    onPeriodChange(period, dueDateObj)
  }

  return (
    <div className="space-y-4">
      <MobileFormField 
        label="账单周期" 
        required 
        error={error}
        description="账单对应的服务周期"
      >
        <div className="space-y-3">
          <Input
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            placeholder="请输入账单周期"
          />
          <Button 
            type="button"
            variant="outline" 
            size="sm"
            onClick={generatePeriod}
          >
            <Calendar className="w-4 h-4 mr-2" />
            自动生成周期
          </Button>
        </div>
      </MobileFormField>

      <MobileFormField 
        label="到期日期" 
        required
        error={dueDateError}
        description="账单的付款截止日期"
      >
        <Input
          type="date"
          value={dueDateStr}
          onChange={(e) => handleDueDateChange(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </MobileFormField>
    </div>
  )
}