import { readFileSync } from 'node:fs'
import { webcrypto } from 'node:crypto'
import { createRequire } from 'node:module'
import path from 'node:path'
import vm from 'node:vm'

import ts from 'typescript'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function parseJson(response: Response) {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

type ModuleExports = Record<string, unknown>
type ModuleCache = Map<string, ModuleExports>
type Overrides = Record<string, unknown>

type GuardSummary = {
  status: number
  code?: string
  action?: string
  details?: Record<string, unknown>
}

type MeterRecord = {
  id: string
  roomId: string
  roomNumber: string
  isActive: boolean
  readingCount: number
  billCount: number
  billDetailCount: number
}

const nodeRequire = createRequire(import.meta.url)

class MockNextRequest {
  readonly url: string
  readonly method: string
  readonly headers: Headers
  readonly cookies: { get: (name: string) => { value: string } | undefined }

  constructor(
    input: string | URL,
    init?: { method?: string; headers?: HeadersInit }
  ) {
    this.url = String(input)
    this.method = init?.method ?? 'GET'
    this.headers = new Headers(init?.headers)
    this.cookies = {
      get: (name: string) => {
        const header = this.headers.get('cookie') ?? ''
        const cookies = header
          .split(';')
          .map((value) => value.trim())
          .filter(Boolean)

        for (const cookie of cookies) {
          const [cookieName, ...rest] = cookie.split('=')
          if (cookieName === name) {
            return { value: rest.join('=') }
          }
        }

        return undefined
      },
    }
  }
}

class MockNextResponse extends Response {
  static json(data: unknown, init?: ResponseInit) {
    return Response.json(data, init)
  }
}

function loadTsModule(
  filePath: string,
  overrides: Overrides,
  cache: ModuleCache
): ModuleExports {
  if (cache.has(filePath)) {
    return cache.get(filePath)!
  }

  const source = readFileSync(filePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filePath,
  })

  const module = { exports: {} as ModuleExports }
  cache.set(filePath, module.exports)

  const localRequire = (specifier: string) => {
    if (specifier in overrides) {
      return overrides[specifier]
    }

    if (specifier.startsWith('@/')) {
      const resolvedAliasPath = resolveProjectImport(specifier)
      if (resolvedAliasPath in overrides) {
        return overrides[resolvedAliasPath]
      }
      return loadTsModule(resolvedAliasPath, overrides, cache)
    }

    if (specifier.startsWith('.')) {
      const resolvedRelativePath = resolveRelativeImport(filePath, specifier)
      if (resolvedRelativePath in overrides) {
        return overrides[resolvedRelativePath]
      }
      return loadTsModule(resolvedRelativePath, overrides, cache)
    }

    return nodeRequire(specifier) as unknown
  }

  const wrappedCode = `
    (function (exports, module, __filename, __dirname, __importedRequire) {
      const require = (specifier) => {
      return __importedRequire(specifier)
      }
      ${transpiled.outputText}
      return module.exports
    })
  `

  const script = new vm.Script(wrappedCode, { filename: filePath })
  const compiled = script.runInThisContext() as (
    exports: ModuleExports,
    module: { exports: ModuleExports },
    __filename: string,
    __dirname: string,
    __importedRequire: (specifier: string) => unknown
  ) => ModuleExports

  module.exports = compiled(
    module.exports,
    module,
    filePath,
    path.dirname(filePath),
    localRequire
  )
  cache.set(filePath, module.exports)

  return module.exports
}

function resolveProjectImport(specifier: string) {
  return resolveWithExtensions(
    path.join('/home/dell/Projects/Rento/src', specifier.slice(2))
  )
}

function resolveRelativeImport(fromFile: string, specifier: string) {
  return resolveWithExtensions(path.resolve(path.dirname(fromFile), specifier))
}

function resolveWithExtensions(basePath: string) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
  ]

  const match = candidates.find((candidate) => ts.sys.fileExists(candidate))
  if (!match) {
    throw new Error(`Cannot resolve module: ${basePath}`)
  }

  return match
}

