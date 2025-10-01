import { NextRequest, NextResponse } from 'next/server'

import { billQueries, meterReadingQueries } from '@/lib/queries'

/**
 * 获取抄表记录关联账单API
 * GET /api/meter-readings/[id]/related-bills
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 获取抄表记录详情
    const reading = await meterReadingQueries.findById(id)
    if (!reading) {
      return NextResponse.json(
        { success: false, error: '抄表记录不存在' },
        { status: 404 }
      )
    }

    // 查找关联的账单
    let relatedBills: any[] = []
    let utilityBillDetails: any[] = []

    try {
      // 方法1: 通过metadata中的meterReadingIds查找
      const allBills = await billQueries.findByContract(
        reading.contractId || ''
      )

      for (const bill of allBills) {
        if (bill.type === 'UTILITIES' && bill.metadata) {
          try {
            const metadata = JSON.parse(bill.metadata)
            const meterReadingIds =
              metadata.utilityDetails?.meterReadingIds || []

            // 检查当前抄表记录是否在关联列表中
            if (meterReadingIds.includes(reading.id)) {
              relatedBills.push(bill)

              // 构建详细的水电费账单信息
              const utilityDetails = metadata.utilityDetails
              if (utilityDetails) {
                utilityBillDetails.push({
                  ...bill,
                  amount: Number(bill.amount),
                  receivedAmount: Number(bill.receivedAmount),
                  pendingAmount: Number(bill.pendingAmount),
                  utilityDetails: utilityDetails,
                })
              }
            }
          } catch (error) {
            console.error('解析账单metadata失败:', error)
          }
        }
      }

      // 方法2: 通过时间范围查找可能相关的账单（备用方法）
      if (relatedBills.length === 0 && reading.contractId) {
        const readingDate = new Date(reading.readingDate)
        const monthStart = new Date(
          readingDate.getFullYear(),
          readingDate.getMonth(),
          1
        )
        const monthEnd = new Date(
          readingDate.getFullYear(),
          readingDate.getMonth() + 1,
          0
        )

        const monthlyBills = allBills.filter((bill) => {
          if (bill.type !== 'UTILITIES') return false

          const billDate = new Date(bill.createdAt)
          return billDate >= monthStart && billDate <= monthEnd
        })

        relatedBills = monthlyBills
        utilityBillDetails = monthlyBills.map((bill) => ({
          ...bill,
          amount: Number(bill.amount),
          receivedAmount: Number(bill.receivedAmount),
          pendingAmount: Number(bill.pendingAmount),
        }))
      }
    } catch (error) {
      console.error('查询关联账单失败:', error)
    }

    // 转换抄表记录数据类型
    const readingData = {
      ...reading,
      previousReading: reading.previousReading
        ? Number(reading.previousReading)
        : null,
      currentReading: Number(reading.currentReading),
      usage: Number(reading.usage),
      unitPrice: Number(reading.unitPrice),
      amount: Number(reading.amount),
    }

    // 转换关联账单数据类型
    const relatedBillsData = relatedBills.map((bill) => ({
      ...bill,
      amount: Number(bill.amount),
      receivedAmount: Number(bill.receivedAmount),
      pendingAmount: Number(bill.pendingAmount),
    }))

    return NextResponse.json({
      success: true,
      data: {
        reading: readingData,
        relatedBills: relatedBillsData,
        billDetails: utilityBillDetails,
        summary: {
          totalBills: relatedBills.length,
          totalAmount: relatedBills.reduce(
            (sum, bill) => sum + Number(bill.amount),
            0
          ),
          paidAmount: relatedBills.reduce(
            (sum, bill) => sum + Number(bill.receivedAmount),
            0
          ),
          pendingAmount: relatedBills.reduce(
            (sum, bill) => sum + Number(bill.pendingAmount),
            0
          ),
        },
      },
    })
  } catch (error) {
    console.error('获取抄表记录关联账单失败:', error)
    return NextResponse.json(
      { success: false, error: '获取关联账单失败' },
      { status: 500 }
    )
  }
}
