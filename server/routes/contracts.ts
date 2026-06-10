import {
  contractsDomainBoundary,
  deleteGuardsDomainBoundary,
} from '@/lib/domain'
import { generateBillsOnContractSigned } from '@/lib/auto-bill-generator'
import {
  contractDomainService,
  contractLifecycleService,
  isContractDomainValidationError,
} from '@/lib/domain/contracts'
import {
  deletePendingContractWithoutHistory,
  isContractDeleteGuardBlockedError,
  performContractDeleteSafetyCheck,
} from '@/lib/domain/delete-guards'
import { createInitialBaselineReadingsForContractTx } from '@/lib/domain/meters'
import { globalSettings } from '@/lib/global-settings'
import { optimizedContractQueries } from '@/lib/optimized-queries'
import { prisma } from '@/lib/prisma'
import { contractQueries, renterQueries, roomQueries } from '@/lib/queries'
import { invalidateBillCaches } from '@/lib/bill-cache'
import { preserveRenewalRemarkMarker } from '@/lib/contract-bill-generation-context'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'

import type { AuthAppEnv } from '../lib/auth-context'
import {
  notFoundError,
  notImplementedError,
  validationError,
} from '../lib/api-errors'
import {
  jsonApiError,
  jsonSuccess,
  readJsonBody,
} from '../lib/api-responses'
import type { MinixServerEnv } from '../lib/env'
import { requireAuth } from '../middleware/require-auth'
import { Hono } from 'hono'

const LEGACY_COMPAT = {
  currentState: 'compat-wrapper',
  targetStrategy: 'compat-wrapper',
  legacyPaths: [
    'src/app/api/contracts/route.ts',
    'src/app/api/contracts/activate/route.ts',
    'src/app/api/contracts/[id]/route.ts',
    'src/app/api/contracts/[id]/renew/route.ts',
    'src/app/api/contracts/[id]/generate-bills/route.ts',
  ] as const,
  reason:
    'phase14-05 当前统一 /api runtime 已由 server/routes/contracts.ts 承担 contracts 主链正式职责；激活、列表、创建、详情、编辑、续租、补账单与删除门禁均由该宿主对外暴露，旧 Next 入口已降级为 compat proxy 与回滚基线。',
  exitCondition:
    '当前端与所有存量调用均切换到统一 Hono 宿主后，旧 src/app/api/contracts/* compat wrapper 可移除。',
} as const

function toClientContract(contract: any) {
  return {
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
  }
}

type ContractUpdatePayload = {
  monthlyRent?: number | string
  deposit?: number | string
  keyDeposit?: number | string | null
  cleaningFee?: number | string | null
  paymentMethod?: string | null
  paymentTiming?: string | null
  signedBy?: string | null
  signedDate?: string | null
  remarks?: string | null
}

type ContractCreatePayload = {
  renterId?: string
  roomId?: string
  startDate?: string
  endDate?: string
  monthlyRent?: number | string
  deposit?: number | string | null
  keyDeposit?: number | string | null
  cleaningFee?: number | string | null
  paymentMethod?: string | null
  paymentTiming?: string | null
  signedBy?: string | null
  signedDate?: string | null
  remarks?: string | null
  generateBills?: boolean
  meterInitialReadings?: Record<string, number>
}

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

function calculateLegacyContractMonthsDifference(
  startDate: Date,
  endDate: Date
): number {
  return Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )
}

function calculateLegacyCreateContractMonthsDifference(
  startDate: Date,
  endDate: Date
): number {
  const timeDiff = endDate.getTime() - startDate.getTime()
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1

  if (daysDiff >= 365) {
    const years = Math.floor(daysDiff / 365)
    return years * 12
  }

  if (daysDiff >= 30) {
    return Math.ceil(daysDiff / 30)
  }

  return 1
}

function mapGeneratedBillsForClient(bills: any[]) {
  return bills.map((bill: any) => ({
    ...bill,
    amount: Number(bill.amount),
    receivedAmount: Number(bill.receivedAmount),
    pendingAmount: Number(bill.pendingAmount),
  }))
}

