/**
 * 仪表数据保护工具
 * 确保移除仪表后，历史数据在统计分析中仍然可用
 */

import { prisma } from './prisma'
import type { MeterType } from '@/types/meter'

/**
 * 仪表历史数据统计接口
 */
export interface MeterHistoryStats {
  meterId: string
  meterNumber: string
  displayName: string
  meterType: MeterType
  isActive: boolean
  totalReadings: number
  totalUsage: number
  totalAmount: number
  firstReadingDate: Date | null
  lastReadingDate: Date | null
  averageMonthlyUsage: number
  roomInfo: {
    roomNumber: string
    buildingName: string
  }
}

/**
 * 获取所有仪表的历史统计数据（包括已移除的仪表）
 * 用于全面的数据分析和报表生成
 */
export async function getAllMeterHistoryStats(options: {
  includeInactive?: boolean // 是否包含已移除的仪表
  startDate?: Date
  endDate?: Date
  meterType?: MeterType
  roomId?: string
  buildingId?: string
} = {}): Promise<MeterHistoryStats[]> {
  const {
    includeInactive = true, // 默认包含已移除的仪表
    startDate,
    endDate,
    meterType,
    roomId,
    buildingId
  } = options

  // 构建查询条件
  const meterWhere: any = {}
  
  // 是否包含已移除的仪表
  if (!includeInactive) {
    meterWhere.isActive = true
  }
  
  // 仪表类型筛选
  if (meterType) {
    meterWhere.meterType = meterType
  }
  
  // 房间筛选
  if (roomId) {
    meterWhere.roomId = roomId
  }
  
  // 楼栋筛选
  if (buildingId) {
    meterWhere.room = {
      buildingId: buildingId
    }
  }

  // 抄表记录时间筛选
  const readingWhere: any = {}
  if (startDate || endDate) {
    readingWhere.readingDate = {}
    if (startDate) readingWhere.readingDate.gte = startDate
    if (endDate) readingWhere.readingDate.lte = endDate
  }

  // 查询所有仪表及其历史数据
  const meters = await prisma.meter.findMany({
    where: meterWhere,
    include: {
      room: {
        include: {
          building: true
        }
      },
      readings: {
        where: readingWhere,
        orderBy: { readingDate: 'asc' }
      }
    },
    orderBy: [
      { isActive: 'desc' }, // 活跃仪表优先
      { meterType: 'asc' },
      { displayName: 'asc' }
    ]
  })

  // 计算每个仪表的历史统计数据
  const stats: MeterHistoryStats[] = meters.map(meter => {
    const readings = meter.readings
    const totalReadings = readings.length
    const totalUsage = readings.reduce((sum, r) => sum + Number(r.usage), 0)
    const totalAmount = readings.reduce((sum, r) => sum + Number(r.amount), 0)
    
    const firstReadingDate = readings.length > 0 ? readings[0].readingDate : null
    const lastReadingDate = readings.length > 0 ? readings[readings.length - 1].readingDate : null
    
    // 计算平均月用量
    let averageMonthlyUsage = 0
    if (firstReadingDate && lastReadingDate && totalUsage > 0) {
      const monthsDiff = Math.max(1, 
        (lastReadingDate.getTime() - firstReadingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
      averageMonthlyUsage = totalUsage / monthsDiff
    }

    return {
      meterId: meter.id,
      meterNumber: meter.meterNumber,
      displayName: meter.displayName,
      meterType: meter.meterType as MeterType,
      isActive: meter.isActive,
      totalReadings,
      totalUsage,
      totalAmount,
      firstReadingDate,
      lastReadingDate,
      averageMonthlyUsage: Math.round(averageMonthlyUsage * 100) / 100,
      roomInfo: {
        roomNumber: meter.room.roomNumber,
        buildingName: meter.room.building.name
      }
    }
  })

  return stats
}

/**
 * 获取已移除仪表的历史数据统计
 * 专门用于分析已移除仪表的历史贡献
 */
export async function getRemovedMeterStats(options: {
  startDate?: Date
  endDate?: Date
  meterType?: MeterType
} = {}): Promise<MeterHistoryStats[]> {
  return getAllMeterHistoryStats({
    ...options,
    includeInactive: true
  }).then(stats => stats.filter(stat => !stat.isActive))
}

/**
 * 获取仪表类型的历史统计汇总
 * 包括已移除仪表的数据，确保统计完整性
 */
export async function getMeterTypeHistorySummary(options: {
  startDate?: Date
  endDate?: Date
  includeInactive?: boolean
} = {}): Promise<Record<MeterType, {
  totalMeters: number
  activeMeters: number
  removedMeters: number
  totalUsage: number
  totalAmount: number
  averageUsagePerMeter: number
}>> {
  const stats = await getAllMeterHistoryStats(options)
  
  const summary: Record<string, any> = {}
  
  // 初始化各类型统计
  const meterTypes: MeterType[] = ['ELECTRICITY', 'COLD_WATER', 'HOT_WATER', 'GAS']
  meterTypes.forEach(type => {
    summary[type] = {
      totalMeters: 0,
      activeMeters: 0,
      removedMeters: 0,
      totalUsage: 0,
      totalAmount: 0,
      averageUsagePerMeter: 0
    }
  })
  
  // 统计各类型数据
  stats.forEach(stat => {
    const type = stat.meterType
    summary[type].totalMeters++
    
    if (stat.isActive) {
      summary[type].activeMeters++
    } else {
      summary[type].removedMeters++
    }
    
    summary[type].totalUsage += stat.totalUsage
    summary[type].totalAmount += stat.totalAmount
  })
  
  // 计算平均值
  meterTypes.forEach(type => {
    const typeStats = summary[type]
    if (typeStats.totalMeters > 0) {
      typeStats.averageUsagePerMeter = Math.round(
        (typeStats.totalUsage / typeStats.totalMeters) * 100
      ) / 100
    }
  })
  
  return summary as Record<MeterType, any>
}

/**
 * 验证仪表移除后数据完整性
 * 确保移除操作不会影响历史数据的可访问性
 */
export async function validateMeterDataIntegrity(meterId: string): Promise<{
  isValid: boolean
  issues: string[]
  recommendations: string[]
}> {
  const issues: string[] = []
  const recommendations: string[] = []
  
  try {
    // 检查仪表是否存在
    const meter = await prisma.meter.findUnique({
      where: { id: meterId },
      include: {
        readings: true,
        room: {
          include: { building: true }
        }
      }
    })
    
    if (!meter) {
      issues.push('仪表不存在或已被彻底删除')
      recommendations.push('确保使用软删除而非硬删除')
      return { isValid: false, issues, recommendations }
    }
    
    // 检查历史数据完整性
    const readingsCount = meter.readings.length
    if (readingsCount === 0) {
      recommendations.push('该仪表无历史数据，可以安全移除')
    } else {
      if (!meter.isActive) {
        recommendations.push(`该仪表已被软删除，${readingsCount}条历史记录已保护`)
      } else {
        recommendations.push(`该仪表有${readingsCount}条历史记录，建议使用软删除`)
      }
    }
    
    // 检查关联的账单数据
    const billsCount = await prisma.bill.count({
      where: {
        meterReading: {
          meterId: meterId
        }
      }
    })
    
    if (billsCount > 0) {
      recommendations.push(`该仪表关联${billsCount}个账单，历史数据对财务分析很重要`)
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    }
    
  } catch (error) {
    issues.push(`数据完整性检查失败: ${error}`)
    return { isValid: false, issues, recommendations }
  }
}

/**
 * 生成仪表历史数据报表
 * 包括已移除仪表的贡献分析
 */
export async function generateMeterHistoryReport(options: {
  startDate?: Date
  endDate?: Date
  format?: 'summary' | 'detailed'
} = {}) {
  const { startDate, endDate, format = 'summary' } = options
  
  const allStats = await getAllMeterHistoryStats({ startDate, endDate })
  const activeStats = allStats.filter(s => s.isActive)
  const removedStats = allStats.filter(s => !s.isActive)
  const typeSummary = await getMeterTypeHistorySummary({ startDate, endDate })
  
  const report = {
    reportDate: new Date(),
    period: {
      startDate: startDate || '全部历史',
      endDate: endDate || '至今'
    },
    overview: {
      totalMeters: allStats.length,
      activeMeters: activeStats.length,
      removedMeters: removedStats.length,
      totalUsage: allStats.reduce((sum, s) => sum + s.totalUsage, 0),
      totalAmount: allStats.reduce((sum, s) => sum + s.totalAmount, 0)
    },
    byType: typeSummary,
    dataIntegrity: {
      message: '历史数据完整性已保护',
      removedMeterContribution: {
        usage: removedStats.reduce((sum, s) => sum + s.totalUsage, 0),
        amount: removedStats.reduce((sum, s) => sum + s.totalAmount, 0),
        percentage: allStats.length > 0 
          ? Math.round((removedStats.length / allStats.length) * 100 * 100) / 100
          : 0
      }
    }
  }
  
  if (format === 'detailed') {
    return {
      ...report,
      detailedStats: {
        activeMeters: activeStats,
        removedMeters: removedStats
      }
    }
  }
  
  return report
}