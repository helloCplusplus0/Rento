import { NextRequest, NextResponse } from 'next/server'

import {
  createSuccessResponse,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import { billQueryCache } from '@/lib/bill-cache'
import { ErrorType } from '@/lib/error-logger'
import { prisma } from '@/lib/prisma'

/**
 * 统一的账单明细响应接口
 */
interface BillDetailResponse {
  success: boolean
  data: BillDetailItem[]
  metadata: {
    source: 'bill_details' | 'meter_reading' | 'related_readings' | 'empty'
    isLegacy: boolean
    totalAmount?: number
    billInfo?: {
      id: string
      billNumber: string
      type: string
      amount: number
      status: string
    }
  }
}

interface BillDetailItem {
  id: string
  billId: string
  meterReadingId: string
  meterType: string
  meterName: string
  usage: number
  unitPrice: number
  amount: number
  unit: string
  previousReading: number | null
  currentReading: number
  readingDate: string
  priceSource: string
  createdAt: string
  updatedAt: string
  meterReading?: any
}

/**
 * 获取账单明细API（优化版）
 * GET /api/bills/[id]/details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 使用缓存获取账单明细
    const result = await billQueryCache.getCachedQuery(
      {
        type: 'filter',
        filters: { billId: id, type: 'details' },
      },
      async () => {
        // 获取账单基本信息
        const bill = await prisma.bill.findUnique({
          where: { id },
          select: {
            id: true,
            billNumber: true,
            type: true,
            amount: true,
            status: true,
            meterReadingId: true,
          },
        })

        if (!bill) {
          return {
            success: false,
            data: [],
            metadata: {
              source: 'empty' as const,
              isLegacy: false,
            },
          }
        }

        // 获取账单明细
        const billDetails = await prisma.billDetail.findMany({
          where: { billId: id },
          include: {
            meterReading: {
              include: {
                meter: {
                  select: {
                    id: true,
                    displayName: true,
                    meterType: true,
                    unit: true,
                    unitPrice: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        })

        if (billDetails.length > 0) {
          const detailItems: BillDetailItem[] = billDetails.map((detail) => ({
            id: detail.id,
            billId: detail.billId,
            meterReadingId: detail.meterReadingId,
            meterType: detail.meterType,
            meterName:
              detail.meterName ||
              detail.meterReading?.meter?.displayName ||
              '未知仪表',
            usage: Number(detail.usage),
            unitPrice: Number(detail.unitPrice),
            amount: Number(detail.amount),
            unit: detail.unit,
            previousReading: detail.previousReading
              ? Number(detail.previousReading)
              : null,
            currentReading: Number(detail.currentReading),
            readingDate: detail.readingDate.toISOString(),
            priceSource: detail.priceSource || 'METER_CONFIG',
            createdAt: detail.createdAt.toISOString(),
            updatedAt: detail.updatedAt.toISOString(),
            meterReading: detail.meterReading,
          }))

          return {
            success: true,
            data: detailItems,
            metadata: {
              source: 'bill_details' as const,
              isLegacy: false,
              totalAmount: detailItems.reduce(
                (sum, item) => sum + item.amount,
                0
              ),
              billInfo: {
                id: bill.id,
                billNumber: bill.billNumber,
                type: bill.type,
                amount: Number(bill.amount),
                status: bill.status,
              },
            },
          }
        }

        // 兼容性处理：从关联的抄表记录构造明细
        if (bill.meterReadingId) {
          const meterReading = await prisma.meterReading.findUnique({
            where: { id: bill.meterReadingId },
            include: {
              meter: {
                select: {
                  id: true,
                  displayName: true,
                  meterType: true,
                  unit: true,
                  unitPrice: true,
                },
              },
            },
          })

          if (meterReading) {
            const legacyDetail: BillDetailItem = {
              id: `legacy-${meterReading.id}`,
              billId: id,
              meterReadingId: meterReading.id,
              meterType: meterReading.meter.meterType,
              meterName: meterReading.meter.displayName,
              usage: Number(meterReading.usage),
              unitPrice: Number(meterReading.unitPrice),
              amount: Number(meterReading.amount),
              unit: meterReading.meter.unit,
              previousReading: meterReading.previousReading
                ? Number(meterReading.previousReading)
                : null,
              currentReading: Number(meterReading.currentReading),
              readingDate: meterReading.readingDate.toISOString(),
              priceSource: 'METER_CONFIG',
              createdAt: meterReading.createdAt.toISOString(),
              updatedAt: meterReading.updatedAt.toISOString(),
              meterReading,
            }

            return {
              success: true,
              data: [legacyDetail],
              metadata: {
                source: 'meter_reading' as const,
                isLegacy: true,
                totalAmount: legacyDetail.amount,
                billInfo: {
                  id: bill.id,
                  billNumber: bill.billNumber,
                  type: bill.type,
                  amount: Number(bill.amount),
                  status: bill.status,
                },
              },
            }
          }
        }

        // 返回空结果
        return {
          success: true,
          data: [],
          metadata: {
            source: 'empty' as const,
            isLegacy: false,
            totalAmount: 0,
            billInfo: {
              id: bill.id,
              billNumber: bill.billNumber,
              type: bill.type,
              amount: Number(bill.amount),
              status: bill.status,
            },
          },
        }
      }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('获取账单明细失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取账单明细失败',
        data: [],
        metadata: {
          source: 'empty' as const,
          isLegacy: false,
        },
      },
      { status: 500 }
    )
  }
}
