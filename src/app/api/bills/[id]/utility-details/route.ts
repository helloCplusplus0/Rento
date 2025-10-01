import { NextRequest, NextResponse } from 'next/server'

import { billQueries, meterReadingQueries } from '@/lib/queries'

/**
 * 获取水电费账单详情API
 * GET /api/bills/[id]/utility-details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 获取账单详情
    const bill = await billQueries.findById(id)
    if (!bill) {
      return NextResponse.json(
        { success: false, error: '账单不存在' },
        { status: 404 }
      )
    }

    // 检查是否为水电费账单
    if (bill.type !== 'UTILITIES') {
      return NextResponse.json(
        { success: false, error: '不是水电费账单' },
        { status: 400 }
      )
    }

    // 解析metadata中的水电费明细
    let utilityDetails = null
    let meterReadingIds: string[] = []

    if (bill.metadata) {
      try {
        const metadata = JSON.parse(bill.metadata)
        utilityDetails = metadata.utilityDetails
        meterReadingIds = utilityDetails?.meterReadingIds || []
      } catch (error) {
        console.error('解析账单metadata失败:', error)
      }
    }

    // 获取关联的抄表记录
    let meterReadings: any[] = []
    if (meterReadingIds.length > 0) {
      try {
        // 批量查询抄表记录
        const readingPromises = meterReadingIds.map((id) =>
          meterReadingQueries.findById(id)
        )
        const readings = await Promise.all(readingPromises)
        meterReadings = readings.filter((reading) => reading !== null)
      } catch (error) {
        console.error('查询关联抄表记录失败:', error)
      }
    }

    // 构建费用明细
    const breakdown = utilityDetails?.breakdown || {}
    const meterBillDetails = []

    // 电费明细
    if (breakdown.electricity && breakdown.electricity.usage > 0) {
      meterBillDetails.push({
        meterType: 'ELECTRICITY',
        meterName: '电表',
        usage: breakdown.electricity.usage,
        unitPrice: breakdown.electricity.unitPrice,
        amount: breakdown.electricity.amount,
        unit: '度',
      })
    }

    // 水费明细
    if (breakdown.water && breakdown.water.usage > 0) {
      meterBillDetails.push({
        meterType: 'WATER',
        meterName: '水表',
        usage: breakdown.water.usage,
        unitPrice: breakdown.water.unitPrice,
        amount: breakdown.water.amount,
        unit: '吨',
      })
    }

    // 燃气费明细
    if (breakdown.gas && breakdown.gas.usage > 0) {
      meterBillDetails.push({
        meterType: 'GAS',
        meterName: '燃气表',
        usage: breakdown.gas.usage,
        unitPrice: breakdown.gas.unitPrice,
        amount: breakdown.gas.amount,
        unit: '立方米',
      })
    }

    // 计算汇总信息
    const summary = {
      totalElectricityUsage: breakdown.electricity?.usage || 0,
      totalWaterUsage: breakdown.water?.usage || 0,
      totalGasUsage: breakdown.gas?.usage || 0,
      totalElectricityCost: breakdown.electricity?.amount || 0,
      totalWaterCost: breakdown.water?.amount || 0,
      totalGasCost: breakdown.gas?.amount || 0,
      grandTotal: Number(bill.amount),
      breakdown: meterBillDetails,
    }

    // 查询同期其他账单（可选）
    const relatedBills = await billQueries.findByContract(bill.contractId)
    const samePeriodBills = relatedBills.filter(
      (b) => b.id !== bill.id && b.period === bill.period
    )

    // 转换数据类型
    const billData = {
      ...bill,
      amount: Number(bill.amount),
      receivedAmount: Number(bill.receivedAmount),
      pendingAmount: Number(bill.pendingAmount),
      utilityDetails: utilityDetails,
    }

    const meterReadingsData = meterReadings.map((reading) => ({
      ...reading,
      previousReading: reading.previousReading
        ? Number(reading.previousReading)
        : null,
      currentReading: Number(reading.currentReading),
      usage: Number(reading.usage),
      unitPrice: Number(reading.unitPrice),
      amount: Number(reading.amount),
    }))

    return NextResponse.json({
      success: true,
      data: {
        bill: billData,
        meterReadings: meterReadingsData,
        breakdown: meterBillDetails,
        summary: summary,
        relatedBills: samePeriodBills.map((b) => ({
          ...b,
          amount: Number(b.amount),
          receivedAmount: Number(b.receivedAmount),
          pendingAmount: Number(b.pendingAmount),
        })),
      },
    })
  } catch (error) {
    console.error('获取水电费账单详情失败:', error)
    return NextResponse.json(
      { success: false, error: '获取账单详情失败' },
      { status: 500 }
    )
  }
}
