/**
 * AlertManager提供者组件
 * 在应用启动时初始化告警管理器
 */

'use client'

import { useEffect } from 'react'
import { alertManager } from '@/lib/alert-manager'

interface AlertManagerProviderProps {
  children: React.ReactNode
}

export function AlertManagerProvider({ children }: AlertManagerProviderProps) {
  useEffect(() => {
    // 启动告警监控
    alertManager.startMonitoring(5 * 60 * 1000) // 每5分钟检查一次

    // 清理函数
    return () => {
      alertManager.stopMonitoring()
    }
  }, [])

  return <>{children}</>
}