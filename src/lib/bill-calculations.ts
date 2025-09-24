import { globalSettings } from './global-settings'

/**
 * 水电费计算结果 (增强版)
 */
export interface UtilityBillResult {
  electricityCost: number    // 电费
  waterCost: number         // 水费
  gasCost?: number          // 燃气费
  totalCost: number         // 总费用
  electricityUsage: number  // 用电量
  waterUsage: number       // 用水量
  gasUsage?: number        // 燃气用量
  electricityPrice: number // 电费单价
  waterPrice: number       // 水费单价
  gasPrice?: number        // 燃气单价
}

/**
 * 租金计算结果
 */
export interface RentCalculationResult {
  monthlyRent: number      // 月租金
  totalRent: number        // 总租金
  deposit: number          // 押金
  keyDeposit: number       // 钥匙押金
  cleaningFee: number      // 清洁费
  totalAmount: number      // 总金额
  paymentCycle: string     // 付款周期
}

/**
 * 计算水电费 (增强版)
 * 根据用量和单价计算费用，支持燃气费
 * 优先使用仪表单价，回退到全局设置，最后回退到硬编码默认值
 */
export async function calculateUtilityBill(
  electricityUsage: number,
  waterUsage: number,
  gasUsage: number = 0,
  meterPrices?: {
    electricityPrice?: number  // 来自仪表配置的单价
    waterPrice?: number       // 来自仪表配置的单价
    gasPrice?: number
  }
): Promise<UtilityBillResult> {
  let electricityPrice: number
  let waterPrice: number
  let gasPrice: number
  
  try {
    // 获取全局设置作为回退值
    const billingSettings = await globalSettings.getBillingSettings()
    
    // 优先使用仪表单价，回退到全局设置
    electricityPrice = meterPrices?.electricityPrice ?? billingSettings.electricityPrice
    waterPrice = meterPrices?.waterPrice ?? billingSettings.waterPrice
    gasPrice = meterPrices?.gasPrice ?? billingSettings.gasPrice
    
  } catch (error) {
    console.error('[账单计算] 获取全局设置失败，使用硬编码默认值:', error)
    
    // 最终回退到硬编码默认值
    electricityPrice = meterPrices?.electricityPrice ?? 0.6
    waterPrice = meterPrices?.waterPrice ?? 3.5
    gasPrice = meterPrices?.gasPrice ?? 2.5
  }
  
  const electricityCost = electricityUsage * electricityPrice
  const waterCost = waterUsage * waterPrice
  const gasCost = gasUsage * gasPrice
  const totalCost = electricityCost + waterCost + gasCost

  return {
    electricityCost: Math.round(electricityCost * 100) / 100, // 保留两位小数
    waterCost: Math.round(waterCost * 100) / 100,
    gasCost: gasUsage > 0 ? Math.round(gasCost * 100) / 100 : undefined,
    totalCost: Math.round(totalCost * 100) / 100,
    electricityUsage,
    waterUsage,
    gasUsage: gasUsage > 0 ? gasUsage : undefined,
    electricityPrice,
    waterPrice,
    gasPrice: gasUsage > 0 ? gasPrice : undefined
  }
}

/**
 * 计算水电费 (同步版本)
 * 用于客户端组件的即时计算，使用localStorage缓存
 */
