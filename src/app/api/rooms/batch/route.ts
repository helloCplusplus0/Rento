import { NextRequest } from 'next/server'
import { roomQueries, buildingQueries } from '@/lib/queries'
import { prisma } from '@/lib/prisma'

interface RoomData {
  roomNumber: string
  floorNumber: number
  roomType: 'SHARED' | 'WHOLE' | 'SINGLE'
  area?: number
  rent: number
}

/**
 * 批量创建房间
 * POST /api/rooms/batch
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { buildingId, rooms } = body
    
    // 验证必填字段
    if (!buildingId || typeof buildingId !== 'string') {
      return Response.json(
        { error: '楼栋ID不能为空' },
        { status: 400 }
      )
    }
    
    if (!Array.isArray(rooms) || rooms.length === 0) {
      return Response.json(
        { error: '房间数据不能为空' },
        { status: 400 }
      )
    }
    
    // 限制批量创建数量
    if (rooms.length > 100) {
      return Response.json(
        { error: '单次最多创建100间房间' },
        { status: 400 }
      )
    }
    
    // 验证楼栋存在
    const building = await buildingQueries.findById(buildingId)
    if (!building) {
      return Response.json(
        { error: '楼栋不存在' },
        { status: 404 }
      )
    }
    
    // 验证房间数据
    const validatedRooms: RoomData[] = []
    const roomNumbers = new Set<string>()
    
    for (const roomData of rooms) {
      // 验证房间号
      if (!roomData.roomNumber || typeof roomData.roomNumber !== 'string') {
        return Response.json(
          { error: '房间号不能为空' },
          { status: 400 }
        )
      }
      
      const roomNumber = roomData.roomNumber.trim()
      if (roomNumber.length === 0 || roomNumber.length > 20) {
        return Response.json(
          { error: '房间号长度必须在1-20个字符之间' },
          { status: 400 }
        )
      }
      
      // 检查房间号重复
      if (roomNumbers.has(roomNumber)) {
        return Response.json(
          { error: `房间号 ${roomNumber} 重复` },
          { status: 400 }
        )
      }
      roomNumbers.add(roomNumber)
      
      // 验证楼层
      const floorNumber = parseInt(roomData.floorNumber)
      if (isNaN(floorNumber) || floorNumber < 1 || floorNumber > 50) {
        return Response.json(
          { error: '楼层必须在1-50之间' },
          { status: 400 }
        )
      }
      
      // 验证房间类型
      if (!['SHARED', 'WHOLE', 'SINGLE'].includes(roomData.roomType)) {
        return Response.json(
          { error: '房间类型无效' },
          { status: 400 }
        )
      }
      
      // 验证面积
      let area: number | undefined
      if (roomData.area !== undefined) {
        area = parseFloat(roomData.area)
        if (isNaN(area) || area <= 0 || area > 1000) {
          return Response.json(
            { error: '房间面积必须在0-1000平方米之间' },
            { status: 400 }
          )
        }
      }
      
      // 验证租金
      const rent = parseFloat(roomData.rent)
      if (isNaN(rent) || rent <= 0 || rent > 100000) {
        return Response.json(
          { error: '租金必须在0-100000元之间' },
          { status: 400 }
        )
      }
      
      validatedRooms.push({
        roomNumber,
        floorNumber,
        roomType: roomData.roomType,
        area,
        rent
      })
    }
    
    // 检查房间号是否已存在
    const existingRooms = await prisma.room.findMany({
      where: {
        buildingId,
        roomNumber: {
          in: Array.from(roomNumbers)
        }
      },
      select: { roomNumber: true }
    })
    
    if (existingRooms.length > 0) {
      const duplicateNumbers = existingRooms.map(r => r.roomNumber).join(', ')
      return Response.json(
        { error: `房间号已存在: ${duplicateNumbers}` },
        { status: 409 }
      )
    }
    
    // 使用事务批量创建房间
    const result = await prisma.$transaction(async (tx) => {
      // 批量创建房间
      const createdRooms = []
      for (const roomData of validatedRooms) {
        const room = await tx.room.create({
          data: {
            ...roomData,
            buildingId,
            status: 'VACANT' // 默认状态为空房
          },
          include: { building: true }
        })
        createdRooms.push(room)
      }
      
      // 更新楼栋房间总数
      await tx.building.update({
        where: { id: buildingId },
        data: {
          totalRooms: {
            increment: validatedRooms.length
          }
        }
      })
      
      return createdRooms
    })
    
    // 转换Decimal类型
    const roomsData = result.map(room => ({
      ...room,
      rent: Number(room.rent),
      area: room.area ? Number(room.area) : null,
      building: {
        ...room.building,
        totalRooms: Number(room.building.totalRooms)
      }
    }))
    
    return Response.json({
      success: true,
      rooms: roomsData,
      count: roomsData.length,
      message: `成功创建 ${roomsData.length} 间房间`
    }, { status: 201 })
    
  } catch (error) {
    console.error('Failed to create rooms:', error)
    
    // 检查是否是数据库约束错误
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return Response.json(
        { error: '房间号已存在，请检查后重试' },
        { status: 409 }
      )
    }
    
    return Response.json(
      { error: '批量创建房间失败，请重试' },
      { status: 500 }
    )
  }
}