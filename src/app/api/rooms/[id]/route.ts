import { NextRequest } from 'next/server'
import { roomQueries } from '@/lib/queries'
import { performDeleteSafetyCheck } from '@/lib/validation'
import { transformRoomDecimalFields } from '@/lib/room-utils'
import { prisma } from '@/lib/prisma'

/**
 * 删除房间API（支持级联删除）
 * DELETE /api/rooms/[id]
 * 
 * 查询参数:
 * - force: 强制删除（true/false）
 * - archive: 归档相关数据（true/false）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    const archive = searchParams.get('archive') === 'true'
    
    // 执行安全检查
    const safetyCheck = await performDeleteSafetyCheck(id)
    
    if (safetyCheck.hasRelatedData && !force) {
      return Response.json({
        error: 'Cannot delete room with related data',
        details: {
          hasActiveContracts: safetyCheck.hasActiveContracts,
          activeContractCount: safetyCheck.activeContractCount,
          hasUnpaidBills: safetyCheck.hasUnpaidBills,
          unpaidBillCount: safetyCheck.unpaidBillCount,
          relatedDataTypes: safetyCheck.relatedDataTypes
        },
        suggestion: 'Use force=true parameter to force delete or archive=true to archive related data'
      }, { status: 400 })
    }
    
    // 执行级联删除
    const result = await cascadeDeleteRoom(id, { force, archiveData: archive })
    
    return Response.json(result)
  } catch (error: any) {
    console.error('Failed to delete room:', error)
    
    if (error.message === 'Room not found') {
      return Response.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 获取房间详情API
 * GET /api/rooms/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const room = await roomQueries.findById(id)
    
    if (!room) {
      return Response.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }
    
    // 转换 Decimal 类型
    const roomData = transformRoomDecimalFields(room)
    
    return Response.json(roomData)
  } catch (error) {
    console.error('Failed to get room:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 更新房间信息API
 * PUT /api/rooms/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updateData = await request.json()
    
    // 检查房间是否存在
    const existingRoom = await roomQueries.findById(id)
    if (!existingRoom) {
      return Response.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }
    
    // 如果更新房间号，检查唯一性
    if (updateData.roomNumber && updateData.roomNumber !== existingRoom.roomNumber) {
      const duplicateRoom = await prisma.room.findFirst({
        where: {
          buildingId: existingRoom.buildingId,
          roomNumber: updateData.roomNumber,
          id: { not: id }
        }
      })
      
      if (duplicateRoom) {
        return Response.json(
          { error: 'Room number already exists in this building' },
          { status: 409 }
        )
      }
    }
    
    // 更新房间
    const updatedRoom = await roomQueries.update(id, updateData)
    
    if (!updatedRoom) {
      return Response.json(
        { error: 'Failed to update room' },
        { status: 500 }
      )
    }
    
    // 转换 Decimal 类型
    const roomData = transformRoomDecimalFields(updatedRoom)
    
    return Response.json(roomData)
  } catch (error) {
    console.error('Failed to update room:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 级联删除房间
 */
async function cascadeDeleteRoom(
  roomId: string, 
  options: { force?: boolean; archiveData?: boolean } = {}
) {
  return await prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({
      where: { id: roomId },
      include: {
        contracts: {
          include: {
            bills: true
          }
        }
      }
    })
    
    if (!room) {
      throw new Error('Room not found')
    }
    
    let archivedContracts = 0
    let archivedBills = 0
    
    // 处理相关合同和账单
    for (const contract of room.contracts) {
      if (options.archiveData) {
        // 归档账单
         await tx.bill.updateMany({
           where: { contractId: contract.id },
           data: { status: 'COMPLETED' }
         })
        archivedBills += contract.bills.length
        
        // 归档合同
        await tx.contract.update({
          where: { id: contract.id },
          data: { status: 'TERMINATED' }
        })
        archivedContracts += 1
      } else {
        // 删除账单
        await tx.bill.deleteMany({
          where: { contractId: contract.id }
        })
        
        // 删除合同
        await tx.contract.delete({
          where: { id: contract.id }
        })
      }
    }
    
    // 删除房间
    await tx.room.delete({ where: { id: roomId } })
    
    // 更新楼栋房间计数
    await tx.building.update({
      where: { id: room.buildingId },
      data: { totalRooms: { decrement: 1 } }
    })
    
    return {
      success: true,
      deletedRoomId: roomId,
      archivedData: options.archiveData || false,
      affectedRecords: {
        contracts: archivedContracts,
        bills: archivedBills
      }
    }
  })
}