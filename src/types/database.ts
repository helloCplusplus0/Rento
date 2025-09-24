// 导出 Prisma 生成的类型
export type {
  Building,
  Room,
  Renter,
  Contract,
  Bill,
  RoomType,
  RoomStatus,
  ContractStatus,
  BillType,
  BillStatus,
} from '@prisma/client'

import type {
  Building,
  Room,
  Renter,
  Contract,
  Bill,
} from '@prisma/client'

// 扩展类型定义
export interface BuildingWithRooms extends Building {
  rooms: Room[]
}

export interface RoomWithBuilding extends Room {
  building: Building
}

// 为客户端组件定义的房间类型（Decimal 转换为 number）
export interface RoomWithBuildingForClient extends Omit<Room, 'rent' | 'area'> {
  rent: number
  area: number | null
  building: Omit<Building, 'totalRooms'> & {
    totalRooms: number
  }
  contracts?: (Omit<Contract, 'monthlyRent' | 'totalRent' | 'deposit' | 'keyDeposit' | 'cleaningFee'> & {
    monthlyRent: number
    totalRent: number
    deposit: number
    keyDeposit: number | null
    cleaningFee: number | null
    renter?: Renter
    bills?: (Omit<Bill, 'amount' | 'receivedAmount' | 'pendingAmount'> & {
      amount: number
      receivedAmount: number
      pendingAmount: number
    })[]
  })[]
}

export interface RoomWithContracts extends Room {
  building: Building
  contracts: (Contract & {
    renter: Renter
    bills: Bill[]
  })[]
}

export interface ContractWithDetails extends Contract {
  room: RoomWithBuilding
  renter: Renter
  bills: Bill[]
}

export interface BillWithContract extends Bill {
  contract: ContractWithDetails
}

// 统计数据类型
export interface DashboardStats {
  pendingReceivables: number    // 待收逾期金额
  pendingPayables: number       // 待付逾期金额
  todayStats: {
    receivables: number         // 今日收款笔数
    payables: number           // 今日付款笔数
  }
  monthlyStats: {
    receivables: number         // 30日内收款笔数  
    payables: number           // 30日内付款笔数
  }
}

// 房间状态统计
export interface RoomStatusStats {
  vacant: number      // 空房数量
  occupied: number    // 在租数量
  overdue: number     // 逾期数量
  maintenance: number // 维护数量
  total: number       // 总数量
}

// 账单汇总统计
// 为客户端组件定义的合同类型（Decimal 转换为 number）
export interface ContractWithDetailsForClient extends Omit<Contract, 'monthlyRent' | 'totalRent' | 'deposit' | 'keyDeposit' | 'cleaningFee'> {
  monthlyRent: number
  totalRent: number
  deposit: number
  keyDeposit: number | null
  cleaningFee: number | null
  room: RoomWithBuildingForClient
  renter: Renter
  bills?: (Omit<Bill, 'amount' | 'receivedAmount' | 'pendingAmount'> & {
    amount: number
    receivedAmount: number
    pendingAmount: number
  })[]
}

// 为客户端组件定义的租客类型（包含合同信息）
export interface RenterWithContractsForClient extends Renter {
  contracts: (Omit<Contract, 'monthlyRent' | 'totalRent' | 'deposit' | 'keyDeposit' | 'cleaningFee'> & {
    monthlyRent: number
    totalRent: number
    deposit: number
    keyDeposit: number | null
    cleaningFee: number | null
    room?: RoomWithBuildingForClient
    bills?: (Omit<Bill, 'amount' | 'receivedAmount' | 'pendingAmount'> & {
      amount: number
      receivedAmount: number
      pendingAmount: number
    })[]
  })[]
}

// 账单表单数据类型
export interface BillFormData {
  billNumber: string
  amount: number
  dueDate: Date
  period: string
  remarks: string
}