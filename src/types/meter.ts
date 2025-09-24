/**
 * 仪表管理相关类型定义
 */

// 仪表类型枚举
export type MeterType = 'ELECTRICITY' | 'COLD_WATER' | 'HOT_WATER' | 'GAS'

// 抄表状态枚举
export type ReadingStatus = 'PENDING' | 'CONFIRMED' | 'BILLED' | 'CANCELLED'

// 客户端仪表数据类型（Decimal已转换为number）
export interface MeterWithReadingsForClient {
  id: string
  meterNumber: string
  displayName: string
  meterType: MeterType
  roomId: string
  unitPrice: number // 已转换为number
  unit: string
  location?: string | null
  isActive: boolean
  installDate?: Date | null
  sortOrder: number
  remarks?: string | null
  createdAt: Date
  updatedAt: Date
  room: {
    id: string
    roomNumber: string
    building: {
      id: string
      name: string
    }
  }
  readings: Array<{
    id: string
    previousReading?: number | null
    currentReading: number
    usage: number
    readingDate: Date
    unitPrice: number
    amount: number
    status: ReadingStatus
    isBilled: boolean
  }>
}

// 仪表表单数据类型
export interface MeterFormData {
  displayName: string
  meterType: MeterType
  unitPrice: number
  unit: string
  location?: string
  installDate?: Date
  remarks?: string
}

// 仪表更新数据类型
export interface MeterUpdateData {
  displayName?: string
  unitPrice?: number
  unit?: string
  location?: string
  isActive?: boolean
  sortOrder?: number
  remarks?: string
}

// 仪表创建数据类型
export interface MeterCreateData extends MeterFormData {
  roomId: string
  meterNumber: string
  sortOrder: number
}

// 仪表验证结果类型
export interface MeterValidationResult {
  isValid: boolean
  errors: string[]
}

// 仪表业务规则类型
export interface MeterBusinessRules {
  maxMetersPerRoom: number
  maxSameTypePerRoom: number
  priceRange: {
    min: number
    max: number
  }
  displayNameMaxLength: number
  displayNamePattern: RegExp
}

// 仪表统计数据类型
export interface MeterStats {
  totalMeters: number
  activeMeters: number
  metersByType: Record<MeterType, number>
  averageUnitPrice: Record<MeterType, number>
}

// 仪表卡片操作类型
export interface MeterCardActions {
  onEdit: (meter: MeterWithReadingsForClient) => void
  onDelete: (meterId: string) => void
  onToggleStatus: (meterId: string, newStatus: boolean) => void
}

// 仪表列表属性类型
export interface MeterListProps {
  meters: MeterWithReadingsForClient[]
  loading?: boolean
  onAdd: () => void
  actions: MeterCardActions
}

// 仪表表单属性类型
export interface MeterFormProps {
  roomId: string
  meter?: MeterWithReadingsForClient
  onSubmit: (data: MeterFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

// 仪表管理区域属性类型
export interface RoomMeterManagementProps {
  roomId: string
  meters: MeterWithReadingsForClient[]
  onMeterUpdate: () => void
  loading?: boolean
}