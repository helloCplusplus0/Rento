import {
  DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS,
  DEFAULT_UPCOMING_MOVE_IN_ALERT_DAYS,
  sanitizeContractExpiryAlertDays,
  sanitizeUpcomingMoveInAlertDays,
} from '@/lib/contract-alert-semantics'
import { prisma } from '@/lib/prisma'

/**
 * phase10-03 查询层定位：
 * - 主角色：治理配置查询/写入承接位
 * - 可继续承接 settings 管理、提醒窗口、抄表/计费默认值回退
 * - 不反向定义合同/账单/房间/抄表主数据的 canonical read path
 */
export const globalSettingsLayerPosition = {
  primaryRole: 'governance-config-query',
  supports: ['settings-management', 'alert-window-config', 'reading-billing-defaults'],
  notCanonicalFor: ['contracts', 'bills', 'rooms', 'meter-readings'],
} as const

/**
 * 全局设置管理库
 * 提供数据库级别的设置存储和管理功能
 */

// 设置类型定义
export type SettingType = 'number' | 'string' | 'boolean' | 'object'
export type SettingCategory = 'billing' | 'system' | 'notification' | 'reading'

// 设置值接口
export interface SettingValue {
  key: string
  value: any
  type: SettingType
  category: SettingCategory
  description?: string
}

export interface ReadingSettings {
  usageAnomalyThreshold: number
  autoGenerateBills: boolean
  requireReadingApproval: boolean
}

export interface ReadingSettingsLoadResult {
  settings: ReadingSettings
  fallbackKeys: Array<keyof ReadingSettings>
  source: 'database' | 'mixed-fallback' | 'default-fallback'
}

export interface ContractDefaultSettings {
  defaultRentCycle: string
  defaultPaymentTiming: string
  defaultDepositMonths: number
  autoGenerateContractBills: boolean
}

export interface ContractDefaultSettingsLoadResult {
  settings: ContractDefaultSettings
  fallbackKeys: Array<keyof ContractDefaultSettings>
  source: 'database' | 'mixed-fallback' | 'default-fallback'
}

export interface ContractAlertSettings {
  contractExpiryAlertDays: number
  upcomingMoveInAlertDays: number
}

export interface ContractAlertSettingsLoadResult {
  settings: ContractAlertSettings
  fallbackKeys: Array<keyof ContractAlertSettings>
  source: 'database' | 'mixed-fallback' | 'default-fallback'
}

export const DEFAULT_READING_SETTINGS: ReadingSettings = {
  usageAnomalyThreshold: 3.0,
  autoGenerateBills: true,
  requireReadingApproval: false,
}

export const DEFAULT_CONTRACT_DEFAULT_SETTINGS: ContractDefaultSettings = {
  defaultRentCycle: 'monthly',
  defaultPaymentTiming: '每月1号前',
  defaultDepositMonths: 2,
  autoGenerateContractBills: true,
}

export const DEFAULT_CONTRACT_ALERT_SETTINGS: ContractAlertSettings = {
  contractExpiryAlertDays: DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS,
  upcomingMoveInAlertDays: DEFAULT_UPCOMING_MOVE_IN_ALERT_DAYS,
}

// 默认设置配置
export const DEFAULT_SETTINGS: SettingValue[] = [
  // 计费设置
  {
    key: 'electricityPrice',
    value: 0.6,
    type: 'number',
    category: 'billing',
    description: '电费单价 (元/度)',
  },
  {
    key: 'waterPrice',
    value: 3.5,
    type: 'number',
    category: 'billing',
    description: '水费单价 (元/吨)',
  },
  {
    key: 'gasPrice',
    value: 2.5,
    type: 'number',
    category: 'billing',
    description: '燃气费单价 (元/立方米)',
  },
  {
    key: 'defaultRentCycle',
    value: 'monthly',
    type: 'string',
    category: 'billing',
    description: '默认租金周期',
  },
  {
    key: 'defaultPaymentTiming',
    value: '每月1号前',
    type: 'string',
    category: 'billing',
    description: '默认付款时间',
  },
  {
    key: 'defaultDepositMonths',
    value: 2,
    type: 'number',
    category: 'billing',
    description: '默认押金月数',
  },
  {
    key: 'autoGenerateContractBills',
    value: true,
    type: 'boolean',
    category: 'billing',
    description: '创建合同后默认自动生成账单',
  },

  // 系统设置
  {
    key: 'autoBackup',
    value: true,
    type: 'boolean',
    category: 'system',
    description: '自动备份',
  },
  {
    key: 'theme',
    value: 'light',
    type: 'string',
    category: 'system',
    description: '主题模式',
  },

  // 通知设置
  {
    key: 'enableNotifications',
    value: true,
    type: 'boolean',
    category: 'notification',
    description: '启用通知',
  },
  {
    key: 'reminderDays',
    value: 7,
    type: 'number',
    category: 'notification',
    description: '提醒天数',
  },
  {
    key: 'contractExpiryAlertDays',
    value: DEFAULT_CONTRACT_EXPIRY_ALERT_DAYS,
    type: 'number',
    category: 'notification',
    description: '合同到期提醒窗口天数',
  },
  {
    key: 'upcomingMoveInAlertDays',
    value: DEFAULT_UPCOMING_MOVE_IN_ALERT_DAYS,
    type: 'number',
    category: 'notification',
    description: '待入住合同提醒窗口天数',
  },

  // 抄表设置
  {
    key: 'readingCycle',
    value: 'monthly',
    type: 'string',
    category: 'reading',
    description: '抄表周期',
  },
  {
    key: 'customReadingDays',
    value: 30,
    type: 'number',
    category: 'reading',
    description: '自定义抄表周期天数',
  },
  {
    key: 'readingReminderDays',
    value: 3,
    type: 'number',
    category: 'reading',
    description: '抄表提醒天数',
  },
  {
    key: 'usageAnomalyThreshold',
    value: 3.0,
    type: 'number',
    category: 'reading',
    description: '异常用量阈值倍数',
  },
  {
    key: 'autoGenerateBills',
    value: true,
    type: 'boolean',
    category: 'reading',
    description: '抄表后自动生成账单',
  },
  {
    key: 'requireReadingApproval',
    value: false,
    type: 'boolean',
    category: 'reading',
    description: '需要抄表审批',
  },
]

