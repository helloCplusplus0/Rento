import type { RoomStatus } from '@prisma/client'
import { roomQueries } from '@/lib/queries'
import { formatRoomSearchResponse } from '@/lib/room-utils'

import {
  getRenterDetail,
  getRenterStats,
  listRenters,
} from './renters-route-service'

const PAGE_LIMIT = 100

async function collectAllRentersForLegacyPages() {
  const renters = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const result = await listRenters({
      page,
      limit: PAGE_LIMIT,
      sortField: 'name',
      sortOrder: 'asc',
    })

    renters.push(...result.renters)
    totalPages = Math.max(1, result.totalPages)
    page += 1
  }

  return renters
}

async function collectRoomsByStatusForLegacyPages(statuses: RoomStatus[]) {
  const rooms = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const result = await roomQueries.searchRooms({
      filters: {
        statuses,
      },
      pagination: {
        page,
        limit: PAGE_LIMIT,
      },
      sort: {
        field: 'roomNumber',
        order: 'asc',
      },
    })
    const payload = formatRoomSearchResponse({
      rooms: result.rooms,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      aggregations: result.aggregations,
    })

    rooms.push(...payload.rooms)
    totalPages = Math.max(1, payload.pagination.totalPages)
    page += 1
  }

  return rooms
}

/**
 * phase14-06:
 * 旧 Next 页面壳继续保留用于回滚，但页面级初始数据已改为复用正式宿主的
 * 共享 route-service / route-shape 逻辑，避免页面层继续直连另一套 query 语义。
 */
export async function loadLegacyRentersPageData() {
  const [renters, stats] = await Promise.all([
    collectAllRentersForLegacyPages(),
    getRenterStats(),
  ])

  return {
    renters,
    stats,
  }
}

export async function loadLegacyRenterDetailPageData(renterId: string) {
  return getRenterDetail(renterId)
}

export async function loadLegacyContractCreatePageData(params: {
  roomId?: string
  renterId?: string
}) {
  const [renters, availableRooms] = await Promise.all([
    collectAllRentersForLegacyPages(),
    collectRoomsByStatusForLegacyPages(['VACANT']),
  ])

  return {
    renters,
    availableRooms,
    preselectedRoomId: params.roomId,
    preselectedRenterId: params.renterId,
  }
}
