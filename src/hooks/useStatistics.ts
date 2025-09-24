'use client'

import { useState, useEffect, useCallback } from 'react'
import { EnhancedDashboardStats } from '@/lib/dashboard-queries'

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
      const errorMessage = err instanceof Error ? err.message : '获取统计数据失败'
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
    lastUpdated: stats?.lastUpdated
  }
}