import { NextRequest } from 'next/server'

import {
  deleteRenterPageClosureData,
  getRenterDetailPageClosureData,
  updateRenterPageClosureData,
} from '@/lib/page-closure-compat/renters'

/**
 * phase13-04 page-closure compat:
 * Next 与 Hono 共用 shared helper，保证租客详情/编辑/删除在页面闭环阶段
 * 仍只有一套兼容逻辑，而不是提前把 API 责任切到正式宿主。
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const renter = await getRenterDetailPageClosureData(id)

    if (!renter) {
      return Response.json({ error: 'Renter not found' }, { status: 404 })
    }

    return Response.json(renter)
  } catch (error) {
    console.error('Failed to fetch renter:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const result = await updateRenterPageClosureData(id, data)

    if ('error' in result) {
      return Response.json({ error: result.error }, { status: result.status })
    }

    return Response.json(result.data)
  } catch (error) {
    console.error('Failed to update renter:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await deleteRenterPageClosureData(id)

    if ('error' in result) {
      return Response.json({ error: result.error }, { status: result.status })
    }

    return Response.json(result.data)
  } catch (error) {
    console.error('Failed to delete renter:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