async function createAuthedDeleteRequest(
  url: string,
  sessionExports: ModuleExports
) {
  const authCookieName = String(sessionExports.AUTH_COOKIE_NAME)
  const createSessionToken = sessionExports.createSessionToken as (
    username: string
  ) => Promise<string>
  const token = await createSessionToken('phase03-validator')

  return new MockNextRequest(url, {
    method: 'DELETE',
    headers: {
      cookie: `${authCookieName}=${token}`,
    },
  })
}

async function verifyRestrictedQueryDeletes() {
  const queriesPath = '/home/dell/Projects/Rento/src/lib/queries.ts'
  const source = readFileSync(queriesPath, 'utf8')
  const checks = [
    { label: 'roomQueryDelete', pattern: /roomQueries[\s\S]*?delete:\s*\(id: string\)\s*=>[\s\S]*?createRestrictedDeleteError\(\s*'房间'/ },
    { label: 'contractQueryDelete', pattern: /contractQueries[\s\S]*?delete:\s*\(id: string\)\s*=>[\s\S]*?createRestrictedDeleteError\(\s*'合同'/ },
    { label: 'billQueryDelete', pattern: /billQueries[\s\S]*?delete:\s*\(id: string\)\s*=>[\s\S]*?createRestrictedDeleteError\(\s*'账单'/ },
    { label: 'meterQueryDelete', pattern: /meterQueries[\s\S]*?delete:\s*\(id: string\)\s*=>[\s\S]*?createRestrictedDeleteError\(\s*'仪表'/ },
  ]

  for (const check of checks) {
    assert(check.pattern.test(source), `${check.label} should be restricted`)
  }

  return checks.map((check) => check.label)
}

function createOverrides(meterRecord: MeterRecord): Overrides {
  const logger = {
    logInfo: () => undefined,
    logError: async () => undefined,
  }

  return {
    'next/server': {
      NextRequest: MockNextRequest,
      NextResponse: MockNextResponse,
    },
    '/home/dell/Projects/Rento/src/lib/error-logger.ts': {
      ErrorLogger: {
        getInstance: () => logger,
      },
      ErrorSeverity: {
        HIGH: 'HIGH',
      },
      ErrorType: {
        DATABASE_ERROR: 'DATABASE_ERROR',
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        SYSTEM_ERROR: 'SYSTEM_ERROR',
      },
    },
    '@/lib/error-logger': {
      ErrorLogger: {
        getInstance: () => logger,
      },
      ErrorSeverity: {
        HIGH: 'HIGH',
      },
      ErrorType: {
        DATABASE_ERROR: 'DATABASE_ERROR',
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        SYSTEM_ERROR: 'SYSTEM_ERROR',
      },
    },
    '/home/dell/Projects/Rento/src/lib/fallback-manager.ts': {
      fallbackManager: {
        handleError: async () => ({ success: false }),
      },
    },
    '@/lib/fallback-manager': {
      fallbackManager: {
        handleError: async () => ({ success: false }),
      },
    },
    '@/lib/prisma': {
      prisma: {
        bill: {
          findUnique: async ({ where }: { where: { id: string } }) =>
            where.id === 'bill-guard'
              ? {
                  id: 'bill-guard',
                  status: 'PENDING',
                  amount: 36,
                  receivedAmount: 0,
                  pendingAmount: 36,
                  paidDate: null,
                  meterReadingId: 'reading-guard',
                  billDetails: [{ id: 'detail-guard' }],
                }
              : null,
          delete: async () => {
            throw new Error('bill hard delete should not happen')
          },
          count: async ({ where }: { where: { meterReading: { meterId: string } } }) =>
            where.meterReading.meterId === meterRecord.id
              ? meterRecord.billCount
              : 0,
        },
        billDetail: {
          count: async ({ where }: { where: { meterReading: { meterId: string } } }) =>
            where.meterReading.meterId === meterRecord.id
              ? meterRecord.billDetailCount
              : 0,
        },
        meter: {
          findUnique: async ({ where }: { where: { id: string } }) =>
            where.id === meterRecord.id
              ? {
                  id: meterRecord.id,
                  roomId: meterRecord.roomId,
                  isActive: meterRecord.isActive,
                  room: {
                    roomNumber: meterRecord.roomNumber,
                    building: {
                      name: 'Validation Building',
                    },
                  },
                  _count: {
                    readings: meterRecord.readingCount,
                  },
                }
              : null,
          delete: async () => {
            throw new Error('meter hard delete should not happen')
          },
        },
        $transaction: async () => {
          throw new Error('transaction should not run in blocked scenarios')
        },
      },
    },
    '@/lib/validation': {
      performDeleteSafetyCheck: async (roomId: string) => {
        assert(roomId === 'room-guard', 'Unexpected room id')
        return {
          canDelete: false,
          roomStatus: 'VACANT',
          contractCount: 1,
          hasActiveContracts: false,
          activeContractCount: 0,
          pendingContractCount: 1,
          billCount: 1,
          hasUnpaidBills: true,
          unpaidBillCount: 1,
          settledBillCount: 0,
          meterCount: 1,
          activeMeterCount: 1,
          inactiveMeterCount: 0,
          meterReadingCount: 1,
          billDetailCount: 1,
          relatedDataTypes: ['contracts', 'bills', 'meters', 'meterReadings'],
          blockingReasons: [
            'ROOM_HAS_CONTRACT_HISTORY',
            'ROOM_HAS_BILL_HISTORY',
            'ROOM_HAS_METER_BINDINGS',
          ],
          errorCode: 'ROOM_HAS_CONTRACT_HISTORY',
          suggestion: '请先取消或归档待生效合同，再决定是否保留房间主数据',
        }
      },
      performContractDeleteSafetyCheck: async (contractId: string) => {
        assert(contractId === 'contract-guard', 'Unexpected contract id')
        return {
          canDelete: false,
          contractStatus: 'PENDING',
          billCount: 1,
          hasPaidBills: false,
          paidBillCount: 0,
          hasUnpaidBills: true,
          unpaidBillCount: 1,
          hasMeterReadings: true,
          meterReadingCount: 1,
          billedMeterReadingCount: 1,
          billDetailCount: 1,
          blockingReasons: [
            'CONTRACT_HAS_UNPAID_BILL_HISTORY',
            'CONTRACT_HAS_BILLED_READING_HISTORY',
          ],
          errorCode: 'CONTRACT_HAS_UNPAID_BILL_HISTORY',
          suggestion: '请保留合同下的账单事实；如需结束关系，请走终止、退租或账务处理流程',
        }
      },
    },
    '@/lib/queries': {
      roomQueries: {},
      contractQueries: {},
      billQueries: {},
      meterQueries: {
        softDelete: async (meterId: string) => {
          assert(meterId === meterRecord.id, 'Unexpected meter id')
          meterRecord.isActive = false
          return {
            id: meterId,
            isActive: false,
          }
        },
      },
    },
    '@/lib/room-utils': {
      transformRoomDecimalFields: (value: unknown) => value,
    },
    '@/lib/meter-utils': {
      validateDisplayName: () => true,
      validateUnitPrice: () => true,
    },
  }
}

async function main() {
  process.env.AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET || 'phase03-delete-guard-secret'
  globalThis.crypto = globalThis.crypto ?? webcrypto

  const meterRecord: MeterRecord = {
    id: 'meter-guard',
    roomId: 'room-guard',
    roomNumber: 'A-101',
    isActive: true,
    readingCount: 1,
    billCount: 1,
    billDetailCount: 1,
  }

  const overrides = createOverrides(meterRecord)
  const cache: ModuleCache = new Map()

  const sessionExports = loadTsModule(
    '/home/dell/Projects/Rento/src/lib/auth/session.ts',
    overrides,
    cache
  )

  const roomRoute = loadTsModule(
    '/home/dell/Projects/Rento/src/app/api/rooms/[id]/route.ts',
    overrides,
    cache
  )
  const contractRoute = loadTsModule(
    '/home/dell/Projects/Rento/src/app/api/contracts/[id]/route.ts',
    overrides,
    cache
  )
  const billRoute = loadTsModule(
    '/home/dell/Projects/Rento/src/app/api/bills/[id]/route.ts',
    overrides,
    cache
  )
  const meterRoute = loadTsModule(
    '/home/dell/Projects/Rento/src/app/api/meters/[meterId]/route.ts',
    overrides,
    cache
  )

  const deleteRoom = roomRoute.DELETE as (
    request: MockNextRequest,
    context: { params: Promise<{ id: string }> }
  ) => Promise<Response>
  const deleteContract = contractRoute.DELETE as (
    request: MockNextRequest,
    context: { params: Promise<{ id: string }> }
  ) => Promise<Response>
  const deleteBill = billRoute.DELETE as (
    request: MockNextRequest,
    context: { params: Promise<{ id: string }> }
  ) => Promise<Response>
  const deleteMeter = meterRoute.DELETE as (
    request: MockNextRequest,
    context: { params: Promise<{ meterId: string }> }
  ) => Promise<Response>

  const roomResponse = await deleteRoom(
    await createAuthedDeleteRequest(
      'http://localhost/api/rooms/room-guard',
      sessionExports
    ),
    { params: Promise.resolve({ id: 'room-guard' }) }
  )
  const roomJson = await parseJson(roomResponse)
  assert(roomResponse.status === 400, 'Room delete should be blocked')
  assert(
    roomJson?.code === 'ROOM_HAS_CONTRACT_HISTORY',
    'Unexpected room guard code'
  )

  const contractResponse = await deleteContract(
    await createAuthedDeleteRequest(
      'http://localhost/api/contracts/contract-guard',
      sessionExports
    ),
    { params: Promise.resolve({ id: 'contract-guard' }) }
  )
  const contractJson = await parseJson(contractResponse)
  assert(contractResponse.status === 400, 'Contract delete should be blocked')
  assert(
    contractJson?.code === 'CONTRACT_HAS_UNPAID_BILL_HISTORY',
    'Unexpected contract guard code'
  )

  const billResponse = await deleteBill(
    await createAuthedDeleteRequest(
      'http://localhost/api/bills/bill-guard',
      sessionExports
    ),
    { params: Promise.resolve({ id: 'bill-guard' }) }
  )
  const billJson = await parseJson(billResponse)
  assert(billResponse.status === 400, 'Bill delete should be blocked')
  assert(
    billJson?.code === 'BILL_HAS_USAGE_HISTORY',
    'Unexpected bill guard code'
  )

  const meterResponse = await deleteMeter(
    await createAuthedDeleteRequest(
      `http://localhost/api/meters/${meterRecord.id}`,
      sessionExports
    ),
    { params: Promise.resolve({ meterId: meterRecord.id }) }
  )
  const meterJson = await parseJson(meterResponse)
  assert(meterResponse.status === 200, 'Meter delete should return success')
  assert(meterJson?.action === 'deactivate', 'Meter should be deactivated')
  assert(meterRecord.isActive === false, 'Meter should become inactive')
  assert(
    meterJson?.details?.readingCount === 1,
    'Meter reading history should be preserved'
  )
  assert(
    meterJson?.details?.billCount === 1,
    'Meter bill history should be preserved'
  )
  assert(
    meterJson?.details?.billDetailCount === 1,
    'Meter bill detail history should be preserved'
  )

  const restrictedQueryDeletes = await verifyRestrictedQueryDeletes()

  const summary: Record<string, GuardSummary | string[]> = {
    roomDelete: {
      status: roomResponse.status,
      code: roomJson?.code,
      details: {
        blockingReasons: roomJson?.details?.blockingReasons,
      },
    },
    contractDelete: {
      status: contractResponse.status,
      code: contractJson?.code,
      details: {
        blockingReasons: contractJson?.details?.blockingReasons,
      },
    },
    billDelete: {
      status: billResponse.status,
      code: billJson?.code,
      details: {
        meterReadingId: billJson?.details?.meterReadingId,
        billDetailCount: billJson?.details?.billDetailCount,
      },
    },
    meterDelete: {
      status: meterResponse.status,
      action: meterJson?.action,
      details: meterJson?.details,
    },
    restrictedQueryDeletes,
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        mode: 'database-free-route-validation',
        summary,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
