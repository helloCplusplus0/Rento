import { prisma } from '@/lib/prisma'

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

// 默认设置配置
export const DEFAULT_SETTINGS: SettingValue[] = [
  // 计费设置
  {
    key: 'electricityPrice',
    value: 0.6,
    type: 'number',
    category: 'billing',
    description: '电费单价 (元/度)'
  },
  {
    key: 'waterPrice',
    value: 3.5,
    type: 'number',
    category: 'billing',
    description: '水费单价 (元/吨)'
  },
  {
    key: 'gasPrice',
    value: 2.5,
    type: 'number',
    category: 'billing',
    description: '燃气费单价 (元/立方米)'
  },
  {
    key: 'defaultRentCycle',
    value: 'monthly',
    type: 'string',
    category: 'billing',
    description: '默认租金周期'
  },
  
  // 系统设置
  {
    key: 'autoBackup',
    value: true,
    type: 'boolean',
    category: 'system',
    description: '自动备份'
  },
  {
    key: 'theme',
    value: 'light',
    type: 'string',
    category: 'system',
    description: '主题模式'
  },
  
  // 通知设置
  {
    key: 'enableNotifications',
    value: true,
    type: 'boolean',
    category: 'notification',
    description: '启用通知'
  },
  {
    key: 'reminderDays',
    value: 7,
    type: 'number',
    category: 'notification',
    description: '提醒天数'
  },
  
  // 抄表设置
  {
    key: 'readingCycle',
    value: 'monthly',
    type: 'string',
    category: 'reading',
    description: '抄表周期'
  },
  {
    key: 'customReadingDays',
    value: 30,
    type: 'number',
    category: 'reading',
    description: '自定义抄表周期天数'
  },
  {
    key: 'readingReminderDays',
    value: 3,
    type: 'number',
    category: 'reading',
    description: '抄表提醒天数'
  },
  {
    key: 'usageAnomalyThreshold',
    value: 3.0,
    type: 'number',
    category: 'reading',
    description: '异常用量阈值倍数'
  },
  {
    key: 'autoGenerateBills',
    value: true,
    type: 'boolean',
    category: 'reading',
    description: '抄表后自动生成账单'
  },
  {
    key: 'requireReadingApproval',
    value: false,
    type: 'boolean',
    category: 'reading',
    description: '需要抄表审批'
  }
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
          where: { key: setting.key }
        })
        
        if (!existing) {
          await prisma.globalSetting.create({
            data: {
              key: setting.key,
              value: JSON.stringify(setting.value),
              type: setting.type,
              category: setting.category,
              description: setting.description
            }
          })
          console.log(`[全局设置] 创建默认设置: ${setting.key} = ${setting.value}`)
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
        where: { key }
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
  static async getSettingsByCategory(category: SettingCategory): Promise<Record<string, any>> {
    try {
      const settings = await prisma.globalSetting.findMany({
        where: { category }
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
        where: { key }
      })
      
      if (existing) {
        await prisma.globalSetting.update({
          where: { key },
          data: {
            value: JSON.stringify(value),
            updatedAt: new Date()
          }
        })
      } else {
        // 如果设置不存在，创建新的设置
        const defaultSetting = DEFAULT_SETTINGS.find(s => s.key === key)
        await prisma.globalSetting.create({
          data: {
            key,
            value: JSON.stringify(value),
            type: defaultSetting?.type || 'string',
            category: defaultSetting?.category || 'system',
            description: defaultSetting?.description
          }
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
      
      console.log(`[全局设置] 批量更新设置完成: ${Object.keys(settings).length}个`)
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
        where: { key }
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
  }> {
    const settings = await this.getSettingsByCategory('billing')
    
    return {
      electricityPrice: settings.electricityPrice || 0.6,
      waterPrice: settings.waterPrice || 3.5,
      gasPrice: settings.gasPrice || 2.5,
      defaultRentCycle: settings.defaultRentCycle || 'monthly'
    }
  }
}

// 导出便捷函数
export const globalSettings = GlobalSettingsManager