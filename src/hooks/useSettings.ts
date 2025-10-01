'use client'

import { useEffect, useState } from 'react'

/**
 * 应用设置接口
 */
export interface AppSettings {
  // 基础设置
  electricityPrice: number // 电费单价 (元/度)
  waterPrice: number // 水费单价 (元/吨)
  defaultRentCycle: string // 默认租金周期

  // 系统设置
  autoBackup: boolean // 自动备份
  theme: 'light' | 'dark' // 主题模式

  // 通知设置
  enableNotifications: boolean // 启用通知
  reminderDays: number // 提醒天数

  // 抄表设置
  readingCycle: 'monthly' | 'quarterly' | 'custom' // 抄表周期
  customReadingDays: number // 自定义抄表周期天数
  readingReminderDays: number // 抄表提醒天数
  usageAnomalyThreshold: number // 异常用量阈值倍数
  autoGenerateBills: boolean // 抄表后自动生成账单
  requireReadingApproval: boolean // 需要抄表审批
}

/**
 * 默认设置配置
 */
const defaultSettings: AppSettings = {
  electricityPrice: 0.6,
  waterPrice: 3.5,
  defaultRentCycle: 'monthly',
  autoBackup: true,
  theme: 'light',
  enableNotifications: true,
  reminderDays: 7,
  // 抄表设置默认值
  readingCycle: 'monthly',
  customReadingDays: 30,
  readingReminderDays: 3,
  usageAnomalyThreshold: 3.0,
  autoGenerateBills: true,
  requireReadingApproval: false,
}

/**
 * 设置数据管理Hook (增强版)
 * 提供设置的读取、更新和持久化功能
 * 支持数据库存储和localStorage备份
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // 从数据库加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // 首先尝试从数据库加载
        const response = await fetch('/api/settings')

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const dbSettings = { ...defaultSettings, ...result.data }
            setSettings(dbSettings)
            setIsInitialized(true)

            // 同步到localStorage作为备份
            localStorage.setItem('app_settings', JSON.stringify(dbSettings))
            console.log('[设置] 从数据库加载设置成功')
            return
          }
        }

        // 如果数据库加载失败，尝试初始化默认设置
        console.log('[设置] 数据库加载失败，尝试初始化默认设置')
        const initResponse = await fetch('/api/settings/init', {
          method: 'POST',
        })

        if (initResponse.ok) {
          const initResult = await initResponse.json()
          if (initResult.success && initResult.data) {
            const dbSettings = { ...defaultSettings, ...initResult.data }
            setSettings(dbSettings)
            setIsInitialized(true)
            localStorage.setItem('app_settings', JSON.stringify(dbSettings))
            console.log('[设置] 默认设置初始化成功')
            return
          }
        }

        // 如果都失败，回退到localStorage
        console.log('[设置] 回退到localStorage')
        const savedSettings = localStorage.getItem('app_settings')
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings)
          setSettings({ ...defaultSettings, ...parsedSettings })
        }
      } catch (error) {
        console.error('[设置] 加载设置失败:', error)

        // 最后回退到localStorage
        try {
          const savedSettings = localStorage.getItem('app_settings')
          if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings)
            setSettings({ ...defaultSettings, ...parsedSettings })
          }
        } catch (localError) {
          console.error('[设置] localStorage加载也失败:', localError)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  /**
   * 更新单个设置项
   */
  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)

    try {
      // 优先保存到数据库
      if (isInitialized) {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: { [key]: value } }),
        })

        if (response.ok) {
          console.log(`[设置] 数据库更新成功: ${String(key)} = ${value}`)
        } else {
          console.error(`[设置] 数据库更新失败: ${String(key)}`)
        }
      }

      // 同时保存到localStorage作为备份
      localStorage.setItem('app_settings', JSON.stringify(newSettings))
    } catch (error) {
      console.error('[设置] 保存设置失败:', error)

      // 如果数据库保存失败，至少保存到localStorage
      try {
        localStorage.setItem('app_settings', JSON.stringify(newSettings))
      } catch (localError) {
        console.error('[设置] localStorage保存也失败:', localError)
      }
    }
  }

  /**
   * 批量更新设置
   */
  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    try {
      // 优先保存到数据库
      if (isInitialized) {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: newSettings }),
        })

        if (response.ok) {
          console.log(
            `[设置] 批量更新成功: ${Object.keys(newSettings).length}个`
          )
        } else {
          console.error('[设置] 批量更新失败')
        }
      }

      // 同时保存到localStorage
      localStorage.setItem('app_settings', JSON.stringify(updatedSettings))
    } catch (error) {
      console.error('[设置] 批量保存设置失败:', error)

      // 回退到localStorage
      try {
        localStorage.setItem('app_settings', JSON.stringify(updatedSettings))
      } catch (localError) {
        console.error('[设置] localStorage保存也失败:', localError)
      }
    }
  }

  /**
   * 重置为默认设置
   */
  const resetSettings = async () => {
    try {
      // 重置数据库设置
      if (isInitialized) {
        const response = await fetch('/api/settings', { method: 'DELETE' })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setSettings({ ...defaultSettings, ...result.data })
            localStorage.setItem('app_settings', JSON.stringify(result.data))
            console.log('[设置] 数据库重置成功')
            return
          }
        }
      }

      // 如果数据库重置失败，重置本地设置
      setSettings(defaultSettings)
      localStorage.setItem('app_settings', JSON.stringify(defaultSettings))
    } catch (error) {
      console.error('[设置] 重置设置失败:', error)

      // 最后回退
      setSettings(defaultSettings)
      localStorage.setItem('app_settings', JSON.stringify(defaultSettings))
    }
  }

  /**
   * 导出设置数据
   */
  const exportSettings = () => {
    try {
      const dataStr = JSON.stringify(settings, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement('a')
      link.href = url
      link.download = `rento-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出设置失败:', error)
    }
  }

  /**
   * 导入设置数据
   */
  const importSettings = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const result = e.target?.result as string
          const importedSettings = JSON.parse(result)

          // 验证导入的设置数据
          const validatedSettings = { ...defaultSettings, ...importedSettings }
          updateSettings(validatedSettings)

          resolve()
        } catch (error) {
          reject(new Error('设置文件格式错误'))
        }
      }

      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file)
    })
  }

  return {
    settings,
    isLoading,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
  }
}

/**
 * 获取当前设置的同步函数
 * 用于在非React组件中获取设置
 * 支持服务端和客户端环境
 */
export function getSettings(): AppSettings {
  // 检查是否在浏览器环境中
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const savedSettings = localStorage.getItem('app_settings')
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        return { ...defaultSettings, ...parsedSettings }
      }
    } catch (error) {
      console.error('获取设置失败:', error)
    }
  }

  // 服务端环境或localStorage不可用时，返回默认设置
  return defaultSettings
}
