import { NextRequest } from 'next/server'

import { buildingQueries } from '@/lib/queries'

/**
 * 创建新楼栋
 * POST /api/buildings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, description } = body

    // 验证必填字段
    if (!name || typeof name !== 'string' || !name.trim()) {
      return Response.json({ error: '楼栋名称不能为空' }, { status: 400 })
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
        { status: 400 }
      )
    }

    // 创建楼栋
    const building = await buildingQueries.create({
      name: name.trim(),
      address: address?.trim() || undefined,
      description: description?.trim() || undefined,
    })

    // 转换Decimal类型
    const buildingData = {
      ...building,
      totalRooms: Number(building.totalRooms),
    }

    return Response.json(buildingData, { status: 201 })
  } catch (error) {
    console.error('Failed to create building:', error)

    // 检查是否是数据库约束错误
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return Response.json({ error: '楼栋名称已存在' }, { status: 409 })
    }

    return Response.json({ error: '创建楼栋失败，请重试' }, { status: 500 })
  }
}

/**
 * 获取所有楼栋
 * GET /api/buildings
 */
export async function GET() {
  try {
    const buildings = await buildingQueries.findAll()

    // 转换Decimal类型
    const buildingsData = buildings.map((building) => ({
      ...building,
      totalRooms: Number(building.totalRooms),
    }))

    return Response.json(buildingsData)
  } catch (error) {
    console.error('Failed to fetch buildings:', error)
    return Response.json({ error: '获取楼栋列表失败' }, { status: 500 })
  }
}