export function calculateUtilityBillSync(
  electricityUsage: number,
  waterUsage: number,
  gasUsage: number = 0,
  meterPrices?: {
    electricityPrice?: number
    waterPrice?: number
    gasPrice?: number
  }
): UtilityBillResult {
  let electricityPrice: number
  let waterPrice: number
  let gasPrice: number
  
  try {
    // 尝试从localStorage获取缓存的全局设置
    if (typeof window !== 'undefined') {
      const cachedSettings = localStorage.getItem('app_settings')
      if (cachedSettings) {
        const settings = JSON.parse(cachedSettings)
        
        electricityPrice = meterPrices?.electricityPrice ?? settings.electricityPrice ?? 0.6
        waterPrice = meterPrices?.waterPrice ?? settings.waterPrice ?? 3.5
        gasPrice = meterPrices?.gasPrice ?? settings.gasPrice ?? 2.5
      } else {
        throw new Error('No cached settings')
      }
    } else {
      throw new Error('Not in browser environment')
    }
  } catch (error) {
    // 回退到硬编码默认值
    electricityPrice = meterPrices?.electricityPrice ?? 0.6
    waterPrice = meterPrices?.waterPrice ?? 3.5
    gasPrice = meterPrices?.gasPrice ?? 2.5
  }
  
  const electricityCost = electricityUsage * electricityPrice
  const waterCost = waterUsage * waterPrice
  const gasCost = gasUsage * gasPrice
  const totalCost = electricityCost + waterCost + gasCost

  return {
    electricityCost: Math.round(electricityCost * 100) / 100,
    waterCost: Math.round(waterCost * 100) / 100,
    gasCost: gasUsage > 0 ? Math.round(gasCost * 100) / 100 : undefined,
    totalCost: Math.round(totalCost * 100) / 100,
    electricityUsage,
    waterUsage,
    gasUsage: gasUsage > 0 ? gasUsage : undefined,
    electricityPrice,
    waterPrice,
    gasPrice: gasUsage > 0 ? gasPrice : undefined
  }
}

/**
 * 计算租金相关费用
 * 根据租金和付款周期计算各项费用
 */
export function calculateRentBill(
  monthlyRent: number,
  paymentCycle?: string,
  depositMonths: number = 1,
  keyDeposit: number = 100,
  cleaningFee: number = 0
): RentCalculationResult {
  // 使用默认付款周期
  const cycle = paymentCycle || 'monthly'

  // 根据付款周期计算租金倍数
  const cycleMultiplier: Record<string, number> = {
    monthly: 1,      // 月付
    quarterly: 3,    // 季付
    semi_annually: 6, // 半年付
    annually: 12     // 年付
  }

  const multiplier = cycleMultiplier[cycle] || 1
  const totalRent = monthlyRent * multiplier
  const deposit = monthlyRent * depositMonths
  const totalAmount = totalRent + deposit + keyDeposit + cleaningFee

  return {
    monthlyRent,
    totalRent: Math.round(totalRent * 100) / 100,
    deposit: Math.round(deposit * 100) / 100,
    keyDeposit,
    cleaningFee,
    totalAmount: Math.round(totalAmount * 100) / 100,
    paymentCycle: cycle
  }
}

/**
 * 计算账单到期提醒
 * 根据默认提醒天数判断是否需要提醒
 */
export function shouldShowReminder(dueDate: Date): boolean {
  const defaultReminderDays = 7 // 默认提醒天数
  const today = new Date()
  const timeDiff = dueDate.getTime() - today.getTime()
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
  
  return daysDiff <= defaultReminderDays && daysDiff >= 0
}

/**
 * 获取提醒状态
 */
export function getReminderStatus(dueDate: Date): {
  shouldRemind: boolean
  daysLeft: number
  status: 'urgent' | 'warning' | 'normal' | 'overdue'
  message: string
} {
  const today = new Date()
  const timeDiff = dueDate.getTime() - today.getTime()
  const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24))
  
  let status: 'urgent' | 'warning' | 'normal' | 'overdue' = 'normal'
  let message = ''
  
  if (daysLeft < 0) {
    status = 'overdue'
    message = `已逾期 ${Math.abs(daysLeft)} 天`
  } else if (daysLeft === 0) {
    status = 'urgent'
    message = '今日到期'
  } else if (daysLeft <= 3) {
    status = 'urgent'
    message = `${daysLeft} 天后到期`
  } else if (daysLeft <= 7) {
    status = 'warning'
    message = `${daysLeft} 天后到期`
  } else {
    status = 'normal'
    message = `${daysLeft} 天后到期`
  }
  
  return {
    shouldRemind: shouldShowReminder(dueDate),
    daysLeft,
    status,
    message
  }
}

/**
 * 格式化金额显示
 */
export function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

/**
 * 格式化付款周期显示
 */
export function formatPaymentCycle(cycle: string): string {
  const cycleMap = {
    monthly: '月付',
    quarterly: '季付',
    semi_annually: '半年付',
    annually: '年付'
  }
  
  return cycleMap[cycle as keyof typeof cycleMap] || cycle
}