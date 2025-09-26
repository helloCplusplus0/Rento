import { NextRequest } from 'next/server'
import { buildingQueries } from '@/lib/queries'
import { prisma } from '@/lib/prisma'

/**
 * 获取楼栋详情
 * GET /api/buildings/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const building = await buildingQueries.findById(id)
    if (!building) {
      return Response.json(
        { error: '楼栋不存在' },
        { status: 404 }
      )
    }
    
    // 转换Decimal类型
    const buildingData = {
      ...building,
      totalRooms: Number(building.totalRooms)
    }
    
    return Response.json(buildingData)
  } catch (error) {
    console.error('Failed to get building:', error)
    return Response.json(
      { error: '获取楼栋信息失败' },
      { status: 500 }
    )
  }
}

/**
 * 更新楼栋信息
 * PUT /api/buildings/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, address, description } = body
    
    // 检查楼栋是否存在
    const existingBuilding = await buildingQueries.findById(id)
    if (!existingBuilding) {
      return Response.json(
        { error: '楼栋不存在' },
        { status: 404 }
      )
    }
    
    // 验证必填字段
    if (!name || typeof name !== 'string' || !name.trim()) {
      return Response.json(
        { error: '楼栋名称不能为空' },
        { status: 400 }
      )
    }
    
    // 验证字段长度
    if (name.trim().length > 100) {
      return Response.json(
        { error: '楼栋名称不能超过100个字符' },
        { status: 400 }
      )
    }
    
    if (address && address.length > 200) {
      return Response.json(
        { error: '楼栋地址不能超过200个字符' },
        { status: 400 }
      )
    }
    
    if (description && description.length > 500) {
      return Response.json(
        { error: '楼栋描述不能超过500个字符' },
        { status: 500 }
      )
    }
    
    // 更新楼栋
    const updatedBuilding = await buildingQueries.update(id, {
      name: name.trim(),
      address: address?.trim() || undefined,
      description: description?.trim() || undefined
    })
    
    // 转换Decimal类型
    const buildingData = {
      ...updatedBuilding,
      totalRooms: Number(updatedBuilding.totalRooms)
    }
    
    return Response.json(buildingData)
  } catch (error) {
    console.error('Failed to update building:', error)
    
    // 检查是否是数据库约束错误
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return Response.json(
        { error: '楼栋名称已存在' },
        { status: 409 }
      )
    }
    
    return Response.json(
      { error: '更新楼栋失败' },
      { status: 500 }
    )
  }
}

/**
 * 删除楼栋
 * DELETE /api/buildings/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 检查楼栋是否存在
    const building = await buildingQueries.findById(id)
    if (!building) {
      return Response.json(
        { error: '楼栋不存在' },
        { status: 404 }
      )
    }
    
    // 检查是否有关联的房间
    const roomCount = await prisma.room.count({
      where: { buildingId: id }
    })
    
    // 最佳实践：严格禁止删除包含房间的楼栋
    if (roomCount > 0) {
      return Response.json({
        error: '无法删除包含房间的楼栋',
        details: {
          roomCount,
          message: '为了数据安全，请先删除楼栋下的所有房间，然后再删除楼栋'
        }
      }, { status: 400 })
    }
    
    // 只删除空楼栋
    await buildingQueries.delete(id)
    
    return Response.json({
      success: true,
      message: '空楼栋删除成功'
    })
  } catch (error) {
    console.error('Failed to delete building:', error)
    return Response.json(
      { error: '删除楼栋失败' },
      { status: 500 }
    )
  }
}