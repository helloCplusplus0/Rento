import { NextRequest } from 'next/server'
import { contractQueries, roomQueries, renterQueries } from '@/lib/queries'
import { generateBillsOnContractSigned } from '@/lib/auto-bill-generator'
import { prisma } from '@/lib/prisma'
import { 
  withApiErrorHandler, 
  parseQueryParams, 
  createSuccessResponse,
  parseRequestBody,
  validateRequired
} from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'

/**
 * 合同管理API
 * GET /api/contracts - 获取合同列表
 * POST /api/contracts - 创建合同
 */

async function handleGetContracts(request: NextRequest) {
  const queryParams = parseQueryParams(request)
  const { search: searchQuery = '', status, buildingId, isExpiringSoon } = queryParams

  // 构建查询条件
  const filters: any = {}
  
  if (status && status !== 'all') {
    if (status === 'expiring_soon') {
      // 30天内到期的合同
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      filters.endDate = {
        lte: thirtyDaysFromNow
      }
      filters.status = 'ACTIVE'
    } else {
      filters.status = status
    }
  }

  if (buildingId) {
    filters.room = {
      buildingId
    }
  }

  if (isExpiringSoon) {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    filters.endDate = {
      lte: thirtyDaysFromNow
    }
    filters.status = 'ACTIVE'
  }

  // 获取合同列表
  const contracts = await prisma.contract.findMany({
    where: filters,
    include: {
      room: {
        include: { building: true }
      },
      renter: true,
      bills: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // 如果有搜索关键词，进行过滤
  let filteredContracts = contracts
  if (searchQuery) {
    const query = (searchQuery as string).toLowerCase()
    filteredContracts = contracts.filter((contract: any) =>
      contract.contractNumber.toLowerCase().includes(query) ||
      contract.renter.name.toLowerCase().includes(query) ||
      contract.room.roomNumber.toLowerCase().includes(query) ||
      contract.room.building.name.toLowerCase().includes(query)
    )
  }

  // 转换数据类型（Decimal -> number）
  const contractsForClient = filteredContracts.map((contract: any) => ({
      ...contract,
      monthlyRent: Number(contract.monthlyRent),
      totalRent: Number(contract.totalRent),
      deposit: Number(contract.deposit),
      keyDeposit: contract.keyDeposit ? Number(contract.keyDeposit) : null,
      cleaningFee: contract.cleaningFee ? Number(contract.cleaningFee) : null,
      room: {
        ...contract.room,
        rent: Number(contract.room.rent),
        area: contract.room.area ? Number(contract.room.area) : null,
        building: {
          ...contract.room.building,
          totalRooms: Number(contract.room.building.totalRooms)
        }
      },
      bills: contract.bills.map((bill: any) => ({
        ...bill,
        amount: Number(bill.amount),
        receivedAmount: Number(bill.receivedAmount),
        pendingAmount: Number(bill.pendingAmount)
      }))
    }))

    return createSuccessResponse({
      contracts: contractsForClient,
      total: contractsForClient.length
    })
}

export const GET = withApiErrorHandler(handleGetContracts, {
  module: 'contracts-api',
  errorType: ErrorType.DATABASE_ERROR
})

async function handlePostContracts(request: NextRequest) {
  const body = await parseRequestBody(request)
  const {
    renterId,
    roomId,
    startDate,
    endDate,
    monthlyRent,
    deposit,
    keyDeposit,
    cleaningFee,
    paymentMethod,
    paymentTiming,
    signedBy,
    signedDate,
    remarks,
    generateBills = true
  } = body

  // 基础字段验证
  validateRequired(body, ['renterId', 'roomId', 'startDate', 'endDate', 'monthlyRent', 'deposit'])

  // 验证日期
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (end <= start) {
    throw new Error('结束日期必须晚于开始日期')
  }

  // 验证金额
  if (monthlyRent <= 0 || deposit <= 0) {
    throw new Error('租金和押金必须大于0')
  }

  // 检查房间是否可用
  const room = await roomQueries.findById(roomId)
  if (!room) {
    throw new Error('房间不存在')
  }

  if (room.status !== 'VACANT') {
    throw new Error(`房间不可用，当前状态：${room.status}`)
  }

  // 检查租客是否已有活跃合同
  const renter = await renterQueries.findById(renterId)
  if (!renter) {
    throw new Error('租客不存在')
  }

  const hasActiveContract = renter.contracts.some((contract: any) => contract.status === 'ACTIVE')
  
  if (hasActiveContract) {
    throw new Error('该租客已有活跃合同')
  }

  // 生成合同编号
  const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const contractNumber = `CT${year}${month}${String(Date.now()).slice(-6)}`

  // 计算总租金（按月数计算）
  const monthsDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
  const totalRent = monthlyRent * monthsDiff

  // 创建合同
  const contractData = {
    contractNumber,
    roomId,
    renterId,
    startDate: start,
    endDate: end,
    monthlyRent,
    totalRent,
    deposit,
    keyDeposit: keyDeposit || undefined,
    cleaningFee: cleaningFee || undefined,
    paymentMethod: paymentMethod || undefined,
    paymentTiming: paymentTiming || undefined,
    signedBy: signedBy || undefined,
    signedDate: signedDate ? new Date(signedDate) : undefined
  }

  const contract = await contractQueries.create(contractData)

  // 更新房间状态为已占用
  await roomQueries.update(roomId, {
    status: 'OCCUPIED',
    currentRenter: renter.name
  })

  // 自动生成账单（如果需要）
  let bills: any[] = []
  if (generateBills) {
    try {
      bills = await generateBillsOnContractSigned(contract.id)
    } catch (error) {
      console.error('自动生成账单失败:', error)
      // 不影响合同创建，只记录错误
    }
  }

  // 获取完整的合同信息
  const fullContract = await contractQueries.findById(contract.id)
  
  if (!fullContract) {
    throw new Error('创建合同后无法获取完整信息')
  }

  // 转换数据类型
  const contractForClient = {
    ...fullContract,
    monthlyRent: Number(fullContract.monthlyRent),
    totalRent: Number(fullContract.totalRent),
    deposit: Number(fullContract.deposit),
    keyDeposit: fullContract.keyDeposit ? Number(fullContract.keyDeposit) : null,
    cleaningFee: fullContract.cleaningFee ? Number(fullContract.cleaningFee) : null,
    room: {
      ...fullContract.room,
      rent: Number(fullContract.room.rent),
      area: fullContract.room.area ? Number(fullContract.room.area) : null,
      building: {
        ...fullContract.room.building,
        totalRooms: Number(fullContract.room.building.totalRooms)
      }
    },
    bills: fullContract.bills.map((bill: any) => ({
      ...bill,
      amount: Number(bill.amount),
      receivedAmount: Number(bill.receivedAmount),
      pendingAmount: Number(bill.pendingAmount)
    }))
  }

  return createSuccessResponse({
    contract: contractForClient,
    bills: bills.map((bill: any) => ({
      ...bill,
      amount: Number(bill.amount),
      receivedAmount: Number(bill.receivedAmount),
      pendingAmount: Number(bill.pendingAmount)
    })),
    message: '合同创建成功' + (generateBills ? `，已自动生成 ${bills.length} 个账单` : '')
  })
}

export const POST = withApiErrorHandler(handlePostContracts, {
  module: 'contracts-api',
  errorType: ErrorType.VALIDATION_ERROR,
  enableFallback: true
})