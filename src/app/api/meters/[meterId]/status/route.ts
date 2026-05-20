import { NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { meterQueries } from '@/lib/queries'

/**
 * 切换仪表状态
 * PATCH /api/meters/[meterId]/status
 */
async function handlePatchMeterStatus(
  request: NextRequest,
  { params }: { params: Promise<{ meterId: string }> }
) {
  const { meterId } = await params
  const { isActive } = await request.json()

  if (typeof isActive !== 'boolean') {
    return NextResponse.json(
      { error: 'isActive must be a boolean' },
      { status: 400 }
    )
  }

  const existingMeter = await meterQueries.findById(meterId)
  if (!existingMeter) {
    return NextResponse.json({ error: 'Meter not found' }, { status: 404 })
  }

  const updatedMeter = await meterQueries.update(meterId, { isActive })
  const meterData = {
    ...updatedMeter,
    unitPrice: Number(updatedMeter.unitPrice),
    readings:
      updatedMeter.readings?.map((reading: any) => ({
        ...reading,
        previousReading: reading.previousReading
          ? Number(reading.previousReading)
          : null,
        currentReading: Number(reading.currentReading),
        usage: Number(reading.usage),
        unitPrice: Number(reading.unitPrice),
        amount: Number(reading.amount),
      })) || [],
  }

  return NextResponse.json(meterData)
}

export const PATCH = withApiErrorHandler(handlePatchMeterStatus, {
  requireAuth: true,
  module: 'meter-status-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
