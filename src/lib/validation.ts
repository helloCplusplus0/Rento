import { NextRequest } from 'next/server'

import { prisma } from './prisma'
import { buildingQueries } from './queries'

export interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  enum?: string[]
  format?: 'email' | 'phone' | 'cuid' | 'date'
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface ValidationError {
  field: string
  message: string
  value: any
}

/**
 * 数据验证函数
 * 根据验证规则验证数据对象
 */
export function validateData(
  data: any,
  rules: ValidationRules
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field]

    // 检查必填字段
    if (
      rule.required &&
      (value === undefined || value === null || value === '')
    ) {
      errors.push({
        field,
        message: `${field} is required`,
        value,
      })
      continue
    }

    // 如果字段为空且非必填，跳过其他验证
    if (value === undefined || value === null || value === '') {
      continue
    }

    // 类型验证
    if (rule.type && typeof value !== rule.type) {
      errors.push({
        field,
        message: `${field} must be of type ${rule.type}`,
        value,
      })
      continue
    }

    // 字符串长度验证
    if (rule.type === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rule.minLength} characters`,
          value,
        })
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field,
          message: `${field} must be at most ${rule.maxLength} characters`,
          value,
        })
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field,
          message: `${field} format is invalid`,
          value,
        })
      }
    }

    // 数值范围验证
    if (rule.type === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field,
          message: `${field} must be at least ${rule.min}`,
          value,
        })
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field,
          message: `${field} must be at most ${rule.max}`,
          value,
        })
      }
    }

    // 枚举值验证
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field,
        message: `${field} must be one of: ${rule.enum.join(', ')}`,
        value,
      })
    }
  }

  return errors
}

/**
 * 房间数据验证规则
 */
export const roomValidationRules: ValidationRules = {
  roomNumber: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 20,
    pattern: /^[A-Z0-9]+$/,
  },
  floorNumber: {
    required: true,
    type: 'number',
    min: 1,
    max: 50,
  },
  roomType: {
    required: true,
    type: 'string',
    enum: ['SHARED', 'WHOLE', 'SINGLE'],
  },
  area: {
    required: false,
    type: 'number',
    min: 10,
    max: 200,
  },
  rent: {
    required: true,
    type: 'number',
    min: 100,
    max: 50000,
  },
  buildingId: {
    required: true,
    type: 'string',
  },
}

/**
 * 房间状态验证规则
 */
export const roomStatusValidationRules: ValidationRules = {
  status: {
    required: true,
    type: 'string',
    enum: ['VACANT', 'OCCUPIED', 'OVERDUE', 'MAINTENANCE'],
  },
}

/**
 * 批量更新验证规则
 */
export const batchUpdateValidationRules: ValidationRules = {
  roomIds: {
    required: true,
    type: 'object', // array
  },
  status: {
    required: true,
    type: 'string',
    enum: ['VACANT', 'OCCUPIED', 'OVERDUE', 'MAINTENANCE'],
  },
  operator: {
    required: false,
    type: 'string',
    maxLength: 100,
  },
}

/**
 * 数据验证中间件
 * 验证请求数据格式和基础规则
 */
export function validateRoomData(rules: ValidationRules) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json()
      const errors = validateData(body, rules)

      if (errors.length > 0) {
        return Response.json(
          {
            error: 'Validation failed',
            details: errors,
          },
          { status: 400 }
        )
      }

      return null // 验证通过
    } catch (error) {
      return Response.json({ error: 'Invalid JSON data' }, { status: 400 })
    }
  }
}

/**
 * 业务规则验证中间件
 * 验证业务逻辑和数据库约束
 */
export function validateBusinessRules() {
  return async (request: NextRequest, roomData: any) => {
    try {
      // 检查楼栋是否存在
      const building = await buildingQueries.findById(roomData.buildingId)
      if (!building) {
        return Response.json({ error: 'Building not found' }, { status: 404 })
      }

      // 检查房间号唯一性（排除当前房间）
      const existingRooms = await prisma.room.findMany({
        where: {
          buildingId: roomData.buildingId,
          roomNumber: roomData.roomNumber,
          ...(roomData.id && { id: { not: roomData.id } }),
        },
      })

      if (existingRooms.length > 0) {
        return Response.json(
          { error: 'Room number already exists in this building' },
          { status: 409 }
        )
      }

      return null // 验证通过
    } catch (error) {
      console.error('Business validation error:', error)
      return Response.json(
        { error: 'Business validation failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * 批量更新数据验证
 */
export function validateBatchUpdateData() {
  return async (request: NextRequest) => {
    try {
      const body = await request.json()

      // 基础数据验证
      const errors = validateData(body, batchUpdateValidationRules)
      if (errors.length > 0) {
        return Response.json(
          { error: 'Validation failed', details: errors },
          { status: 400 }
        )
      }

      // 验证房间ID数组
      if (!Array.isArray(body.roomIds) || body.roomIds.length === 0) {
        return Response.json(
          { error: 'Room IDs must be a non-empty array' },
          { status: 400 }
        )
      }

      // 限制批量操作数量
      if (body.roomIds.length > 100) {
        return Response.json(
          { error: 'Cannot update more than 100 rooms at once' },
          { status: 400 }
        )
      }

      // 验证房间ID格式
      const invalidIds = body.roomIds.filter(
        (id: any) => typeof id !== 'string' || !id.trim()
      )
      if (invalidIds.length > 0) {
        return Response.json(
          { error: 'All room IDs must be valid strings' },
          { status: 400 }
        )
      }

      return null // 验证通过
    } catch (error) {
      return Response.json({ error: 'Invalid JSON data' }, { status: 400 })
    }
  }
}

/**
 * 房间删除安全检查
 */
export async function performDeleteSafetyCheck(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      contracts: {
        select: {
          id: true,
          status: true,
          bills: {
            select: {
              id: true,
              status: true,
              amount: true,
              pendingAmount: true,
              receivedAmount: true,
            },
          },
        },
      },
      meters: {
        select: {
          id: true,
          isActive: true,
          readings: {
            select: {
              id: true,
              billDetails: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!room) {
    throw new Error('Room not found')
  }

  const contracts = room.contracts || []
  const meters = room.meters || []
  const bills = contracts.flatMap((contract) => contract.bills || [])
  const meterReadings = meters.flatMap((meter) => meter.readings || [])
  const billDetails = meterReadings.flatMap((reading) => reading.billDetails || [])

  const activeContracts = contracts.filter((contract) => contract.status === 'ACTIVE')
  const pendingContracts = contracts.filter(
    (contract) => contract.status === 'PENDING'
  )
  const settledBills = bills.filter(
    (bill) =>
      bill.status === 'PAID' ||
      bill.status === 'COMPLETED' ||
      Number(bill.receivedAmount) > 0 ||
      Number(bill.pendingAmount) < Number(bill.amount)
  )
  const unpaidBills = bills.filter(
    (bill) =>
      bill.status === 'PENDING' ||
      bill.status === 'OVERDUE' ||
      Number(bill.pendingAmount) > 0
  )
  const activeMeters = meters.filter((meter) => meter.isActive)
  const inactiveMeters = meters.filter((meter) => !meter.isActive)

  const blockingReasons: string[] = []
  const relatedDataTypes: string[] = []

  if (room.status === 'OCCUPIED' || room.status === 'OVERDUE') {
    blockingReasons.push('ROOM_STATUS_NOT_RELEASABLE')
  }

  if (activeContracts.length > 0) {
    blockingReasons.push('ROOM_HAS_ACTIVE_CONTRACTS')
  }

  if (pendingContracts.length > 0) {
    blockingReasons.push('ROOM_HAS_PENDING_CONTRACTS')
  }

  if (contracts.length > 0) {
    blockingReasons.push('ROOM_HAS_CONTRACT_HISTORY')
    relatedDataTypes.push('contracts')
  }

  if (bills.length > 0) {
    blockingReasons.push('ROOM_HAS_BILL_HISTORY')
    relatedDataTypes.push('bills')
  }

  if (billDetails.length > 0) {
    blockingReasons.push('ROOM_HAS_BILL_DETAIL_HISTORY')
    relatedDataTypes.push('billDetails')
  }

  if (activeMeters.length > 0) {
    blockingReasons.push('ROOM_HAS_ACTIVE_METERS')
  }

  if (meters.length > 0) {
    blockingReasons.push('ROOM_HAS_METER_BINDINGS')
    relatedDataTypes.push('meters')
  }

  if (meterReadings.length > 0) {
    blockingReasons.push('ROOM_HAS_METER_READING_HISTORY')
    relatedDataTypes.push('meterReadings')
  }

  const errorCode = blockingReasons[0] || null
  const suggestion =
    errorCode === 'ROOM_STATUS_NOT_RELEASABLE'
      ? '请先通过退租、结清欠费或恢复空置流程释放房间，再评估是否归档该房间'
      : errorCode === 'ROOM_HAS_ACTIVE_CONTRACTS'
        ? '请先终止或完成当前合同，不要通过删除房间清空在租事实'
        : errorCode === 'ROOM_HAS_PENDING_CONTRACTS'
          ? '请先取消或归档待生效合同，再决定是否保留房间主数据'
          : errorCode === 'ROOM_HAS_BILL_HISTORY' ||
              errorCode === 'ROOM_HAS_BILL_DETAIL_HISTORY'
            ? '账单、账单明细和收支事实必须保留；如房间停用，请改走归档而不是删除'
            : errorCode === 'ROOM_HAS_ACTIVE_METERS' ||
                errorCode === 'ROOM_HAS_METER_BINDINGS'
              ? '请先通过仪表停用或专用解绑流程处理仪表资产，再保留房间历史'
              : errorCode === 'ROOM_HAS_METER_READING_HISTORY'
                ? '房间下已有抄表历史，必须保留读数事实；请改走归档或停用流程'
                : null

  return {
    canDelete: blockingReasons.length === 0,
    roomStatus: room.status,
    contractCount: contracts.length,
    hasActiveContracts: activeContracts.length > 0,
    activeContractCount: activeContracts.length,
    pendingContractCount: pendingContracts.length,
    billCount: bills.length,
    hasUnpaidBills: unpaidBills.length > 0,
    unpaidBillCount: unpaidBills.length,
    settledBillCount: settledBills.length,
    meterCount: meters.length,
    activeMeterCount: activeMeters.length,
    inactiveMeterCount: inactiveMeters.length,
    meterReadingCount: meterReadings.length,
    billDetailCount: billDetails.length,
    hasRelatedData: relatedDataTypes.length > 0,
    relatedDataTypes,
    errorCode,
    blockingReasons,
    suggestion,
  }
}

/**
 * 合同删除安全检查
 */
export async function performContractDeleteSafetyCheck(contractId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      bills: {
        select: {
          id: true,
          status: true,
          amount: true,
          pendingAmount: true,
          receivedAmount: true,
        },
      },
      meterReadings: {
        select: {
          id: true,
          status: true,
          isBilled: true,
          bills: {
            select: {
              id: true,
            },
          },
          billDetails: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  })

  if (!contract) {
    throw new Error('Contract not found')
  }

  const paidBills =
    contract.bills?.filter(
      (bill) =>
        bill.status === 'PAID' ||
        bill.status === 'COMPLETED' ||
        Number(bill.receivedAmount) > 0 ||
        Number(bill.pendingAmount) < Number(bill.amount)
    ) || []

  const unpaidBills =
    contract.bills?.filter(
      (bill) =>
        bill.status === 'PENDING' ||
        bill.status === 'OVERDUE' ||
        Number(bill.pendingAmount) > 0
    ) || []

  const billCount = contract.bills?.length || 0
  const meterReadingCount = contract.meterReadings?.length || 0
  const billDetails =
    contract.meterReadings?.flatMap((reading) => reading.billDetails || []) || []
  const billedMeterReadings =
    contract.meterReadings?.filter(
      (reading) =>
        reading.isBilled ||
        reading.bills.length > 0 ||
        reading.billDetails.length > 0
    ) || []

  const blockingReasons: string[] = []

  if (contract.status !== 'PENDING') {
    blockingReasons.push(`CONTRACT_STATUS_${contract.status}`)
  }

  if (paidBills.length > 0) {
    blockingReasons.push('CONTRACT_HAS_PAID_BILL_HISTORY')
  }

  if (unpaidBills.length > 0) {
    blockingReasons.push('CONTRACT_HAS_UNPAID_BILL_HISTORY')
  }

  if (billDetails.length > 0 || billedMeterReadings.length > 0) {
    blockingReasons.push('CONTRACT_HAS_BILLED_READING_HISTORY')
  }

  if (meterReadingCount > 0) {
    blockingReasons.push('CONTRACT_HAS_METER_READING_HISTORY')
  }

  const errorCode = blockingReasons[0] || null
  const suggestion =
    errorCode === 'CONTRACT_STATUS_ACTIVE'
      ? '请使用退租或终止流程处理生效中的合同，不要直接删除合同锚点'
      : errorCode === 'CONTRACT_STATUS_EXPIRED'
        ? '已到期合同属于历史事实，请保留记录并通过续租或归档流程处理'
        : errorCode === 'CONTRACT_STATUS_TERMINATED'
          ? '已终止合同应作为历史保留，不应再次物理删除'
          : errorCode === 'CONTRACT_HAS_PAID_BILL_HISTORY' ||
              errorCode === 'CONTRACT_HAS_UNPAID_BILL_HISTORY'
            ? '请保留合同下的账单事实；如需结束关系，请走终止、退租或账务处理流程'
            : errorCode === 'CONTRACT_HAS_BILLED_READING_HISTORY' ||
                errorCode === 'CONTRACT_HAS_METER_READING_HISTORY'
              ? '合同下已有抄表或计费历史，请保留事实链并改走终止/归档流程'
              : null

  return {
    canDelete: blockingReasons.length === 0,
    contractStatus: contract.status,
    billCount,
    hasPaidBills: paidBills.length > 0,
    paidBillCount: paidBills.length,
    hasUnpaidBills: unpaidBills.length > 0,
    unpaidBillCount: unpaidBills.length,
    hasMeterReadings: meterReadingCount > 0,
    meterReadingCount,
    billedMeterReadingCount: billedMeterReadings.length,
    billDetailCount: billDetails.length,
    errorCode,
    blockingReasons,
    suggestion,
  }
}