function appendContractsFallback(
  routeApp: Hono<AuthAppEnv>,
  env: MinixServerEnv
) {
  routeApp.all('*', (c) => {
    return jsonApiError(
      c,
      notImplementedError(
        '统一 /api runtime 已挂出 contracts 主链正式入口；旧 Next 入口已降级为 compat proxy，未覆盖的合同子路径继续由 compat wrapper 或后续子任务承接。',
        {
          phase: 'phase14-05',
          routeKey: 'contracts',
          domainServiceHost: 'src/lib/domain',
          migrationState: 'partial-migrated',
          compatBoundary: LEGACY_COMPAT,
          modules: [contractsDomainBoundary, deleteGuardsDomainBoundary].map(
            (moduleBoundary) => ({
              name: moduleBoundary.name,
              description: moduleBoundary.description,
              compatBoundary: moduleBoundary.compatBoundary,
              transactionBoundary: moduleBoundary.transactionBoundary,
            })
          ),
        }
      ),
      { env }
    )
  })
}

export function createContractRoutes(env: MinixServerEnv) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())

  routeApp.get('/', async (c) => {
    const url = new URL(c.req.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(
      Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10)),
      100
    )
    const search = url.searchParams.get('search')?.trim() || undefined
    const status = url.searchParams.get('status')?.trim() || undefined
    const buildingId = url.searchParams.get('buildingId')?.trim() || undefined
    const renterId = url.searchParams.get('renterId')?.trim() || undefined
    const isExpiringSoon = url.searchParams.get('isExpiringSoon') === 'true'
    const shouldFilterExpiringSoon =
      status === 'expiring_soon' || isExpiringSoon

    let expiringDays: number | undefined
    if (shouldFilterExpiringSoon) {
      const contractAlertSettingsLoadResult =
        await globalSettings.getContractAlertSettings()
      expiringDays =
        contractAlertSettingsLoadResult.settings.contractExpiryAlertDays
    }

    const result = await optimizedContractQueries.findWithPagination(
      { page, limit },
      {
        ...(status && status !== 'all' && status !== 'expiring_soon'
          ? { status: status as any }
          : {}),
        ...(search ? { search } : {}),
        ...(buildingId ? { buildingId } : {}),
        // Keep renterId on the exact contract.renterId path; do not merge it into fuzzy search.
        ...(renterId ? { renterId } : {}),
        ...(expiringDays ? { expiringDays } : {}),
      }
    )

    return jsonSuccess(c, {
      data: {
        contracts: result.data.map(toClientContract),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      },
      env,
    })
  })

  routeApp.post('/', async (c) => {
    const body = (await readJsonBody<ContractCreatePayload>(c, {
      maxBytes: env.requestGovernance.maxRequestSize,
    })) as ContractCreatePayload

    const missingFields = ['renterId', 'roomId', 'startDate', 'endDate', 'monthlyRent']
      .filter((field) => !body[field as keyof ContractCreatePayload])

    if (missingFields.length > 0) {
      throw validationError(`缺少必填字段: ${missingFields.join(', ')}`)
    }

    const start = new Date(body.startDate as string)
    const end = new Date(body.endDate as string)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw validationError('开始日期或结束日期格式无效')
    }

    if (end <= start) {
      throw validationError('结束日期必须晚于开始日期')
    }

    const contractDefaultSettingsResult =
      await globalSettings.getContractDefaultSettings()
    const contractDefaults = contractDefaultSettingsResult.settings
    const normalizedMonthlyRent = Number(body.monthlyRent)
    const effectiveDeposit =
      body.deposit !== undefined && body.deposit !== null
        ? Number(body.deposit)
        : normalizedMonthlyRent * contractDefaults.defaultDepositMonths

    if (
      !Number.isFinite(normalizedMonthlyRent) ||
      normalizedMonthlyRent <= 0 ||
      !Number.isFinite(effectiveDeposit) ||
      effectiveDeposit < 0
    ) {
      throw validationError('租金必须大于0，押金不能小于0')
    }

    const [room, renter] = await Promise.all([
      roomQueries.findById(body.roomId as string),
      renterQueries.findById(body.renterId as string),
    ])

    if (!room) {
      throw notFoundError('房间不存在')
    }

    if (room.status !== 'VACANT') {
      throw validationError(`房间不可用，当前状态：${room.status}`)
    }

    if (!renter) {
      throw notFoundError('租客不存在')
    }

    const hasActiveContract = renter.contracts.some(
      (contract) => contract.status === 'ACTIVE'
    )

    if (hasActiveContract) {
      throw validationError('该租客已有活跃合同')
    }

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const contractNumber = `CT${year}${month}${String(Date.now()).slice(-6)}`
    const monthsDiff = calculateLegacyCreateContractMonthsDifference(start, end)
    const totalRent = normalizedMonthlyRent * monthsDiff
    const effectivePaymentMethod =
      body.paymentMethod ||
      normalizeContractPaymentMethod(contractDefaults.defaultRentCycle)
    const effectivePaymentTiming =
      body.paymentTiming || contractDefaults.defaultPaymentTiming || undefined
    const shouldGenerateBills =
      typeof body.generateBills === 'boolean'
        ? body.generateBills
        : contractDefaults.autoGenerateContractBills

    const contractData = {
      contractNumber,
      roomId: body.roomId as string,
      renterId: body.renterId as string,
      startDate: start,
      endDate: end,
      monthlyRent: normalizedMonthlyRent,
      totalRent,
      deposit: effectiveDeposit,
      keyDeposit: body.keyDeposit ? Number(body.keyDeposit) : undefined,
      cleaningFee: body.cleaningFee ? Number(body.cleaningFee) : undefined,
      paymentMethod: effectivePaymentMethod,
      paymentTiming: effectivePaymentTiming,
      signedBy: body.signedBy || undefined,
      signedDate: body.signedDate ? new Date(body.signedDate) : undefined,
      remarks: body.remarks || undefined,
    }

    const createdContract = await prisma.$transaction(
      async (tx) => {
        const contract = await tx.contract.create({
          data: contractData,
        })

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const normalizedStartDate = new Date(contractData.startDate)
        normalizedStartDate.setHours(0, 0, 0, 0)

        const initialStatus =
          normalizedStartDate > today ? 'PENDING' : 'ACTIVE'

        const updatedContract = await tx.contract.update({
          where: { id: contract.id },
          data: { status: initialStatus },
        })

        if (initialStatus === 'ACTIVE') {
          await tx.room.update({
            where: { id: body.roomId as string },
            data: {
              status: 'OCCUPIED',
              currentRenter: renter.name,
            },
          })
        }

        await createInitialBaselineReadingsForContractTx(tx, {
          contractId: contract.id,
          roomId: body.roomId as string,
          contractStartDate: contract.startDate,
          meterInitialReadings: body.meterInitialReadings || {},
          operator: body.signedBy || 'SYSTEM',
        })

        return updatedContract
      },
      {
        timeout: 8000,
      }
    )

    let billGenerationPromise: Promise<unknown> | null = null
    if (shouldGenerateBills) {
      billGenerationPromise = generateBillsOnContractSigned(createdContract.id, {
        executionRuntime: 'hono-runtime',
        runtimeName: env.runtimeName,
      })
        .then(async (generatedBills) => {
          await invalidateBillCaches()
          await revalidateMutationPaths({
            scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
            detailPaths: [
              `/contracts/${createdContract.id}`,
              `/rooms/${body.roomId}`,
              `/renters/${body.renterId}`,
            ],
            executionRuntime: 'hono-runtime',
            runtimeName: env.runtimeName,
          })

          return generatedBills
        })
        .catch((error) => {
          console.error('异步账单生成失败:', error)
          return []
        })
    }

    const fullContract = await contractQueries.findById(createdContract.id)

    if (!fullContract) {
      throw new Error('创建合同后无法获取完整信息')
    }

    await revalidateMutationPaths({
      scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
      detailPaths: [
        `/contracts/${createdContract.id}`,
        `/rooms/${body.roomId}`,
        `/renters/${body.renterId}`,
      ],
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    let bills: any[] = []
    if (billGenerationPromise) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('账单生成超时')), 2000)
        )

        const billGenerationResult = await Promise.race([
          billGenerationPromise,
          timeoutPromise,
        ])
        bills = Array.isArray(billGenerationResult) ? billGenerationResult : []
      } catch (_error) {
        // 保持旧链路语义：账单继续后台生成，不阻断合同创建成功响应。
      }
    }

    const successMessage =
      '合同创建成功' +
      (bills.length > 0 ? `，已生成 ${bills.length} 个账单` : '，账单正在后台生成')

    return jsonSuccess(c, {
      data: {
        contract: toClientContract(fullContract),
        bills: mapGeneratedBillsForClient(bills),
        message: successMessage,
      },
      message: successMessage,
      env,
    })
  })

  routeApp.post('/activate', async (c) => {
    const body =
      (await readJsonBody<{ contractId?: string }>(c, {
        allowEmpty: true,
        maxBytes: env.requestGovernance.maxRequestSize,
      })) ?? {}

    if (body.contractId) {
      const result = await contractLifecycleService.manualActivateContract(
        body.contractId
      )

      if (!result.success) {
        return jsonApiError(
          c,
          validationError(result.message, {
            contractId: body.contractId,
            compatBoundary: LEGACY_COMPAT,
          }),
          { env }
        )
      }

      return jsonSuccess(c, {
        data: {
          message: result.message,
          contractId: body.contractId,
        },
        message: result.message,
        env,
      })
    }

    const result = await contractLifecycleService.activatePendingContracts()

    return jsonSuccess(c, {
      data: {
        activated: result.activated,
        errors: result.errors,
        message: `激活任务完成，成功激活 ${result.activated} 个合同`,
      },
      message: `激活任务完成，成功激活 ${result.activated} 个合同`,
      env,
    })
  })

  routeApp.get('/:id', async (c) => {
    const contractId = c.req.param('id')

    if (!contractId) {
      return jsonApiError(c, validationError('合同ID不能为空'), { env })
    }

    const contract = await contractQueries.findById(contractId)

    if (!contract) {
      return jsonApiError(c, notFoundError('合同不存在'), { env })
    }

    return jsonSuccess(c, {
      data: toClientContract(contract),
      message: '获取合同详情成功',
      env,
    })
  })

  routeApp.put('/:id', async (c) => {
    const contractId = c.req.param('id')

    if (!contractId) {
      return jsonApiError(c, validationError('合同ID不能为空'), { env })
    }

    const body = (await readJsonBody<ContractUpdatePayload>(c, {
      maxBytes: env.requestGovernance.maxRequestSize,
    })) as ContractUpdatePayload

    const existingContract = await contractQueries.findById(contractId)

    if (!existingContract) {
      return jsonApiError(c, notFoundError('合同不存在'), { env })
    }

    const updateData: Record<string, unknown> = {}

    if (
      existingContract.status === 'ACTIVE' ||
      existingContract.status === 'EXPIRED'
    ) {
      if (body.signedBy !== undefined) {
        updateData.signedBy = body.signedBy
      }
      if (body.signedDate !== undefined) {
        updateData.signedDate = body.signedDate ? new Date(body.signedDate) : null
      }
      if (body.remarks !== undefined) {
        updateData.remarks = preserveRenewalRemarkMarker(
          existingContract.remarks,
          body.remarks
        )
      }

      if (Object.keys(updateData).length === 0) {
        return jsonApiError(c, validationError('没有提供要更新的数据'), { env })
      }

      const updatedContract = await prisma.contract.update({
        where: { id: contractId },
        data: updateData,
        include: {
          room: {
            include: { building: true },
          },
          renter: true,
          bills: {
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
          },
        },
      })

      await revalidateMutationPaths({
        scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
        detailPaths: [`/contracts/${contractId}`],
        executionRuntime: 'hono-runtime',
        runtimeName: env.runtimeName,
      })

      return jsonSuccess(c, {
        data: toClientContract(updatedContract),
        message: '合同签约信息更新成功',
        env,
      })
    }

    if (body.monthlyRent !== undefined) {
      const normalizedMonthlyRent = Number(body.monthlyRent)
      updateData.monthlyRent = normalizedMonthlyRent

      if (normalizedMonthlyRent !== Number(existingContract.monthlyRent)) {
        const monthsDiff = calculateLegacyContractMonthsDifference(
          new Date(existingContract.startDate),
          new Date(existingContract.endDate)
        )
        updateData.totalRent = normalizedMonthlyRent * monthsDiff
      }
    }

    if (body.deposit !== undefined) {
      updateData.deposit = Number(body.deposit)
    }
    if (body.keyDeposit !== undefined) {
      updateData.keyDeposit = body.keyDeposit ? Number(body.keyDeposit) : null
    }
    if (body.cleaningFee !== undefined) {
      updateData.cleaningFee = body.cleaningFee ? Number(body.cleaningFee) : null
    }
    if (body.paymentMethod !== undefined) {
      updateData.paymentMethod = body.paymentMethod
    }
    if (body.paymentTiming !== undefined) {
      updateData.paymentTiming = body.paymentTiming
    }
    if (body.signedBy !== undefined) {
      updateData.signedBy = body.signedBy
    }
    if (body.signedDate !== undefined) {
      updateData.signedDate = body.signedDate ? new Date(body.signedDate) : null
    }
    if (body.remarks !== undefined) {
      updateData.remarks = preserveRenewalRemarkMarker(
        existingContract.remarks,
        body.remarks
      )
    }

    if (Object.keys(updateData).length === 0) {
      return jsonApiError(c, validationError('没有提供要更新的数据'), { env })
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: updateData,
      include: {
        room: {
          include: { building: true },
        },
        renter: true,
        bills: {
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        },
      },
    })

    await revalidateMutationPaths({
      scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
      detailPaths: [`/contracts/${contractId}`],
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    return jsonSuccess(c, {
      data: toClientContract(updatedContract),
      message: '合同更新成功',
      env,
    })
  })

  routeApp.post('/:id/renew', async (c) => {
    const originalContractId = c.req.param('id')
    const body = (await readJsonBody<{
      newStartDate: string
      newEndDate: string
      newMonthlyRent: number
      newDeposit?: number
      newKeyDeposit?: number
      newCleaningFee?: number
      paymentMethod?: string | null
      paymentTiming?: string | null
      signedBy?: string | null
      signedDate?: string | null
      remarks?: string | null
    }>(c, {
      maxBytes: env.requestGovernance.maxRequestSize,
    })) as {
      newStartDate: string
      newEndDate: string
      newMonthlyRent: number
      newDeposit?: number
      newKeyDeposit?: number
      newCleaningFee?: number
      paymentMethod?: string | null
      paymentTiming?: string | null
      signedBy?: string | null
      signedDate?: string | null
      remarks?: string | null
    }

    try {
      const result = await contractDomainService.renewContract({
        originalContractId,
        newStartDate: body.newStartDate,
        newEndDate: body.newEndDate,
        newMonthlyRent: body.newMonthlyRent,
        newDeposit: body.newDeposit,
        newKeyDeposit: body.newKeyDeposit,
        newCleaningFee: body.newCleaningFee,
        paymentMethod: body.paymentMethod,
        paymentTiming: body.paymentTiming,
        signedBy: body.signedBy,
        signedDate: body.signedDate,
        remarks: body.remarks,
      })

      await invalidateBillCaches()
      await revalidateMutationPaths({
        scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
        detailPaths: [
          `/contracts/${originalContractId}`,
          `/contracts/${result.newContract.id}`,
          `/rooms/${result.newContract.roomId}`,
          `/renters/${result.newContract.renterId}`,
        ],
        executionRuntime: 'hono-runtime',
        runtimeName: env.runtimeName,
      })

      return c.json({
        success: true,
        data: {
          ...result,
          compatMode: true,
          migrationHost: 'src/lib/domain/contracts',
        },
        message:
          result.billGeneration.success
            ? '续租成功'
            : '续租成功，补账单生成需人工复核',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Contract not found') {
        return jsonApiError(c, notFoundError('原合同不存在'), { env })
      }

      if (isContractDomainValidationError(error)) {
        return jsonApiError(
          c,
          validationError(error.message, {
            code: error.code,
            ...error.details,
            compatBoundary: LEGACY_COMPAT,
          }),
          { env }
        )
      }

      throw error
    }
  })

  routeApp.post('/:id/generate-bills', async (c) => {
    const contractId = c.req.param('id')

    try {
      const result = await contractDomainService.generateContractBills(contractId, {
        mode: 'auto',
      })

      await invalidateBillCaches()
      await revalidateMutationPaths({
        scopes: ['dashboard', 'contracts', 'bills', 'rooms', 'renters'],
        detailPaths: [`/contracts/${contractId}`],
        executionRuntime: 'hono-runtime',
        runtimeName: env.runtimeName,
      })

      return c.json({
        success: true,
        message:
          result.generationMode === 'GENERATE_BASE'
            ? `成功为合同 ${contractId} 生成 ${result.generatedBills.length} 个基础账单`
            : `成功为合同 ${contractId} 补齐 ${result.generatedBills.length} 个缺失租金账单`,
        compatMode: true,
        migrationHost: 'src/lib/domain/contracts',
        ...result,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Contract not found') {
        return jsonApiError(c, notFoundError('合同不存在'), { env })
      }

      if (isContractDomainValidationError(error)) {
        return jsonApiError(
          c,
          validationError(error.message, {
            code: error.code,
            ...error.details,
            compatBoundary: LEGACY_COMPAT,
          }),
          { env }
        )
      }

      throw error
    }
  })

  routeApp.delete('/:id', async (c) => {
    const contractId = c.req.param('id')
    const safetyCheck = await performContractDeleteSafetyCheck(contractId)

    if (!safetyCheck.canDelete) {
      return jsonApiError(
        c,
        validationError('无法删除合同', {
          code: safetyCheck.errorCode,
          currentStatus: safetyCheck.contractStatus,
          billCount: safetyCheck.billCount,
          paidBillCount: safetyCheck.paidBillCount,
          unpaidBillCount: safetyCheck.unpaidBillCount,
          meterReadingCount: safetyCheck.meterReadingCount,
          billedMeterReadingCount: safetyCheck.billedMeterReadingCount,
          billDetailCount: safetyCheck.billDetailCount,
          blockingReasons: safetyCheck.blockingReasons,
          suggestion: safetyCheck.suggestion,
          compatBoundary: LEGACY_COMPAT,
        }),
        { env }
      )
    }

    try {
      const result = await deletePendingContractWithoutHistory(contractId)

      return jsonSuccess(c, {
        data: result,
        message: result.message,
        env,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Contract not found') {
        return jsonApiError(c, notFoundError('合同不存在'), { env })
      }

      if (isContractDeleteGuardBlockedError(error)) {
        const latestSafetyCheck = error.details

        return jsonApiError(
          c,
          validationError('无法删除合同', {
            code: latestSafetyCheck.errorCode,
            currentStatus: latestSafetyCheck.contractStatus,
            billCount: latestSafetyCheck.billCount,
            paidBillCount: latestSafetyCheck.paidBillCount,
            unpaidBillCount: latestSafetyCheck.unpaidBillCount,
            meterReadingCount: latestSafetyCheck.meterReadingCount,
            billedMeterReadingCount: latestSafetyCheck.billedMeterReadingCount,
            billDetailCount: latestSafetyCheck.billDetailCount,
            blockingReasons: latestSafetyCheck.blockingReasons,
            suggestion: latestSafetyCheck.suggestion,
            compatBoundary: LEGACY_COMPAT,
          }),
          { env }
        )
      }

      throw error
    }
  })

  appendContractsFallback(routeApp, env)

  return routeApp
}
