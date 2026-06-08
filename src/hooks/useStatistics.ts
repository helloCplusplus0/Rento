'use client'

import { useCallback, useEffect, useState } from 'react'
import type { EnhancedDashboardStats } from '@/types/dashboard'

function normalizeStatisticsError(error: unknown) {
  if (!(error instanceof Error)) {
    return '财务统计暂时不可用，请稍后重试'
  }

  const statusMatch = error.message.match(/HTTP error!\s*status:\s*(\d+)/i)
  const status = statusMatch ? Number(statusMatch[1]) : null

  if (status === 401 || status === 403) {
    return '当前登录状态已失效，请重新登录后查看财务统计'
  }

  if (status === 404) {
    return '财务统计接口暂未就绪，请联系管理员检查配置'
  }

  if (status === 408) {
    return '财务统计加载超时，请稍后重试'
  }

  if (status !== null && status >= 500) {
    return '财务统计服务暂时不可用，请稍后重试'
  }

  return error.message || '财务统计暂时不可用，请稍后重试'
}

/**
 * 统计数据Hook
 * 处理数据获取、加载状态、错误处理和自动刷新
 */
export function useStatistics(autoRefresh = false, refreshInterval = 30000) {
  const [stats, setStats] = useState<EnhancedDashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/dashboard/stats')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '获取统计数据失败')
      }

      // 从新的API响应格式中提取实际数据
      setStats(data.data)
    } catch (err) {
      const errorMessage = normalizeStatisticsError(err)
      setError(errorMessage)
      console.error('统计数据获取失败:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshStats = useCallback(async () => {
    setIsLoading(true)
    await fetchStats()
  }, [fetchStats])

  // 初始化数据获取
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // 自动刷新
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, fetchStats])

  return {
    stats,
    isLoading,
    error,
    refreshStats,
    lastUpdated: stats?.lastUpdated,
  }
}
