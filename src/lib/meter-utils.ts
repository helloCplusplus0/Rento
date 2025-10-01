import { globalSettings } from './global-settings'

/**
 * 水电表管理工具函数
 * 提供仪表编号生成、用量计算、数据验证等功能
 */

// 仪表类型定义
export type MeterType = 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'

// 业务规则配置
export const METER_BUSINESS_RULES = {
  // 编号规则
  meterNumberPattern: /^[A-Z]{2}\d{8}$/, // 如: EL20240001
  maxMetersPerRoom: 10,
  maxSameTypePerRoom: 5,

  // 单价规则
  priceRange: { min: 0.01, max: 100 },

  // 显示名称规则
  displayNameMaxLength: 50,
  displayNamePattern: /^[\u4e00-\u9fa5a-zA-Z0-9\-_\s]+$/,

  // 抄表规则
  maxReadingValue: 999999,
  maxUsagePerPeriod: 10000,
  negativeUsageThreshold: -1,
  abnormalUsageMultiplier: 3,
  maxReadingInterval: 60, // 天
  minReadingInterval: 1, // 天
} as const

/**
 * 生成仪表编号
 * @param meterType 仪表类型
 * @returns 仪表编号 (格式: XX12345678)
 */
export function generateMeterNumber(meterType: MeterType): string {
  const prefixes: Record<MeterType, string> = {
    ELECTRICITY: 'EL',
    COLD_WATER: 'CW',
    HOT_WATER: 'HW',
    GAS: 'GS',
  }

  const prefix = prefixes[meterType]
  const timestamp = Date.now().toString().slice(-8)
  return `${prefix}${timestamp}`
}

/**
 * 验证仪表编号格式
 * @param meterNumber 仪表编号
 * @returns 是否有效
 */
export function validateMeterNumber(meterNumber: string): boolean {
  return METER_BUSINESS_RULES.meterNumberPattern.test(meterNumber)
}

/**
 * 验证显示名称
 * @param displayName 显示名称
 * @returns 是否有效
 */
export function validateDisplayName(displayName: string): boolean {
  if (
    !displayName ||
    displayName.length > METER_BUSINESS_RULES.displayNameMaxLength
  ) {
    return false
  }
  return METER_BUSINESS_RULES.displayNamePattern.test(displayName)
}

/**
 * 验证单价
 * @param unitPrice 单价
 * @returns 是否有效
 */
export function validateUnitPrice(unitPrice: number): boolean {
  return (
    unitPrice >= METER_BUSINESS_RULES.priceRange.min &&
    unitPrice <= METER_BUSINESS_RULES.priceRange.max
  )
}

/**
 * 验证仪表配置数据的完整性
 * @param data 仪表配置数据
 * @returns 验证结果
 */
