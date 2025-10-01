import { NextRequest } from 'next/server'

import { renterQueries } from '@/lib/queries'

/**
 * 获取租客详情API
 * GET /api/renters/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const renter = await renterQueries.findById(id)

    if (!renter) {
      return Response.json({ error: 'Renter not found' }, { status: 404 })
    }

    // 转换 Decimal 类型为 number
    const renterData = {
      ...renter,
      contracts: renter.contracts.map((contract) => ({
        ...contract,
        monthlyRent: Number(contract.monthlyRent),
        totalRent: Number(contract.totalRent),
        deposit: Number(contract.deposit),
        keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
        cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
        bills: contract.bills.map((bill) => ({
          ...bill,
          amount: Number(bill.amount),
          receivedAmount: Number(bill.receivedAmount),
          pendingAmount: Number(bill.pendingAmount),
        })),
      })),
    }

    return Response.json(renterData)
  } catch (error) {
    console.error('Failed to fetch renter:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * 更新租客信息API
 * PUT /api/renters/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // 检查租客是否存在
    const existingRenter = await renterQueries.findById(id)
    if (!existingRenter) {
      return Response.json({ error: 'Renter not found' }, { status: 404 })
    }

    // 如果更新手机号，检查是否与其他租客冲突
    if (data.phone && data.phone !== existingRenter.phone) {
      const phoneExists = await renterQueries.findByPhone(data.phone)
      if (phoneExists) {
        return Response.json(
          { error: 'Phone number already exists' },
          { status: 409 }
        )
      }
    }

    // 处理日期字段
    const updateData = {
      ...data,
      moveInDate: data.moveInDate ? new Date(data.moveInDate) : undefined,
    }

    const updatedRenter = await renterQueries.update(id, updateData)
    return Response.json(updatedRenter)
  } catch (error) {
    console.error('Failed to update renter:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * 删除租客API
 * DELETE /api/renters/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 检查租客是否存在
    const existingRenter = await renterQueries.findById(id)
    if (!existingRenter) {
      return Response.json({ error: 'Renter not found' }, { status: 404 })
    }

    // 检查是否有活跃合同
    const hasActiveContract = existingRenter.contracts.some(
      (c) => c.status === 'ACTIVE'
    )
    if (hasActiveContract) {
      return Response.json(
        { error: 'Cannot delete renter with active contracts' },
        { status: 400 }
      )
    }

    await renterQueries.delete(id)
    return Response.json({ message: 'Renter deleted successfully' })
  } catch (error) {
    console.error('Failed to delete renter:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
