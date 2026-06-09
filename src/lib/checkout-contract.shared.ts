import type { MeterType } from '@/types/meter'

import type { SharedBillStatus } from '@/lib/bill-semantics'

/**
 * 退租页前端 DTO：
 * 仅保留浏览器运行时和共享结算逻辑真正需要的字段，
 * 避免前端页面继续经由通用数据库类型入口接触 Prisma 生成类型。
 */
export interface CheckoutContractBillDto {
  id: string
  billNumber: string
  type: string
  amount: number
  receivedAmount: number
  pendingAmount: number
  status: SharedBillStatus
}

export interface CheckoutContractMeterDto {
  id: string
  meterNumber: string
  displayName: string
  meterType: MeterType
  unitPrice: number
  unit: string
  location: string | null
  latestReading: number | null
}

export interface CheckoutContractPageDto {
  id: string
  roomId: string
  contractNumber: string
  startDate: Date | string
  endDate: Date | string
  monthlyRent: number
  totalRent: number
  deposit: number
  keyDeposit: number | null
  cleaningFee: number | null
  status: string
  room: {
    id: string
    roomNumber: string
    building: {
      id: string
      name: string
    }
    meters: CheckoutContractMeterDto[]
  }
  renter: {
    id: string
    name: string
  }
  bills: CheckoutContractBillDto[]
}
