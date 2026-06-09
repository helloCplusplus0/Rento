export type RoomType = 'SHARED' | 'WHOLE' | 'SINGLE'
export type RoomStatus = 'VACANT' | 'OCCUPIED' | 'OVERDUE' | 'MAINTENANCE'
export type ContractStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
export type BillType = 'RENT' | 'DEPOSIT' | 'UTILITIES' | 'OTHER'
export type BillStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'COMPLETED'

/**
 * 前端 DTO / view-model 真相源：
 * 保持与正式业务语义对齐，但不再让浏览器可达模块直接依赖 Prisma 生成类型。
 */
export interface Building {
  id: string
  name: string
  address: string | null
  totalRooms: number
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Room {
  id: string
  roomNumber: string
  floorNumber: number
  buildingId: string
  roomType: RoomType
  area: number | null
  rent: number
  status: RoomStatus
  currentRenter: string | null
  overdueDays: number | null
  createdAt: Date
  updatedAt: Date
}

export interface Renter {
  id: string
  name: string
  gender: string | null
  phone: string
  idCard: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  occupation: string | null
  company: string | null
  moveInDate: Date | null
  tenantCount: number | null
  remarks: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Contract {
  id: string
  contractNumber: string
  roomId: string
  renterId: string
  startDate: Date
  endDate: Date
  isExtended: boolean
  monthlyRent: number
  totalRent: number
  deposit: number
  keyDeposit: number | null
  cleaningFee: number | null
  status: ContractStatus
  businessStatus: string | null
  paymentMethod: string | null
  paymentTiming: string | null
  signedBy: string | null
  signedDate: Date | null
  remarks: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Bill {
  id: string
  billNumber: string
  type: BillType
  itemLabel: string | null
  amount: number
  receivedAmount: number
  pendingAmount: number
  dueDate: Date
  paidDate: Date | null
  period: string | null
  status: BillStatus
  contractId: string
  paymentMethod: string | null
  operator: string | null
  remarks: string | null
  aggregationType: string | null
  metadata: string | null
  meterReadingId: string | null
  createdAt: Date
  updatedAt: Date
}

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
  contracts?: (Omit<
    Contract,
    'monthlyRent' | 'totalRent' | 'deposit' | 'keyDeposit' | 'cleaningFee'
  > & {
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

// 统计数据类型
export interface DashboardStats {
  pendingReceivables: number // 待收逾期金额
  pendingPayables: number // 待付逾期金额
  todayStats: {
    receivables: number // 今日收款笔数
    payables: number // 今日付款笔数
  }
  monthlyStats: {
    receivables: number // 30日内收款笔数
    payables: number // 30日内付款笔数
  }
}

// 房间状态统计
export interface RoomStatusStats {
  vacant: number // 空房数量
  occupied: number // 在租数量
  overdue: number // 逾期数量
  maintenance: number // 维护数量
  total: number // 总数量
}

// 账单汇总统计
// 为客户端组件定义的合同类型（Decimal 转换为 number）
export interface ContractWithDetailsForClient
  extends Omit<
    Contract,
    'monthlyRent' | 'totalRent' | 'deposit' | 'keyDeposit' | 'cleaningFee'
  > {
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

/**
 * 兼容保留：
 * 旧组件仍可能引用 `ContractWithDetails` / `BillWithContract`，
 * 但前端真相源已统一收口到 DTO / view-model。
 */
export type ContractWithDetails = ContractWithDetailsForClient

export type BillContractForClient = Omit<ContractWithDetailsForClient, 'bills'>

export interface BillWithContractForClient
  extends Omit<Bill, 'amount' | 'receivedAmount' | 'pendingAmount'> {
  amount: number
  receivedAmount: number
  pendingAmount: number
  contract: BillContractForClient
}

export type BillWithContract = BillWithContractForClient

// 为客户端组件定义的租客类型（包含合同信息）
export interface RenterWithContractsForClient extends Renter {
  contracts: (Omit<
    Contract,
    'monthlyRent' | 'totalRent' | 'deposit' | 'keyDeposit' | 'cleaningFee'
  > & {
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
  itemLabel: string
  remarks: string
}
