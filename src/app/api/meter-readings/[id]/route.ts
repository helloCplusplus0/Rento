import { NextRequest, NextResponse } from 'next/server'

import {
  meterReadingDomainService,
} from '@/lib/domain/meters'

/**
 * 获取单个抄表记录
 * GET /api/meter-readings/[id]
 *
 * compat wrapper:
 * phase09-04 起抄表详情、recordType 结构化语义与禁删门禁统一收口到 src/lib/domain/meters。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const detail = await meterReadingDomainService.getMeterReadingDetail(id)

    return NextResponse.json({
      success: true,
      data: detail.reading,
      recordTypeSemantics: detail.recordTypeSemantics,
      deleteGuard: detail.deleteGuard,
      compatMode: true,
      migrationHost: 'src/lib/domain/meters',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'MeterReading not found') {
      return NextResponse.json(
        { success: false, error: '抄表记录不存在' },
        { status: 404 }
      )
    }

    console.error('获取抄表记录失败:', error)
    return NextResponse.json(
      { success: false, error: '获取抄表记录失败' },
      { status: 500 }
    )
  }
}

/**
 * 更新抄表记录
 * PUT /api/meter-readings/[id]
 *
 * compat wrapper:
 * phase09-04 起旧宿主不再保留第二套抄表修改语义；更新能力统一退化为显式禁用，
 * 后续如需修正历史，应通过正式宿主或专用修正流程收口。
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const detail = await meterReadingDomainService.getMeterReadingDetail(id)

    return NextResponse.json({
      success: false,
      code: 'METER_READING_UPDATE_DISABLED',
      error: 'phase09-04 起旧抄表更新入口已禁用，请改走正式宿主或专用修正流程',
      details: {
        readingId: id,
        recordTypeSemantics: detail.recordTypeSemantics,
        deleteGuard: detail.deleteGuard,
        compatBoundary: {
          currentState: 'compat-wrapper',
          targetStrategy: 'disabled',
          migrationHost: 'src/lib/domain/meters',
          reason:
            '避免旧 Next 宿主继续保留第二套抄表修改语义，导致正式宿主与 compat 入口出现双重真相。',
          exitCondition:
            '当正式修正/冲正流程冻结后，旧 src/app/api/meter-readings/[id] PUT 可直接移除。',
        },
      },
      compatMode: true,
      migrationHost: 'src/lib/domain/meters',
    }, { status: 409 })
  } catch (error) {
    if (error instanceof Error && error.message === 'MeterReading not found') {
      return NextResponse.json(
        { success: false, error: '抄表记录不存在' },
        { status: 404 }
      )
    }

    console.error('更新抄表记录失败:', error)
    return NextResponse.json(
      { success: false, error: '更新抄表记录失败' },
      { status: 500 }
    )
  }
}

/**
 * 删除抄表记录
 * DELETE /api/meter-readings/[id]
 *
 * compat wrapper:
 * phase09-04 起抄表删除能力统一降级为共享领域禁删门禁，不再保留第二套删除规则。
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleteGuard =
      await meterReadingDomainService.performMeterReadingDeleteSafetyCheck(id)

    return NextResponse.json({
      success: false,
      code: deleteGuard.errorCode,
      error: '当前阶段不支持删除抄表记录',
      details: deleteGuard,
      compatMode: true,
      migrationHost: 'src/lib/domain/meters',
    }, { status: 409 })
  } catch (error) {
    if (error instanceof Error && error.message === 'MeterReading not found') {
      return NextResponse.json(
        { success: false, error: '抄表记录不存在' },
        { status: 404 }
      )
    }

    console.error('删除抄表记录失败:', error)
    return NextResponse.json(
      { success: false, error: '删除抄表记录失败' },
      { status: 500 }
    )
  }
}
