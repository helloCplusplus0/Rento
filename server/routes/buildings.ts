import { revalidateMutationPaths } from '@/lib/mutation-revalidation'
import { prisma } from '@/lib/prisma'
import { buildingQueries } from '@/lib/queries'

import type { AuthAppEnv } from '../lib/auth-context'
import type { MinixServerEnv } from '../lib/env'
import { readJsonBody } from '../lib/api-responses'
import { requireAuth } from '../middleware/require-auth'
import { Hono } from 'hono'

interface BuildingMutationPayload {
  name?: string
  address?: string
  description?: string
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function transformBuilding<TBuilding extends { totalRooms: unknown }>(
  building: TBuilding | null | undefined
) {
  if (!building) {
    return building
  }

  return {
    ...building,
    totalRooms: Number(building.totalRooms),
  }
}

function validateBuildingPayload(body: BuildingMutationPayload) {
  const name = normalizeOptionalText(body.name)
  const address = normalizeOptionalText(body.address)
  const description = normalizeOptionalText(body.description)

  if (!name) {
    return {
      error: '楼栋名称不能为空',
    }
  }

  if (name.length > 100) {
    return {
      error: '楼栋名称不能超过100个字符',
    }
  }

  if (address && address.length > 200) {
    return {
      error: '楼栋地址不能超过200个字符',
    }
  }

  if (description && description.length > 500) {
    return {
      error: '楼栋描述不能超过500个字符',
    }
  }

  return {
    name,
    address,
    description,
  }
}

/**
 * phase13-03 为 `/add/room` 内嵌的 AddRoomRoute / BuildingSelector 最小补齐楼栋 CRUD。
 * 当前该路由已作为 `/api/buildings*` 的正式宿主，继续复用旧 src/app/api/buildings/**
 * 的响应体语义，不引入新的 envelope；旧 Next 入口仅保留旧运行线回滚价值。
 */
export function createBuildingRoutes(env: MinixServerEnv) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())

  routeApp.get('/', async (c) => {
    const buildings = await buildingQueries.findAll()

    return c.json(buildings.map((building) => transformBuilding(building)))
  })

  routeApp.post('/', async (c) => {
    const body = (await readJsonBody<BuildingMutationPayload>(c, {
      maxBytes: env.requestGovernance.maxRequestSize,
    })) ?? {}
    const validated = validateBuildingPayload(body)

    if ('error' in validated) {
      return c.json({ error: validated.error }, 400)
    }

    const building = await buildingQueries.create(validated)

    await revalidateMutationPaths({
      scopes: ['dashboard', 'rooms'],
      extraTargets: [{ path: '/add/room' }],
    })

    return c.json(transformBuilding(building), 201)
  })

  routeApp.get('/:id', async (c) => {
    const building = await buildingQueries.findById(c.req.param('id'))

    if (!building) {
      return c.json({ error: '楼栋不存在' }, 404)
    }

    return c.json(transformBuilding(building))
  })

  routeApp.put('/:id', async (c) => {
    const buildingId = c.req.param('id')
    const existingBuilding = await buildingQueries.findById(buildingId)

    if (!existingBuilding) {
      return c.json({ error: '楼栋不存在' }, 404)
    }

    const body = (await readJsonBody<BuildingMutationPayload>(c, {
      maxBytes: env.requestGovernance.maxRequestSize,
    })) ?? {}
    const validated = validateBuildingPayload(body)

    if ('error' in validated) {
      return c.json({ error: validated.error }, 400)
    }

    const updatedBuilding = await buildingQueries.update(buildingId, validated)

    await revalidateMutationPaths({
      scopes: ['dashboard', 'rooms'],
      extraTargets: [{ path: '/add/room' }],
    })

    return c.json(transformBuilding(updatedBuilding))
  })

  routeApp.delete('/:id', async (c) => {
    const buildingId = c.req.param('id')
    const building = await buildingQueries.findById(buildingId)

    if (!building) {
      return c.json({ error: '楼栋不存在' }, 404)
    }

    const roomCount = await prisma.room.count({
      where: { buildingId },
    })

    if (roomCount > 0) {
      return c.json(
        {
          error: '无法删除包含房间的楼栋',
          details: {
            roomCount,
            message: '为了数据安全，请先删除楼栋下的所有房间，然后再删除楼栋',
          },
        },
        400
      )
    }

    await buildingQueries.delete(buildingId)

    await revalidateMutationPaths({
      scopes: ['dashboard', 'rooms'],
      extraTargets: [{ path: '/add/room' }],
    })

    return c.json({
      success: true,
      message: '空楼栋删除成功',
    })
  })

  return routeApp
}
