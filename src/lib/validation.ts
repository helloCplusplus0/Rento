import { NextRequest } from 'next/server'
import { buildingQueries } from './queries'
import { prisma } from './prisma'

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
export function validateData(data: any, rules: ValidationRules): ValidationError[] {
  const errors: ValidationError[] = []
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field]
    
    // 检查必填字段
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`,
        value
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
        value
      })
      continue
    }
    
    // 字符串长度验证
    if (rule.type === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rule.minLength} characters`,
          value
        })
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field,
          message: `${field} must be at most ${rule.maxLength} characters`,
          value
        })
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field,
          message: `${field} format is invalid`,
          value
        })
      }
    }
    
    // 数值范围验证
    if (rule.type === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field,
          message: `${field} must be at least ${rule.min}`,
          value
        })
      }
      
      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field,
          message: `${field} must be at most ${rule.max}`,
          value
        })
      }
    }
    
    // 枚举值验证
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field,
        message: `${field} must be one of: ${rule.enum.join(', ')}`,
        value
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
    pattern: /^[A-Z0-9]+$/
  },
  floorNumber: {
    required: true,
    type: 'number',
    min: 1,
    max: 50
  },
  roomType: {
    required: true,
    type: 'string',
    enum: ['SHARED', 'WHOLE', 'SINGLE']
  },
  area: {
    required: false,
    type: 'number',
    min: 10,
    max: 200
  },
  rent: {
    required: true,
    type: 'number',
    min: 100,
    max: 50000
  },
  buildingId: {
    required: true,
    type: 'string'
  }
}

/**
 * 房间状态验证规则
 */
export const roomStatusValidationRules: ValidationRules = {
  status: {
    required: true,
    type: 'string',
    enum: ['VACANT', 'OCCUPIED', 'OVERDUE', 'MAINTENANCE']
  }
}

/**
 * 批量更新验证规则
 */
export const batchUpdateValidationRules: ValidationRules = {
  roomIds: {
    required: true,
    type: 'object' // array
  },
  status: {
    required: true,
    type: 'string',
    enum: ['VACANT', 'OCCUPIED', 'OVERDUE', 'MAINTENANCE']
  },
  operator: {
    required: false,
    type: 'string',
    maxLength: 100
  }
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
            details: errors 
          },
          { status: 400 }
        )
      }
      
      return null // 验证通过
    } catch (error) {
      return Response.json(
        { error: 'Invalid JSON data' },
        { status: 400 }
      )
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
        return Response.json(
          { error: 'Building not found' },
          { status: 404 }
        )
      }
      
      // 检查房间号唯一性（排除当前房间）
      const existingRooms = await prisma.room.findMany({
        where: {
          buildingId: roomData.buildingId,
          roomNumber: roomData.roomNumber,
          ...(roomData.id && { id: { not: roomData.id } })
        }
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
      const invalidIds = body.roomIds.filter((id: any) => typeof id !== 'string' || !id.trim())
      if (invalidIds.length > 0) {
        return Response.json(
          { error: 'All room IDs must be valid strings' },
          { status: 400 }
        )
      }
      
      return null // 验证通过
    } catch (error) {
      return Response.json(
        { error: 'Invalid JSON data' },
        { status: 400 }
      )
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
        include: {
          bills: {
            where: {
              status: { not: 'PAID' }
            }
          }
        }
      }
    }
  })
  
  if (!room) {
    throw new Error('Room not found')
  }
  
  const activeContracts = room.contracts?.filter(c => c.status === 'ACTIVE') || []
  const unpaidBills = room.contracts?.flatMap(c => c.bills || []) || []
  
  return {
    hasActiveContracts: activeContracts.length > 0,
    activeContractCount: activeContracts.length,
    hasUnpaidBills: unpaidBills.length > 0,
    unpaidBillCount: unpaidBills.length,
    hasRelatedData: activeContracts.length > 0 || unpaidBills.length > 0,
    relatedDataTypes: [
      ...(activeContracts.length > 0 ? ['contracts'] : []),
      ...(unpaidBills.length > 0 ? ['bills'] : [])
    ]
  }
}