export function validateMeterConfigData(data: {
  displayName: string
  meterType: MeterType
  unitPrice: number
  unit: string
  location?: string
  remarks?: string
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 显示名称验证
  if (!validateDisplayName(data.displayName)) {
    errors.push(
      '显示名称格式不正确，最多50字符，支持中文、英文、数字、横线、下划线'
    )
  }

  // 仪表类型验证
  const validTypes: MeterType[] = [
    'ELECTRICITY',
    'COLD_WATER',
    'HOT_WATER',
    'GAS',
  ]
  if (!validTypes.includes(data.meterType)) {
    errors.push('仪表类型无效')
  }

  // 单价验证
  if (!validateUnitPrice(data.unitPrice)) {
    errors.push(
      `单价必须在${METER_BUSINESS_RULES.priceRange.min}-${METER_BUSINESS_RULES.priceRange.max}元之间`
    )
  }

  // 计量单位验证
  if (!data.unit || data.unit.length > 10) {
    errors.push('计量单位不能为空且最多10个字符')
  }

  // 安装位置验证
  if (data.location && data.location.length > 100) {
    errors.push('安装位置最多100个字符')
  }

  // 备注验证
  if (data.remarks && data.remarks.length > 200) {
    errors.push('备注信息最多200个字符')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 检查房间仪表配置限制
 * @param existingMeters 现有仪表列表
 * @param newMeterType 新仪表类型
 * @param newDisplayName 新显示名称
 * @returns 检查结果
 */
export function checkMeterLimits(
  existingMeters: Array<{ meterType: MeterType; displayName: string }>,
  newMeterType: MeterType,
  newDisplayName: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 检查房间仪表总数限制
  if (existingMeters.length >= METER_BUSINESS_RULES.maxMetersPerRoom) {
    errors.push(
      `单个房间最多只能配置${METER_BUSINESS_RULES.maxMetersPerRoom}个仪表`
    )
  }

  // 检查同类型仪表数量限制
  const sameTypeCount = existingMeters.filter(
    (m) => m.meterType === newMeterType
  ).length
  if (sameTypeCount >= METER_BUSINESS_RULES.maxSameTypePerRoom) {
    errors.push(
      `单个房间同类型仪表最多只能配置${METER_BUSINESS_RULES.maxSameTypePerRoom}个`
    )
  }

  // 检查显示名称唯一性
  const nameExists = existingMeters.some(
    (m) => m.displayName === newDisplayName
  )
  if (nameExists) {
    errors.push('显示名称在该房间内已存在，请使用不同的名称')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 计算用量
 * @param currentReading 本次读数
 * @param previousReading 上次读数
 * @returns 用量
 */
export function calculateUsage(
  currentReading: number,
  previousReading: number | null
): number {
  if (previousReading === null) return 0
  return Math.max(0, currentReading - previousReading)
}

/**
 * 计算费用金额
 * @param usage 用量
 * @param unitPrice 单价
 * @returns 费用金额
 */
export function calculateAmount(usage: number, unitPrice: number): number {
  return Number((usage * unitPrice).toFixed(2))
}

/**
 * 格式化仪表读数
 * @param reading 读数
 * @param unit 单位
 * @param precision 精度
 * @returns 格式化后的读数字符串
 */
export function formatMeterReading(
  reading: number,
  unit: string,
  precision = 2
): string {
  return `${reading.toFixed(precision)} ${unit}`
}

/**
 * 格式化仪表类型显示名称
 * @param meterType 仪表类型
 * @returns 中文显示名称
 */
export function formatMeterType(meterType: MeterType): string {
  const typeNames: Record<MeterType, string> = {
    ELECTRICITY: '电表',
    COLD_WATER: '冷水表',
    HOT_WATER: '热水表',
    GAS: '燃气表',
  }

  return typeNames[meterType]
}

/**
 * 获取仪表类型的默认单位
 * @param meterType 仪表类型
 * @returns 默认单位
 */
export function getDefaultUnit(meterType: MeterType): string {
  const defaultUnits: Record<MeterType, string> = {
    ELECTRICITY: '度',
    COLD_WATER: '吨',
    HOT_WATER: '吨',
    GAS: '立方米',
  }

  return defaultUnits[meterType]
}

/**
 * 获取仪表类型的默认单价 (增强版)
 * 优先从全局设置获取，回退到硬编码默认值
 * @param meterType 仪表类型
 * @returns 默认单价
 */
export async function getDefaultUnitPrice(
  meterType: MeterType
): Promise<number> {
  try {
    // 优先从数据库全局设置获取
    const billingSettings = await globalSettings.getBillingSettings()

    switch (meterType) {
      case 'ELECTRICITY':
        return billingSettings.electricityPrice
      case 'COLD_WATER':
        return billingSettings.waterPrice
      case 'HOT_WATER':
        return billingSettings.waterPrice * 1.5 // 热水通常比冷水贵50%
      case 'GAS':
        return billingSettings.gasPrice
      default:
        return 1.0
    }
  } catch (error) {
    console.error('[仪表工具] 获取默认单价失败，使用硬编码回退值:', error)

    // 回退到硬编码默认值
    const fallbackPrices: Record<MeterType, number> = {
      ELECTRICITY: 1.0,
      COLD_WATER: 10.0,
      HOT_WATER: 15.0,
      GAS: 3.5,
    }

    return fallbackPrices[meterType]
  }
}

/**
 * 获取仪表类型的默认单价 (同步版本)
 * 用于客户端组件的即时显示，使用localStorage缓存
 * @param meterType 仪表类型
 * @returns 默认单价
 */
export function getDefaultUnitPriceSync(meterType: MeterType): number {
  try {
    // 尝试从localStorage获取缓存的全局设置
    if (typeof window !== 'undefined') {
      const cachedSettings = localStorage.getItem('app_settings')
      if (cachedSettings) {
        const settings = JSON.parse(cachedSettings)

        switch (meterType) {
          case 'ELECTRICITY':
            return settings.electricityPrice || 1.0
          case 'COLD_WATER':
            return settings.waterPrice || 10.0
          case 'HOT_WATER':
            return (settings.waterPrice || 10.0) * 1.5
          case 'GAS':
            return settings.gasPrice || 3.5
        }
      }
    }
  } catch (error) {
    console.error('[仪表工具] 获取缓存设置失败:', error)
  }

  // 最终回退到硬编码默认值
  const fallbackPrices: Record<MeterType, number> = {
    ELECTRICITY: 1.0,
    COLD_WATER: 10.0,
    HOT_WATER: 15.0,
    GAS: 3.5,
  }

  return fallbackPrices[meterType]
}

/**
 * 验证读数是否异常
 * @param currentReading 本次读数
 * @param previousReading 上次读数
 * @param recentReadings 最近的读数记录
 * @returns 是否异常
 */
export function detectAbnormalReading(
  currentReading: number,
  previousReading: number | null,
  recentReadings: number[] = []
): boolean {
  // 检查读数是否过大
  if (currentReading > METER_BUSINESS_RULES.maxReadingValue) {
    return true
  }

  // 检查是否为负增长
  if (previousReading !== null && currentReading < previousReading) {
    return true
  }

  // 检查用量是否异常
  if (previousReading !== null) {
    const usage = currentReading - previousReading

    // 用量过大
    if (usage > METER_BUSINESS_RULES.maxUsagePerPeriod) {
      return true
    }

    // 与历史用量对比
    if (recentReadings.length >= 3) {
      const avgUsage =
        recentReadings.reduce((sum, reading, index) => {
          if (index === 0) return sum
          return sum + (recentReadings[index - 1] - reading)
        }, 0) /
        (recentReadings.length - 1)

      if (usage > avgUsage * METER_BUSINESS_RULES.abnormalUsageMultiplier) {
        return true
      }
    }
  }

  return false
}

/**
 * 生成抄表周期描述
 * @param readingDate 抄表日期
 * @returns 周期描述
 */
export function generatePeriodDescription(readingDate: Date): string {
  const year = readingDate.getFullYear()
  const month = readingDate.getMonth() + 1
  return `${year}年${month}月`
}

/**
 * 验证抄表数据
 * @param data 抄表数据
 * @returns 验证结果
 */
export function validateMeterReadingData(data: {
  currentReading: number
  previousReading?: number | null
  readingDate: Date
  unitPrice: number
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 验证读数
  if (data.currentReading < 0) {
    errors.push('读数不能为负数')
  }

  if (data.currentReading > METER_BUSINESS_RULES.maxReadingValue) {
    errors.push(`读数不能超过 ${METER_BUSINESS_RULES.maxReadingValue}`)
  }

  // 验证读数递增
  if (data.previousReading !== null && data.previousReading !== undefined) {
    if (data.currentReading < data.previousReading) {
      errors.push('本次读数不能小于上次读数')
    }

    const usage = data.currentReading - data.previousReading
    if (usage > METER_BUSINESS_RULES.maxUsagePerPeriod) {
      errors.push(`单期用量不能超过 ${METER_BUSINESS_RULES.maxUsagePerPeriod}`)
    }
  }

  // 验证日期
  const now = new Date()
  if (data.readingDate > now) {
    errors.push('抄表日期不能是未来时间')
  }

  // 验证单价
  if (!validateUnitPrice(data.unitPrice)) {
    errors.push(
      `单价必须在 ${METER_BUSINESS_RULES.priceRange.min} - ${METER_BUSINESS_RULES.priceRange.max} 之间`
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 生成仪表配置的默认排序值
 * @param meterType 仪表类型
 * @param existingSortOrders 已存在的排序值
 * @returns 新的排序值
 */
export function generateSortOrder(
  meterType: MeterType,
  existingSortOrders: number[] = []
): number {
  // 基础排序值 (按类型)
  const baseOrder: Record<MeterType, number> = {
    ELECTRICITY: 1000,
    COLD_WATER: 2000,
    HOT_WATER: 3000,
    GAS: 4000,
  }

  const base = baseOrder[meterType]

  // 找到该类型下的最大排序值
  const typeOrders = existingSortOrders.filter(
    (order) => order >= base && order < base + 1000
  )

  if (typeOrders.length === 0) {
    return base + 1
  }

  return Math.max(...typeOrders) + 1
}
