import { NextRequest } from 'next/server'

import {
  createSuccessResponse,
  parsePaginationParams,
  parseQueryParams,
  parseRequestBody,
  validateRequired,
  withApiErrorHandler,
} from '@/lib/api-error-handler'
import { generateBillsOnContractSigned } from '@/lib/auto-bill-generator'
import { ErrorType } from '@/lib/error-logger'
import { globalSettings } from '@/lib/global-settings'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'
import { optimizedContractQueries } from '@/lib/optimized-queries'
import { prisma } from '@/lib/prisma'
import {
  contractQueries,
  renterQueries,
  roomQueries,
} from '@/lib/queries'
import { createInitialBaselineReadingsForContractTx } from '@/lib/domain/meters'

/**
 * 合同管理API
 * GET /api/contracts - 获取合同列表
 * POST /api/contracts - 创建合同
 */

async function handleGetContracts(request: NextRequest) {
  const queryParams = parseQueryParams(request)
  const { page, limit } = parsePaginationParams(request)
  const {
    search: searchQuery = '',
    status,
    buildingId,
    isExpiringSoon,
  } = queryParams

  const shouldFilterExpiringSoon =
    status === 'expiring_soon' || isExpiringSoon === true

  let expiringDays: number | undefined
  if (shouldFilterExpiringSoon) {
    const contractAlertSettingsLoadResult =
      await globalSettings.getContractAlertSettings()
    expiringDays = contractAlertSettingsLoadResult.settings.contractExpiryAlertDays
  }

  const result = await optimizedContractQueries.findWithPagination(
    { page, limit },
    {
      ...(status && status !== 'all' && status !== 'expiring_soon'
        ? { status: status as any }
        : {}),
      ...(searchQuery ? { search: searchQuery as string } : {}),
      ...(buildingId ? { buildingId: buildingId as string } : {}),
      ...(expiringDays ? { expiringDays } : {}),
    }
  )

  // 转换数据类型（Decimal -> number）
  const contractsForClient = result.data.map((contract: any) => ({
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
        totalRooms: Number(contract.room.building.totalRooms),
      },
    },
    bills: contract.bills.map((bill: any) => ({
      ...bill,
      amount: Number(bill.amount),
      receivedAmount: Number(bill.receivedAmount),
      pendingAmount: Number(bill.pendingAmount),
    })),
  }))

  return createSuccessResponse({
    contracts: contractsForClient,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    hasNext: result.hasNext,
    hasPrev: result.hasPrev,
  })
}

export const GET = withApiErrorHandler(handleGetContracts, {
  requireAuth: true,
  module: 'contracts-api',
  errorType: ErrorType.DATABASE_ERROR,
})

function normalizeContractPaymentMethod(defaultRentCycle?: string): string {
  switch (defaultRentCycle) {
    case 'monthly':
    case '月付':
      return '月付'
    case 'quarterly':
    case '季付':
      return '季付'
    case 'semiannual':
    case '半年付':
      return '半年付'
    case 'yearly':
    case '年付':
      return '年付'
    default:
      return '月付'
  }
}

