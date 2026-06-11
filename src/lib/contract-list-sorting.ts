import { calculateDaysUntilContractExpiry } from '@/lib/contract-alert-semantics'
import type { ContractWithDetailsForClient } from '@/types/database'

function createStartOfToday(now: Date): Date {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return today
}

function getContractDistanceFromToday(
  contract: ContractWithDetailsForClient,
  now: Date
): number {
  return Math.abs(calculateDaysUntilContractExpiry(contract.endDate, now))
}

export function sortContractsForList(
  contracts: ContractWithDetailsForClient[],
  now: Date = new Date()
): ContractWithDetailsForClient[] {
  const today = createStartOfToday(now)

  return [...contracts].sort((left, right) => {
    const terminatedDiff =
      Number(left.status === 'TERMINATED') - Number(right.status === 'TERMINATED')
    if (terminatedDiff !== 0) {
      return terminatedDiff
    }

    const distanceDiff =
      getContractDistanceFromToday(left, today) -
      getContractDistanceFromToday(right, today)
    if (distanceDiff !== 0) {
      return distanceDiff
    }

    const endDateDiff =
      new Date(left.endDate).getTime() - new Date(right.endDate).getTime()
    if (endDateDiff !== 0) {
      return endDateDiff
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })
}
