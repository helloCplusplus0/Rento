import { NextResponse } from 'next/server'
import { validateReadingBillConsistency, getReadingStatusStats } from '@/lib/reading-status-sync'

/**
 * 抄表状态一致性检查API
 * GET /api/meter-readings/status-check
 */
export async function GET() {
  try {
    console.log('[状态检查API] 开始执行状态一致性检查')
    
    // 执行一致性验证
    const validation = await validateReadingBillConsistency()
    
    // 获取状态统计信息
    const stats = await getReadingStatusStats()
    
    const result = {
      success: true,
      data: {
        isConsistent: validation.totalInconsistencies === 0,
        inconsistencies: validation.totalInconsistencies,
        details: {
          orphanedReadings: validation.orphanedReadings.length,
          inconsistentReadings: validation.inconsistentReadings.length
        },
        orphanedReadings: validation.orphanedReadings.map(reading => ({
          id: reading.id,
          meterName: reading.meter.displayName,
          meterType: reading.meter.meterType,
          status: reading.status,
          isBilled: reading.isBilled,
          contractId: reading.contractId,
          roomInfo: reading.contract ? {
            roomNumber: reading.contract.room.roomNumber,
            buildingName: reading.contract.room.building.name,
            renterName: reading.contract.renter.name
          } : null,
          createdAt: reading.createdAt,
          updatedAt: reading.updatedAt
        })),
        inconsistentReadings: validation.inconsistentReadings.map(reading => ({
          id: reading.id,
          meterName: reading.meter.displayName,
          meterType: reading.meter.meterType,
          status: reading.status,
          isBilled: reading.isBilled,
          billDetailsCount: reading.billDetails.length,
          contractId: reading.contractId,
          roomInfo: reading.contract ? {
            roomNumber: reading.contract.room.roomNumber,
            buildingName: reading.contract.room.building.name,
            renterName: reading.contract.renter.name
          } : null,
          createdAt: reading.createdAt,
          updatedAt: reading.updatedAt
        })),
        statistics: stats
      },
      message: validation.totalInconsistencies === 0 
        ? '所有抄表记录状态一致' 
        : `发现 ${validation.totalInconsistencies} 个状态不一致的记录`
    }
    
    console.log(`[状态检查API] 完成 - ${result.message}`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('[状态检查API] 执行失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Status check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}