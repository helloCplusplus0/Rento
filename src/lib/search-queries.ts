import { prisma } from '@/lib/prisma'

/**
 * 搜索房间
 */
export async function searchRooms(query: string) {
  try {
    if (!query.trim()) {
      return []
    }

    const rooms = await prisma.room.findMany({
      where: {
        OR: [
          { roomNumber: { contains: query } },
          { currentRenter: { contains: query } },
          { building: { name: { contains: query } } },
        ],
      },
      include: {
        building: true,
        contracts: {
          where: { status: 'ACTIVE' },
          include: { renter: true },
        },
      },
      take: 10,
      orderBy: [
        { building: { name: 'asc' } },
        { floorNumber: 'asc' },
        { roomNumber: 'asc' },
      ],
    })

    return rooms
  } catch (error) {
    console.error('搜索房间失败:', error)
    return []
  }
}

/**
 * 搜索合同
 */
export async function searchContracts(query: string) {
  try {
    if (!query.trim()) {
      return []
    }

    const contracts = await prisma.contract.findMany({
      where: {
        OR: [
          { contractNumber: { contains: query } },
          { renter: { name: { contains: query } } },
          { renter: { phone: { contains: query } } },
        ],
      },
      include: {
        room: {
          include: { building: true },
        },
        renter: true,
        bills: {
          where: { status: { in: ['PENDING', 'OVERDUE'] } },
          take: 3,
          orderBy: { dueDate: 'desc' },
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    return contracts
  } catch (error) {
    console.error('搜索合同失败:', error)
    return []
  }
}

/**
 * 获取搜索建议
 */
export async function getSearchSuggestions(query: string) {
  try {
    if (!query.trim() || query.length < 2) {
      return { rooms: [], contracts: [] }
    }

    // 获取房间建议
    const roomSuggestions = await prisma.room.findMany({
      where: {
        OR: [
          { roomNumber: { contains: query } },
          { currentRenter: { contains: query } },
        ],
      },
      select: {
        id: true,
        roomNumber: true,
        currentRenter: true,
        building: {
          select: { name: true },
        },
      },
      take: 5,
    })

    // 获取合同建议
    const contractSuggestions = await prisma.contract.findMany({
      where: {
        OR: [
          { contractNumber: { contains: query } },
          { renter: { name: { contains: query } } },
        ],
      },
      select: {
        id: true,
        contractNumber: true,
        renter: {
          select: { name: true },
        },
        room: {
          select: {
            roomNumber: true,
            building: { select: { name: true } },
          },
        },
      },
      take: 5,
    })

    return {
      rooms: roomSuggestions,
      contracts: contractSuggestions,
    }
  } catch (error) {
    console.error('获取搜索建议失败:', error)
    return { rooms: [], contracts: [] }
  }
}