async function handlePostContracts(request: NextRequest) {
  const startTime = Date.now()
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
    remarks: contractRemarks,
    generateBills,
    // 新增：仪表初始读数
    meterInitialReadings,
  } = body

  console.log(`[合同创建] 开始处理，耗时: ${Date.now() - startTime}ms`)

  const contractDefaultSettingsResult =
    await globalSettings.getContractDefaultSettings()
  const contractDefaults = contractDefaultSettingsResult.settings

  // 基础字段验证
  validateRequired(body, [
    'renterId',
    'roomId',
    'startDate',
    'endDate',
    'monthlyRent',
  ])

  // 验证日期
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (end <= start) {
    throw new Error('结束日期必须晚于开始日期')
  }

  // 验证金额
  const effectiveDeposit =
    deposit !== undefined && deposit !== null
      ? Number(deposit)
      : Number(monthlyRent) * contractDefaults.defaultDepositMonths

  if (monthlyRent <= 0 || effectiveDeposit < 0) {
    throw new Error('租金必须大于0，押金不能小于0')
  }

  console.log(`[合同创建] 基础验证完成，耗时: ${Date.now() - startTime}ms`)

  // 并行查询房间和租客信息，提高效率
  const [room, renter] = await Promise.all([
    roomQueries.findById(roomId),
    renterQueries.findById(renterId),
  ])

  if (!room) {
    throw new Error('房间不存在')
  }

  if (room.status !== 'VACANT') {
    throw new Error(`房间不可用，当前状态：${room.status}`)
  }

  if (!renter) {
    throw new Error('租客不存在')
  }

  const hasActiveContract = renter.contracts.some(
    (contract: any) => contract.status === 'ACTIVE'
  )

  if (hasActiveContract) {
    throw new Error('该租客已有活跃合同')
  }

  console.log(
    `[合同创建] 房间和租客验证完成，耗时: ${Date.now() - startTime}ms`
  )

  // 生成合同编号
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const contractNumber = `CT${year}${month}${String(Date.now()).slice(-6)}`

  // 计算总租金（修复月数计算逻辑）
  const calculateMonthsDifference = (
    startDate: Date,
    endDate: Date
  ): number => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    // 计算总天数
    const timeDiff = end.getTime() - start.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1 // +1 包含结束日期当天

    // 对于标准租期，按天数计算更准确
    if (daysDiff >= 365) {
      // 一年或以上，按年计算
      const years = Math.floor(daysDiff / 365)
      return years * 12
    } else if (daysDiff >= 30) {
      // 按月计算，每30天为一个月
      return Math.ceil(daysDiff / 30)
    } else {
      // 不足30天，按1个月计算
      return 1
    }
  }

  const monthsDiff = calculateMonthsDifference(start, end)
  const totalRent = monthlyRent * monthsDiff

  // 创建合同
  const effectivePaymentMethod =
    paymentMethod ||
    normalizeContractPaymentMethod(contractDefaults.defaultRentCycle)
  const effectivePaymentTiming =
    paymentTiming || contractDefaults.defaultPaymentTiming || undefined
  const shouldGenerateBills =
    typeof generateBills === 'boolean'
      ? generateBills
      : contractDefaults.autoGenerateContractBills

  const contractData = {
    contractNumber,
    roomId,
    renterId,
    startDate: start,
    endDate: end,
    monthlyRent,
    totalRent,
    deposit: effectiveDeposit,
    keyDeposit: keyDeposit || undefined,
    cleaningFee: cleaningFee || undefined,
    paymentMethod: effectivePaymentMethod,
    paymentTiming: effectivePaymentTiming,
    signedBy: signedBy || undefined,
    signedDate: signedDate ? new Date(signedDate) : undefined,
    remarks: contractRemarks || undefined,
  }

  console.log(`[合同创建] 开始核心事务，耗时: ${Date.now() - startTime}ms`)

  // 核心事务：只包含必要的数据库操作，减少事务时间
  const result = await prisma.$transaction(
    async (tx) => {
      // 创建合同
      const contract = await tx.contract.create({
        data: contractData,
      })

      // 智能设置合同初始状态：根据开始日期判断
      const today = new Date()
      today.setHours(0, 0, 0, 0) // 设置为当天开始时间
      const startDate = new Date(contractData.startDate)
      startDate.setHours(0, 0, 0, 0) // 设置为开始日期的开始时间

      // 如果开始日期是未来日期，设为PENDING；否则设为ACTIVE
      const initialStatus = startDate > today ? 'PENDING' : 'ACTIVE'

      // 更新合同状态
      const updatedContract = await tx.contract.update({
        where: { id: contract.id },
        data: { status: initialStatus },
      })

      // 只有当合同状态为ACTIVE时才更新房间状态
      if (initialStatus === 'ACTIVE') {
        await tx.room.update({
          where: { id: roomId },
          data: {
            status: 'OCCUPIED',
            currentRenter: renter.name,
          },
        })
      }

      await createInitialBaselineReadingsForContractTx(tx, {
        contractId: contract.id,
        roomId,
        contractStartDate: contract.startDate,
        meterInitialReadings: meterInitialReadings || {},
        operator: signedBy || 'SYSTEM',
      })

      return updatedContract
    },
    {
      timeout: 8000, // 减少到8秒超时
    }
  )

  console.log(`[合同创建] 核心事务完成，耗时: ${Date.now() - startTime}ms`)

  // 异步处理账单生成，不阻塞响应
  let billGenerationPromise: Promise<any> | null = null
  if (shouldGenerateBills) {
    billGenerationPromise = generateBillsOnContractSigned(result.id)
      .then(async (generatedBills) => {
        await revalidateMutationPaths({
          scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
          detailPaths: [
            `/contracts/${result.id}`,
            `/rooms/${roomId}`,
            `/renters/${renterId}`,
          ],
        })

        return generatedBills
      })
      .catch((error) => {
        console.error('异步账单生成失败:', error)
        return []
      })
  }

  // 获取完整的合同信息
  const fullContract = await contractQueries.findById(result.id)

  if (!fullContract) {
    throw new Error('创建合同后无法获取完整信息')
  }

  await revalidateMutationPaths({
    scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
    detailPaths: [
      `/contracts/${result.id}`,
      `/rooms/${roomId}`,
      `/renters/${renterId}`,
    ],
  })

  console.log(`[合同创建] 合同创建完成，总耗时: ${Date.now() - startTime}ms`)

  // 转换数据类型
  const contractForClient = {
    ...fullContract,
    monthlyRent: Number(fullContract.monthlyRent),
    totalRent: Number(fullContract.totalRent),
    deposit: Number(fullContract.deposit),
    keyDeposit: fullContract.keyDeposit
      ? Number(fullContract.keyDeposit)
      : null,
    cleaningFee: fullContract.cleaningFee
      ? Number(fullContract.cleaningFee)
      : null,
    room: {
      ...fullContract.room,
      rent: Number(fullContract.room.rent),
      area: fullContract.room.area ? Number(fullContract.room.area) : null,
      building: {
        ...fullContract.room.building,
        totalRooms: Number(fullContract.room.building.totalRooms),
      },
    },
    bills: fullContract.bills.map((bill: any) => ({
      ...bill,
      amount: Number(bill.amount),
      receivedAmount: Number(bill.receivedAmount),
      pendingAmount: Number(bill.pendingAmount),
    })),
  }

  // 如果账单生成很快完成，等待一下结果
  let bills: any[] = []
  if (billGenerationPromise) {
    try {
      // 最多等待2秒获取账单结果
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('账单生成超时')), 2000)
      )

      bills = (await Promise.race([
        billGenerationPromise,
        timeoutPromise,
      ])) as any[]
      console.log(`[合同创建] 快速账单生成完成，生成${bills.length}个账单`)
    } catch (error) {
      console.log(`[合同创建] 账单生成将在后台继续，不影响合同创建`)
      // 账单生成失败或超时，不影响合同创建成功
    }
  }

  return createSuccessResponse({
    contract: contractForClient,
    bills: bills.map((bill: any) => ({
      ...bill,
      amount: Number(bill.amount),
      receivedAmount: Number(bill.receivedAmount),
      pendingAmount: Number(bill.pendingAmount),
    })),
    message:
      '合同创建成功' +
      (bills.length > 0
        ? `，已生成 ${bills.length} 个账单`
        : '，账单正在后台生成'),
  })
}

export const POST = withApiErrorHandler(handlePostContracts, {
  requireAuth: true,
  module: 'contracts-api',
  errorType: ErrorType.VALIDATION_ERROR,
  enableFallback: true,
})
