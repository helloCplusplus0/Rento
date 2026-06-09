import { globalSettings } from './global-settings'
import type { MeterType } from './meter-utils'

/**
 * 服务端默认单价查询：
 * 仅在需要读取数据库回退配置时使用，浏览器侧请继续使用同步缓存版本。
 */
export async function getDefaultUnitPrice(
  meterType: MeterType
): Promise<number> {
  try {
    const billingSettings = await globalSettings.getBillingSettings()

    switch (meterType) {
      case 'ELECTRICITY':
        return billingSettings.electricityPrice
      case 'COLD_WATER':
        return billingSettings.waterPrice
      case 'HOT_WATER':
        return billingSettings.waterPrice * 1.5
      case 'GAS':
        return billingSettings.gasPrice
      default:
        return 1.0
    }
  } catch (error) {
    console.error('[仪表工具] 获取默认单价失败，使用硬编码回退值:', error)

    const fallbackPrices: Record<MeterType, number> = {
      ELECTRICITY: 1.0,
      COLD_WATER: 10.0,
      HOT_WATER: 15.0,
      GAS: 3.5,
    }

    return fallbackPrices[meterType]
  }
}
