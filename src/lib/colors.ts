/**
 * 色彩系统定义
 * 基于 UI 分析文档提取的状态色彩规范
 */

export const statusColors = {
  // 房间状态色彩
  room: {
    VACANT: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      indicator: '#10B981'
    },
    OCCUPIED: {
      bg: 'bg-blue-100', 
      text: 'text-blue-800',
      border: 'border-blue-200',
      indicator: '#3B82F6'
    },
    OVERDUE: {
      bg: 'bg-red-100',
      text: 'text-red-800', 
      border: 'border-red-200',
      indicator: '#EF4444'
    },
    MAINTENANCE: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200', 
      indicator: '#6B7280'
    }
  },
  
  // 账单状态色彩
  bill: {
    PENDING: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      indicator: '#F59E0B'
    },
    PAID: {
      bg: 'bg-green-100',
      text: 'text-green-800', 
      border: 'border-green-200',
      indicator: '#10B981'
    },
    OVERDUE: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      indicator: '#EF4444'
    },
    COMPLETED: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
      indicator: '#6B7280'
    }
  },
  
  // 合同状态色彩
  contract: {
    ACTIVE: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      indicator: '#10B981'
    },
    EXPIRED: {
      bg: 'bg-red-100', 
      text: 'text-red-800',
      border: 'border-red-200',
      indicator: '#EF4444'
    },
    PENDING: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      indicator: '#F59E0B'
    },
    TERMINATED: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
      indicator: '#6B7280'
    }
  }
} as const

// 状态文本映射
export const statusTextMap = {
  room: {
    VACANT: '空房',
    OCCUPIED: '在租',
    OVERDUE: '逾期', 
    MAINTENANCE: '维护'
  },
  bill: {
    PENDING: '待付',
    PAID: '已付',
    OVERDUE: '逾期',
    COMPLETED: '完成'
  },
  contract: {
    ACTIVE: '生效',
    EXPIRED: '到期',
    PENDING: '待签',
    TERMINATED: '终止'
  }
} as const

// 类型定义
export type StatusType = keyof typeof statusColors
export type RoomStatus = keyof typeof statusColors.room
export type BillStatus = keyof typeof statusColors.bill
export type ContractStatus = keyof typeof statusColors.contract
export type AllStatus = RoomStatus | BillStatus | ContractStatus