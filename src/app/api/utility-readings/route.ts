import { NextRequest } from 'next/server'
import { generateUtilityBillOnReading } from '@/lib/auto-bill-generator'

/**
 * 水电抄表API
 * POST /api/utility-readings
 * 
 * 提交抄表数据并自动生成水电费账单
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证必填字段
    const { contractId, electricityUsage, waterUsage, readingDate } = body
    
    if (!contractId || electricityUsage === undefined || waterUsage === undefined || !readingDate) {
      return Response.json(
        { error: '缺少必填字段: contractId, electricityUsage, waterUsage, readingDate' },
        { status: 400 }
      )
    }

    // 验证数据类型
    if (typeof electricityUsage !== 'number' || typeof waterUsage !== 'number') {
      return Response.json(
        { error: '用量数据必须为数字类型' },
        { status: 400 }
      )
    }

    if (electricityUsage < 0 || waterUsage < 0) {
      return Response.json(
        { error: '用量数据不能为负数' },
        { status: 400 }
      )
    }

    // 构建抄表数据
    const readingData = {
      electricityUsage,
      waterUsage,
      readingDate: new Date(readingDate),
      previousReading: body.previousReading,
      currentReading: body.currentReading,
      remarks: body.remarks
    }

    // 自动生成水电费账单
    const utilityBill = await generateUtilityBillOnReading(contractId, readingData)

    return Response.json({
      success: true,
      message: '抄表成功，已自动生成水电费账单',
      reading: {
        contractId,
        electricityUsage,
        waterUsage,
        readingDate: readingData.readingDate,
        totalCost: Number(utilityBill.amount)
      },
      bill: {
        id: utilityBill.id,
        billNumber: utilityBill.billNumber,
        type: utilityBill.type,
        amount: Number(utilityBill.amount),
        dueDate: utilityBill.dueDate,
        status: utilityBill.status,
        period: utilityBill.period,
        remarks: utilityBill.remarks
      }
    })

  } catch (error) {
    console.error('水电抄表失败:', error)
    
    return Response.json(
      { 
        error: '水电抄表失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * 获取抄表历史记录
 * GET /api/utility-readings?contractId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')
    
    if (!contractId) {
      return Response.json(
        { error: '合同ID不能为空' },
        { status: 400 }
      )
    }

    // 查询该合同的水电费账单历史
    const { prisma } = await import('@/lib/prisma')
    
    const utilityBills = await prisma.bill.findMany({
      where: {
        contractId: contractId,
        type: 'UTILITIES'
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        contract: {
          include: {
            room: { include: { building: true } },
            renter: true
          }
        }
      }
    })

    // 解析抄表数据
    const readings = utilityBills.map(bill => {
      let readingData = null
      // 暂时不解析metadata，因为字段还未完全实现
      // try {
      //   const metadata = bill.metadata ? JSON.parse(bill.metadata) : null
      //   readingData = metadata?.readingData
      // } catch (e) {
      //   // 忽略解析错误
      // }

      return {
        id: bill.id,
        billNumber: bill.billNumber,
        amount: Number(bill.amount),
        dueDate: bill.dueDate,
        period: bill.period,
        status: bill.status,
        createdAt: bill.createdAt,
        readingData: readingData || {
          electricityUsage: 0,
          waterUsage: 0,
          readingDate: bill.createdAt
        },
        contract: {
          contractNumber: bill.contract.contractNumber,
          renter: bill.contract.renter.name,
          room: `${bill.contract.room.building.name} - ${bill.contract.room.roomNumber}`
        }
      }
    })

    return Response.json({
      success: true,
      contractId,
      readings
    })

  } catch (error) {
    console.error('获取抄表历史失败:', error)
    
    return Response.json(
      { 
        error: '获取抄表历史失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}