import { NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { buildingQueries } from '@/lib/queries'

/**
 * 创建新楼栋
 * POST /api/buildings
 */
async function handlePostBuildings(request: NextRequest) {
  const body = await request.json()
  const { name, address, description } = body

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: '楼栋名称不能为空' }, { status: 400 })
  }

  if (name.trim().length > 100) {
    return NextResponse.json(
      { error: '楼栋名称不能超过100个字符' },
      { status: 400 }
    )
  }

  if (address && address.length > 200) {
    return NextResponse.json(
      { error: '楼栋地址不能超过200个字符' },
      { status: 400 }
    )
  }

  if (description && description.length > 500) {
    return NextResponse.json(
      { error: '楼栋描述不能超过500个字符' },
      { status: 400 }
    )
  }

  const building = await buildingQueries.create({
    name: name.trim(),
    address: address?.trim() || undefined,
    description: description?.trim() || undefined,
  })

  const buildingData = {
    ...building,
    totalRooms: Number(building.totalRooms),
  }

  return NextResponse.json(buildingData, { status: 201 })
}

export const POST = withApiErrorHandler(handlePostBuildings, {
  requireAuth: true,
  module: 'buildings-api',
  errorType: ErrorType.VALIDATION_ERROR,
})

/**
 * 获取所有楼栋
 * GET /api/buildings
 */
async function handleGetBuildings(_request: NextRequest) {
  const buildings = await buildingQueries.findAll()

  const buildingsData = buildings.map((building) => ({
    ...building,
    totalRooms: Number(building.totalRooms),
  }))

  return NextResponse.json(buildingsData)
}

export const GET = withApiErrorHandler(handleGetBuildings, {
  requireAuth: true,
  module: 'buildings-api',
  errorType: ErrorType.DATABASE_ERROR,
})
