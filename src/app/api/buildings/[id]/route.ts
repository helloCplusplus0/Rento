import { NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { prisma } from '@/lib/prisma'
import { buildingQueries } from '@/lib/queries'

/**
 * 获取楼栋详情
 * GET /api/buildings/[id]
 */
async function handleGetBuilding(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const building = await buildingQueries.findById(id)
  if (!building) {
    return NextResponse.json({ error: '楼栋不存在' }, { status: 404 })
  }

  const buildingData = {
    ...building,
    totalRooms: Number(building.totalRooms),
  }

  return NextResponse.json(buildingData)
}

export const GET = withApiErrorHandler(handleGetBuilding, {
  requireAuth: true,
  module: 'building-detail-api',
  errorType: ErrorType.DATABASE_ERROR,
})

/**
 * 更新楼栋信息
 * PUT /api/buildings/[id]
 */
async function handlePutBuilding(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, address, description } = body

  const existingBuilding = await buildingQueries.findById(id)
  if (!existingBuilding) {
    return NextResponse.json({ error: '楼栋不存在' }, { status: 404 })
  }

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

  const updatedBuilding = await buildingQueries.update(id, {
    name: name.trim(),
    address: address?.trim() || undefined,
    description: description?.trim() || undefined,
  })

  const buildingData = {
    ...updatedBuilding,
    totalRooms: Number(updatedBuilding.totalRooms),
  }

  return NextResponse.json(buildingData)
}

export const PUT = withApiErrorHandler(handlePutBuilding, {
  requireAuth: true,
  module: 'building-detail-api',
  errorType: ErrorType.VALIDATION_ERROR,
})

/**
 * 删除楼栋
 * DELETE /api/buildings/[id]
 */
async function handleDeleteBuilding(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const building = await buildingQueries.findById(id)
  if (!building) {
    return NextResponse.json({ error: '楼栋不存在' }, { status: 404 })
  }

  const roomCount = await prisma.room.count({
    where: { buildingId: id },
  })

  if (roomCount > 0) {
    return NextResponse.json(
      {
        error: '无法删除包含房间的楼栋',
        details: {
          roomCount,
          message: '为了数据安全，请先删除楼栋下的所有房间，然后再删除楼栋',
        },
      },
      { status: 400 }
    )
  }

  await buildingQueries.delete(id)

  return NextResponse.json({
    success: true,
    message: '空楼栋删除成功',
  })
}

export const DELETE = withApiErrorHandler(handleDeleteBuilding, {
  requireAuth: true,
  module: 'building-detail-api',
  errorType: ErrorType.VALIDATION_ERROR,
})
