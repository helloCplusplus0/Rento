import { NextRequest } from 'next/server'

import {
  generateLegacyUtilityBillCompat,
  isMeterReadingDomainValidationError,
  listContractUtilityBillHistory,
} from '@/lib/domain/meters'

/**
 * 水电抄表API
 * POST /api/utility-readings
 *
 * 提交抄表数据并自动生成水电费账单
 *
 * compat wrapper:
 * phase09-04 起自动出账共享语义迁入 src/lib/domain/meters，
 * 该入口仅保留历史调用兼容，不再维护第二套账单生成规则。
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证必填字段
    const { contractId, electricityUsage, waterUsage, readingDate } = body

    if (
      !contractId ||
      electricityUsage === undefined ||
      waterUsage === undefined ||
      !readingDate
    ) {
      return Response.json(
        {
          error:
            '缺少必填字段: contractId, electricityUsage, waterUsage, readingDate',
        },
        { status: 400 }
      )
    }

    // 验证数据类型
    if (
      typeof electricityUsage !== 'number' ||
      typeof waterUsage !== 'number'
    ) {
      return Response.json({ error: '用量数据必须为数字类型' }, { status: 400 })
    }

    if (electricityUsage < 0 || waterUsage < 0) {
      return Response.json({ error: '用量数据不能为负数' }, { status: 400 })
    }

    const result = await generateLegacyUtilityBillCompat({
      contractId,
      electricityUsage,
      waterUsage,
      gasUsage: body.gasUsage,
      readingDate,
      previousReading: body.previousReading,
      currentReading: body.currentReading,
      remarks: body.remarks,
    })

    return Response.json({
      success: true,
      message: '抄表成功，已自动生成水电费账单',
      reading: result.reading,
      bill: result.bill,
      compatMode: true,
      migrationHost: 'src/lib/domain/meters',
    })
  } catch (error) {
    if (isMeterReadingDomainValidationError(error)) {
      return Response.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          compatMode: true,
          migrationHost: 'src/lib/domain/meters',
        },
        { status: 400 }
      )
    }

    console.error('水电抄表失败:', error)

    return Response.json(
      {
        error: '水电抄表失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

/**
 * 获取抄表历史记录
 * GET /api/utility-readings?contractId=xxx
 *
 * compat wrapper:
 * phase09-04 起合同水电账单历史由 src/lib/domain/meters 提供统一追溯结果。
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')

    if (!contractId) {
      return Response.json({ error: '合同ID不能为空' }, { status: 400 })
    }

    const readings = await listContractUtilityBillHistory(contractId)

    return Response.json({
      success: true,
      contractId,
      readings,
      compatMode: true,
      migrationHost: 'src/lib/domain/meters',
    })
  } catch (error) {
    console.error('获取抄表历史失败:', error)

    return Response.json(
      {
        error: '获取抄表历史失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}
