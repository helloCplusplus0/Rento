import { toNullableFiniteNumber } from '@/lib/number-coercion'
import type { ContractStatus, RenterWithContractsForClient } from '@/types/database'

type RenterContractForDisplay = RenterWithContractsForClient['contracts'][number]
type RenterStatusLabel = '在租' | '空闲'

export interface RenterCardViewModel {
  id: string
  name: string
  phone: string
  gender: string | null
  moveInDate: Date | null
  contractCount: number
  statusLabel: RenterStatusLabel
  currentRoomLabel: string
  monthlyRent: number | null
  footerHint: string | null
}

export interface RenterCurrentStatusViewModel {
  badgeLabel: RenterStatusLabel
  badgeVariant: 'default' | 'secondary'
  title: string
  description: string
  roomLabel: string | null
  contractNumber: string | null
  monthlyRent: number | null
  startDate: Date | null
  endDate: Date | null
}

export interface RenterBasicInfoViewModel {
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
  currentStatus: RenterCurrentStatusViewModel
}

export interface RenterContractHistoryItemViewModel {
  id: string
  contractNumber: string
  status: ContractStatus
  roomLabel: string
  startDate: Date
  endDate: Date
  monthlyRent: number | null
  deposit: number | null
  billCount: number
  paidCount: number
  unpaidCount: number
  createdAt: Date | null
  updatedAt: Date | null
}

function isDateValue(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

function toSafeDate(value: unknown): Date | null {
  return isDateValue(value) ? value : null
}

function toRoomLabel(contract: RenterContractForDisplay) {
  const buildingName = contract.room?.building?.name?.trim()
  const roomNumber = contract.room?.roomNumber?.trim()

  if (buildingName && roomNumber) {
    return `${buildingName} - ${roomNumber}`
  }

  if (roomNumber) {
    return roomNumber
  }

  return '房间信息待补全'
}

function toMoneyValue(value: unknown): number | null {
  return toNullableFiniteNumber(value)
}

function getActiveContract(contracts: RenterContractForDisplay[] = []) {
  return contracts.find((contract) => contract.status === 'ACTIVE') ?? null
}

export function buildRenterCardViewModel(
  renter: RenterWithContractsForClient
): RenterCardViewModel {
  const activeContract = getActiveContract(renter.contracts)
  const hasActiveContract = Boolean(activeContract)

  return {
    id: renter.id,
    name: renter.name,
    phone: renter.phone,
    gender: renter.gender,
    moveInDate: renter.moveInDate,
    contractCount: renter.contracts?.length ?? 0,
    statusLabel: hasActiveContract ? '在租' : '空闲',
    currentRoomLabel: activeContract ? toRoomLabel(activeContract) : '暂无生效合同',
    monthlyRent: activeContract ? toMoneyValue(activeContract.monthlyRent) : null,
    footerHint: hasActiveContract
      ? '房间与租金来自当前生效合同'
      : renter.contracts?.length
        ? '当前无活跃合同'
        : null,
  }
}

export function buildRenterBasicInfoViewModel(
  renter: RenterWithContractsForClient
): RenterBasicInfoViewModel {
  const activeContract = getActiveContract(renter.contracts)

  const currentStatus: RenterCurrentStatusViewModel = activeContract
    ? {
        badgeLabel: '在租',
        badgeVariant: 'default',
        title: '当前存在生效中的租住合同',
        description:
          '当前房间与月租金来自生效合同快照；合同结束、终止或切换后会自动刷新为最新状态。',
        roomLabel: toRoomLabel(activeContract),
        contractNumber: activeContract.contractNumber,
        monthlyRent: toMoneyValue(activeContract.monthlyRent),
        startDate: toSafeDate(activeContract.startDate),
        endDate: toSafeDate(activeContract.endDate),
      }
    : {
        badgeLabel: '空闲',
        badgeVariant: 'secondary',
        title: '当前暂无生效合同',
        description:
          '该租客当前未关联 ACTIVE 合同，列表不会再展示误导性的房间或月租快照。',
        roomLabel: null,
        contractNumber: null,
        monthlyRent: null,
        startDate: null,
        endDate: null,
      }

  return {
    name: renter.name,
    gender: renter.gender,
    phone: renter.phone,
    idCard: renter.idCard,
    emergencyContact: renter.emergencyContact,
    emergencyPhone: renter.emergencyPhone,
    occupation: renter.occupation,
    company: renter.company,
    moveInDate: renter.moveInDate,
    tenantCount: renter.tenantCount,
    remarks: renter.remarks,
    currentStatus,
  }
}

export function buildRenterContractHistoryViewModels(
  contracts: RenterContractForDisplay[] = []
): RenterContractHistoryItemViewModel[] {
  return [...contracts]
    .sort((left, right) => {
      const rightTime = new Date(
        right.updatedAt ?? right.createdAt ?? right.startDate
      ).getTime()
      const leftTime = new Date(
        left.updatedAt ?? left.createdAt ?? left.startDate
      ).getTime()

      return rightTime - leftTime
    })
    .map((contract) => {
      const bills = contract.bills ?? []

      return {
        id: contract.id,
        contractNumber: contract.contractNumber,
        status: contract.status,
        roomLabel: toRoomLabel(contract),
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlyRent: toMoneyValue(contract.monthlyRent),
        deposit: toMoneyValue(contract.deposit),
        billCount: bills.length,
        paidCount: bills.filter(
          (bill) => bill.status === 'PAID' || bill.status === 'COMPLETED'
        ).length,
        unpaidCount: bills.filter(
          (bill) => bill.status === 'PENDING' || bill.status === 'OVERDUE'
        ).length,
        createdAt: toSafeDate(contract.createdAt),
        updatedAt: toSafeDate(contract.updatedAt),
      }
    })
}
