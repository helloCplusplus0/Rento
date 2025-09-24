import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 工作台合同到期提醒API
 * GET /api/dashboard/contract-alerts - 获取合同到期提醒
 */

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // 获取即将到期和已到期的合同
    const contracts = await prisma.contract.findMany({
      where: {
        OR: [
          // 30天内到期的活跃合同
          {
            status: 'ACTIVE',
            endDate: {
              gte: now,
              lte: thirtyDaysFromNow
            }
          },
          // 已到期但状态仍为活跃的合同
          {
            status: 'ACTIVE',
            endDate: {
              lt: now
            }
          }
        ]
      },
      include: {
        room: {
          include: { building: true }
        },
        renter: true
      },
      orderBy: { endDate: 'asc' }
    })

    // 处理提醒数据
    const alerts = contracts.map(contract => {
      const endDate = new Date(contract.endDate)
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      let alertLevel: 'warning' | 'danger' | 'expired'
      if (daysUntilExpiry < 0) {
        alertLevel = 'expired'
      } else if (daysUntilExpiry <= 7) {
        alertLevel = 'danger'
      } else {
        alertLevel = 'warning'
      }

      return {
        id: `alert-${contract.id}`,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        renterName: contract.renter.name,
        roomInfo: `${contract.room.building.name} - ${contract.room.roomNumber}`,
        endDate: contract.endDate,
        daysUntilExpiry,
        alertLevel,
        monthlyRent: Number(contract.monthlyRent)
      }
    })

    // 统计信息
    const summary = {
      total: alerts.length,
      warning: alerts.filter(alert => alert.alertLevel === 'warning').length,
      danger: alerts.filter(alert => alert.alertLevel === 'danger').length,
      expired: alerts.filter(alert => alert.alertLevel === 'expired').length
    }

    return Response.json({
      alerts,
      summary
    })
  } catch (error) {
    console.error('获取合同到期提醒失败:', error)
    return Response.json(
      { error: '获取合同到期提醒失败' },
      { status: 500 }
    )
  }
}