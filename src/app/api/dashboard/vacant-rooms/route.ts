import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'
import { prisma } from '@/lib/prisma'

/**
 * 获取空房详细信息
 */
async function handleGetVacantRooms(_request: NextRequest) {
  const rooms = await prisma.room.findMany({
    where: {
      status: 'VACANT',
    },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
    orderBy: [{ building: { name: 'asc' } }, { roomNumber: 'asc' }],
  })

  // 转换数据类型
  const roomsData = rooms.map((room) => ({
    ...room,
    rent: Number(room.rent),
    area: room.area ? Number(room.area) : null,
  }))

  return createSuccessResponse({
    rooms: roomsData,
    total: rooms.length,
  })
}

export const GET = withApiErrorHandler(handleGetVacantRooms, {
  module: 'vacant-rooms-api',
  errorType: ErrorType.DATABASE_ERROR,
})
