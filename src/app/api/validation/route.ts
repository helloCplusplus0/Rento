import { NextRequest, NextResponse } from 'next/server'

import { BusinessFlowValidator } from '@/lib/business-flow-validator'
import { ErrorLogger, ErrorSeverity, ErrorType } from '@/lib/error-logger'

const logger = ErrorLogger.getInstance()

/**
 * 启动核心业务流程验证
 */
export async function POST(request: NextRequest) {
  try {
    logger.logInfo('启动核心业务流程验证', {
      module: 'validation-api',
      endpoint: 'POST /api/validation',
    })

    const validator = new BusinessFlowValidator()
    const report = await validator.validateAllFlows()

    logger.logInfo('核心业务流程验证完成', {
      module: 'validation-api',
      report: {
        overallSuccess: report.overallSuccess,
        successfulFlows: report.successfulFlows,
        failedFlows: report.failedFlows,
        executionTime: report.executionTime,
      },
    })

    return NextResponse.json({
      success: true,
      data: report,
      message: '核心业务流程验证完成',
    })
  } catch (error) {
    await logger.logError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.HIGH,
      '核心业务流程验证失败',
      {
        module: 'validation-api',
        endpoint: 'POST /api/validation',
      },
      error as Error
    )

    return NextResponse.json(
      {
        success: false,
        error: '验证执行失败',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

/**
 * 获取验证状态和历史报告
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'status') {
      // 返回验证系统状态
      return NextResponse.json({
        success: true,
        data: {
          status: 'ready',
          lastValidation: null,
          availableFlows: [
            'RoomManagement',
            'BillGeneration',
            'MeterReading',
            'ContractLifecycle',
            'DataConsistency',
          ],
        },
      })
    }

    if (action === 'health') {
      // 验证系统健康检查
      return NextResponse.json({
        success: true,
        data: {
          healthy: true,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: '无效的查询参数',
      },
      { status: 400 }
    )
  } catch (error) {
    await logger.logError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.MEDIUM,
      '获取验证状态失败',
      {
        module: 'validation-api',
        endpoint: 'GET /api/validation',
      },
      error as Error
    )

    return NextResponse.json(
      {
        success: false,
        error: '获取状态失败',
        details: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