/**
 * 全局设置管理类
 */
export class GlobalSettingsManager {
  /**
   * 初始化默认设置
   */
  static async initializeDefaultSettings(): Promise<void> {
    console.log('[全局设置] 开始初始化默认设置')

    try {
      for (const setting of DEFAULT_SETTINGS) {
        const existing = await prisma.globalSetting.findUnique({
          where: { key: setting.key },
        })

        if (!existing) {
          await prisma.globalSetting.create({
            data: {
              key: setting.key,
              value: JSON.stringify(setting.value),
              type: setting.type,
              category: setting.category,
              description: setting.description,
            },
          })
          console.log(
            `[全局设置] 创建默认设置: ${setting.key} = ${setting.value}`
          )
        }
      }

      console.log('[全局设置] 默认设置初始化完成')
    } catch (error) {
      console.error('[全局设置] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 获取单个设置值
   */
  static async getSetting<T = any>(key: string): Promise<T | null> {
    try {
      const setting = await prisma.globalSetting.findUnique({
        where: { key },
      })

      if (!setting) {
        return null
      }

      return JSON.parse(setting.value) as T
    } catch (error) {
      console.error(`[全局设置] 获取设置失败: ${key}`, error)
      return null
    }
  }

  /**
   * 获取所有设置
   */
  static async getAllSettings(): Promise<Record<string, any>> {
    try {
      const settings = await prisma.globalSetting.findMany()
      const result: Record<string, any> = {}

      for (const setting of settings) {
        try {
          result[setting.key] = JSON.parse(setting.value)
        } catch (error) {
          console.error(`[全局设置] 解析设置值失败: ${setting.key}`, error)
          result[setting.key] = setting.value
        }
      }

      return result
    } catch (error) {
      console.error('[全局设置] 获取所有设置失败:', error)
      return {}
    }
  }

  /**
   * 按分类获取设置
   */
  static async getSettingsByCategory(
    category: SettingCategory
  ): Promise<Record<string, any>> {
    try {
      const settings = await prisma.globalSetting.findMany({
        where: { category },
      })

      const result: Record<string, any> = {}

      for (const setting of settings) {
        try {
          result[setting.key] = JSON.parse(setting.value)
        } catch (error) {
          console.error(`[全局设置] 解析设置值失败: ${setting.key}`, error)
          result[setting.key] = setting.value
        }
      }

      return result
    } catch (error) {
      console.error(`[全局设置] 获取分类设置失败: ${category}`, error)
      return {}
    }
  }

  /**
   * 更新单个设置
   */
  static async updateSetting(key: string, value: any): Promise<void> {
    try {
      const existing = await prisma.globalSetting.findUnique({
        where: { key },
      })

      if (existing) {
        await prisma.globalSetting.update({
          where: { key },
          data: {
            value: JSON.stringify(value),
            updatedAt: new Date(),
          },
        })
      } else {
        // 如果设置不存在，创建新的设置
        const defaultSetting = DEFAULT_SETTINGS.find((s) => s.key === key)
        await prisma.globalSetting.create({
          data: {
            key,
            value: JSON.stringify(value),
            type: defaultSetting?.type || 'string',
            category: defaultSetting?.category || 'system',
            description: defaultSetting?.description,
          },
        })
      }

      console.log(`[全局设置] 更新设置: ${key} = ${value}`)
    } catch (error) {
      console.error(`[全局设置] 更新设置失败: ${key}`, error)
      throw error
    }
  }

  /**
   * 批量更新设置
   */
  static async updateSettings(settings: Record<string, any>): Promise<void> {
    try {
      for (const [key, value] of Object.entries(settings)) {
        await this.updateSetting(key, value)
      }

      console.log(
        `[全局设置] 批量更新设置完成: ${Object.keys(settings).length}个`
      )
    } catch (error) {
      console.error('[全局设置] 批量更新设置失败:', error)
      throw error
    }
  }

  /**
   * 删除设置
   */
  static async deleteSetting(key: string): Promise<void> {
    try {
      await prisma.globalSetting.delete({
        where: { key },
      })

      console.log(`[全局设置] 删除设置: ${key}`)
    } catch (error) {
      console.error(`[全局设置] 删除设置失败: ${key}`, error)
      throw error
    }
  }

  /**
   * 重置为默认设置
   */
  static async resetToDefaults(): Promise<void> {
    try {
      // 删除所有现有设置
      await prisma.globalSetting.deleteMany()

      // 重新初始化默认设置
      await this.initializeDefaultSettings()

      console.log('[全局设置] 重置为默认设置完成')
    } catch (error) {
      console.error('[全局设置] 重置设置失败:', error)
      throw error
    }
  }

  /**
   * 获取计费相关设置
   */
  static async getBillingSettings(): Promise<{
    electricityPrice: number
    waterPrice: number
    gasPrice: number
    defaultRentCycle: string
    defaultPaymentTiming: string
    defaultDepositMonths: number
    autoGenerateContractBills: boolean
  }> {
    const settings = await this.getSettingsByCategory('billing')

    return {
      electricityPrice: settings.electricityPrice || 0.6,
      waterPrice: settings.waterPrice || 3.5,
      gasPrice: settings.gasPrice || 2.5,
      defaultRentCycle: settings.defaultRentCycle || 'monthly',
      defaultPaymentTiming:
        settings.defaultPaymentTiming || '每月1号前',
      defaultDepositMonths:
        typeof settings.defaultDepositMonths === 'number'
          ? settings.defaultDepositMonths
          : 2,
      autoGenerateContractBills:
        typeof settings.autoGenerateContractBills === 'boolean'
          ? settings.autoGenerateContractBills
          : true,
    }
  }

  /**
   * 获取合同创建默认配置，并对缺失或异常值做受控回退
   */
  static async getContractDefaultSettings(): Promise<ContractDefaultSettingsLoadResult> {
    const settings: ContractDefaultSettings = {
      ...DEFAULT_CONTRACT_DEFAULT_SETTINGS,
    }
    const fallbackKeys = new Set<keyof ContractDefaultSettings>([
      'defaultRentCycle',
      'defaultPaymentTiming',
      'defaultDepositMonths',
      'autoGenerateContractBills',
    ])

    try {
      const contractSettings = await prisma.globalSetting.findMany({
        where: {
          key: {
            in: [
              'defaultRentCycle',
              'defaultPaymentTiming',
              'defaultDepositMonths',
              'autoGenerateContractBills',
            ],
          },
        },
        select: {
          key: true,
          value: true,
        },
      })

      for (const item of contractSettings) {
        try {
          const parsedValue = JSON.parse(item.value)

          switch (item.key) {
            case 'defaultRentCycle':
              if (typeof parsedValue === 'string' && parsedValue.trim()) {
                settings.defaultRentCycle = parsedValue
                fallbackKeys.delete('defaultRentCycle')
              }
              break
            case 'defaultPaymentTiming':
              if (typeof parsedValue === 'string' && parsedValue.trim()) {
                settings.defaultPaymentTiming = parsedValue
                fallbackKeys.delete('defaultPaymentTiming')
              }
              break
            case 'defaultDepositMonths':
              if (
                typeof parsedValue === 'number' &&
                Number.isFinite(parsedValue) &&
                parsedValue >= 0
              ) {
                settings.defaultDepositMonths = parsedValue
                fallbackKeys.delete('defaultDepositMonths')
              }
              break
            case 'autoGenerateContractBills':
              if (typeof parsedValue === 'boolean') {
                settings.autoGenerateContractBills = parsedValue
                fallbackKeys.delete('autoGenerateContractBills')
              }
              break
          }
        } catch (error) {
          console.error(`[全局设置] 解析合同默认配置失败: ${item.key}`, error)
        }
      }

      const fallbackKeyList = Array.from(fallbackKeys)

      return {
        settings,
        fallbackKeys: fallbackKeyList,
        source:
          fallbackKeyList.length === 0
            ? 'database'
            : fallbackKeyList.length === 4
              ? 'default-fallback'
              : 'mixed-fallback',
      }
    } catch (error) {
      console.error('[全局设置] 获取合同默认配置失败，已回退默认值', error)

      return {
        settings,
        fallbackKeys: [
          'defaultRentCycle',
          'defaultPaymentTiming',
          'defaultDepositMonths',
          'autoGenerateContractBills',
        ],
        source: 'default-fallback',
      }
    }
  }

  /**
   * 获取合同到期提醒相关设置，并对缺失或异常值做受控回退
   */
  static async getContractAlertSettings(): Promise<ContractAlertSettingsLoadResult> {
    const settings: ContractAlertSettings = { ...DEFAULT_CONTRACT_ALERT_SETTINGS }
    const fallbackKeys = new Set<keyof ContractAlertSettings>([
      'contractExpiryAlertDays',
      'upcomingMoveInAlertDays',
    ])

    try {
      const contractAlertSettings = await prisma.globalSetting.findMany({
        where: {
          key: {
            in: ['contractExpiryAlertDays', 'upcomingMoveInAlertDays'],
          },
        },
        select: {
          key: true,
          value: true,
        },
      })

      for (const item of contractAlertSettings) {
        try {
          const parsedValue = JSON.parse(item.value)

          if (item.key === 'contractExpiryAlertDays') {
            settings.contractExpiryAlertDays =
              sanitizeContractExpiryAlertDays(parsedValue)
            fallbackKeys.delete('contractExpiryAlertDays')
          }

          if (item.key === 'upcomingMoveInAlertDays') {
            settings.upcomingMoveInAlertDays =
              sanitizeUpcomingMoveInAlertDays(parsedValue)
            fallbackKeys.delete('upcomingMoveInAlertDays')
          }
        } catch (error) {
          console.error(`[全局设置] 解析合同提醒配置失败: ${item.key}`, error)
        }
      }

      const fallbackKeyList = Array.from(fallbackKeys)

      return {
        settings,
        fallbackKeys: fallbackKeyList,
        source:
          fallbackKeyList.length === 0
            ? 'database'
            : fallbackKeyList.length === 2
              ? 'default-fallback'
              : 'mixed-fallback',
      }
    } catch (error) {
      console.error('[全局设置] 获取合同提醒配置失败，已回退默认值', error)

      return {
        settings,
        fallbackKeys: ['contractExpiryAlertDays', 'upcomingMoveInAlertDays'],
        source: 'default-fallback',
      }
    }
  }

  /**
   * 获取抄表相关设置，并对缺失或异常值做受控回退
   */
  static async getReadingSettings(): Promise<ReadingSettingsLoadResult> {
    const settings: ReadingSettings = { ...DEFAULT_READING_SETTINGS }
    const fallbackKeys = new Set<keyof ReadingSettings>([
      'usageAnomalyThreshold',
      'autoGenerateBills',
      'requireReadingApproval',
    ])

    try {
      const readingSettings = await prisma.globalSetting.findMany({
        where: {
          key: {
            in: [
              'usageAnomalyThreshold',
              'autoGenerateBills',
              'requireReadingApproval',
            ],
          },
        },
        select: {
          key: true,
          value: true,
        },
      })

      for (const item of readingSettings) {
        try {
          const parsedValue = JSON.parse(item.value)

          switch (item.key) {
            case 'usageAnomalyThreshold':
              if (
                typeof parsedValue === 'number' &&
                Number.isFinite(parsedValue) &&
                parsedValue > 0
              ) {
                settings.usageAnomalyThreshold = parsedValue
                fallbackKeys.delete('usageAnomalyThreshold')
              }
              break
            case 'autoGenerateBills':
              if (typeof parsedValue === 'boolean') {
                settings.autoGenerateBills = parsedValue
                fallbackKeys.delete('autoGenerateBills')
              }
              break
            case 'requireReadingApproval':
              if (typeof parsedValue === 'boolean') {
                settings.requireReadingApproval = parsedValue
                fallbackKeys.delete('requireReadingApproval')
              }
              break
          }
        } catch (error) {
          console.error(`[全局设置] 解析抄表设置失败: ${item.key}`, error)
        }
      }

      const fallbackKeyList = Array.from(fallbackKeys)

      return {
        settings,
        fallbackKeys: fallbackKeyList,
        source:
          fallbackKeyList.length === 0
            ? 'database'
            : fallbackKeyList.length === 3
              ? 'default-fallback'
              : 'mixed-fallback',
      }
    } catch (error) {
      console.error('[全局设置] 获取抄表设置失败，已回退默认值', error)

      return {
        settings,
        fallbackKeys: [
          'usageAnomalyThreshold',
          'autoGenerateBills',
          'requireReadingApproval',
        ],
        source: 'default-fallback',
      }
    }
  }
}

// 导出便捷函数
export const globalSettings = GlobalSettingsManager
