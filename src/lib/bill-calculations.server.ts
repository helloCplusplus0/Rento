import { globalSettings } from './global-settings'
import type { UtilityBillResult } from './bill-calculations'

/**
 * 服务端水电费计算增强版：
 * 优先读取数据库中的全局设置，客户端请继续使用 `calculateUtilityBillSync`。
 */
export async function calculateUtilityBill(
  electricityUsage: number,
  waterUsage: number,
  gasUsage: number = 0,
  meterPrices?: {
    electricityPrice?: number
    waterPrice?: number
    gasPrice?: number
  }
): Promise<UtilityBillResult> {
  let electricityPrice: number
  let waterPrice: number
  let gasPrice: number

  try {
    const billingSettings = await globalSettings.getBillingSettings()
    electricityPrice =
      meterPrices?.electricityPrice ?? billingSettings.electricityPrice
    waterPrice = meterPrices?.waterPrice ?? billingSettings.waterPrice
    gasPrice = meterPrices?.gasPrice ?? billingSettings.gasPrice
  } catch (error) {
    console.error('[账单计算] 获取全局设置失败，使用硬编码默认值:', error)
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
    gasPrice: gasUsage > 0 ? gasPrice : undefined,
  }
}
