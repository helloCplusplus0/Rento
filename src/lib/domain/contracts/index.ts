import {
  defineDomainModuleBoundary,
  PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
} from '../shared'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

/**
 * Contract 仍是主链事实锚点。
 * phase09-01 先冻结共享领域承接位，具体写入逻辑后续再从旧宿主迁入。
 */
export const contractsDomainBoundary = defineDomainModuleBoundary({
  name: 'contracts',
  description: '承接合同生命周期、续租、退租前置校验与房态联动语义。',
  compatBoundary: {
    strategy: 'compat-wrapper',
    reason:
      'phase09-01 仅冻结新宿主与共享领域承接位，旧 src/app/api/contracts/* 仍需承接存量请求与迁移对照。',
    exitCondition:
      '当合同相关正式入口已迁入 server/routes/*，并由 src/lib/domain/contracts 承接事务边界且通过主链 smoke 后，旧入口降级为薄包装或移除。',
  },
  transactionBoundary: {
    ...PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
    note:
      '合同创建、续租、退租等跨聚合写操作的事务编排统一下沉到 src/lib/domain/contracts，而不是散落在路由层。',
  },
})

const PRISMA_TRANSACTION_MAX_RETRIES = 3
const PRISMA_TRANSACTION_MAX_WAIT_MS = 5_000
const PRISMA_TRANSACTION_TIMEOUT_MS = 10_000
const PRISMA_TRANSACTION_RETRY_BASE_DELAY_MS = 100

export interface PendingContractActivationResult {
  activated: number
  errors: Array<{ contractId: string; error: string }>
}

export interface ManualContractActivationResult {
  success: boolean
  message: string
}

function getStartOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function isPrismaWriteConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE.retryCode
  )
}

async function waitForRetry(attempt: number) {
  const delayMs = PRISMA_TRANSACTION_RETRY_BASE_DELAY_MS * attempt
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs)
  })
}

async function runWithSerializableTransaction<T>(
  operation: Parameters<typeof prisma.$transaction>[0]
) {
  for (let attempt = 1; attempt <= PRISMA_TRANSACTION_MAX_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: PRISMA_TRANSACTION_MAX_WAIT_MS,
        timeout: PRISMA_TRANSACTION_TIMEOUT_MS,
      }) as T
    } catch (error) {
      if (
        !isPrismaWriteConflict(error) ||
        attempt >= PRISMA_TRANSACTION_MAX_RETRIES
      ) {
        throw error
      }

      await waitForRetry(attempt)
    }
  }

  throw new Error('合同事务执行失败')
}

async function activateContract(contractId: string) {
  return runWithSerializableTransaction(async (tx) => {
    const contract = await tx.contract.findUnique({
      where: { id: contractId },
      include: { room: true },
    })

    if (!contract) {
      throw new Error(`合同不存在: ${contractId}`)
    }

    if (contract.status !== 'PENDING') {
      throw new Error(`合同状态不是PENDING: ${contract.status}`)
    }

    if (contract.room.status !== 'VACANT') {
      throw new Error(`房间不可用，当前状态: ${contract.room.status}`)
    }

    await tx.contract.update({
      where: { id: contractId },
      data: { status: 'ACTIVE' },
    })

    await tx.room.update({
      where: { id: contract.roomId },
      data: {
        status: 'OCCUPIED',
        currentRenter: contract.renterId,
      },
    })

    return {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      roomId: contract.roomId,
      renterId: contract.renterId,
    }
  })
}

export const contractLifecycleService = {
  async activatePendingContracts(): Promise<PendingContractActivationResult> {
    const pendingContracts = await prisma.contract.findMany({
      where: {
        status: 'PENDING',
        startDate: {
          lte: getStartOfToday(),
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    const result: PendingContractActivationResult = {
      activated: 0,
      errors: [],
    }

    for (const contract of pendingContracts) {
      try {
        await activateContract(contract.id)
        result.activated += 1
      } catch (error) {
        result.errors.push({
          contractId: contract.id,
          error: error instanceof Error ? error.message : '未知错误',
        })
      }
    }

    return result
  },

  async manualActivateContract(
    contractId: string
  ): Promise<ManualContractActivationResult> {
    try {
      await activateContract(contractId)
      return {
        success: true,
        message: '合同激活成功',
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '激活失败',
      }
    }
  },
}
