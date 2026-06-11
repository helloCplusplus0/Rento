import { prisma } from './prisma'

const RENEWAL_REMARK_MARKERS = ['[续租记录', '续租至合同', '续租记录', '续租自合同']

interface AuditFilters {
  contractNumbers?: string[]
}

interface CandidateExtendedExpiredContract {
  id: string
  contractNumber: string
  roomId: string
  renterId: string
  status: string
  isExtended: boolean
  businessStatus: string | null
  startDate: Date
  endDate: Date
  remarks: string | null
  createdAt: Date
  updatedAt: Date
  renter: {
    name: string
    phone: string
  }
  room: {
    roomNumber: string
    building: {
      name: string
    }
  }
}

interface SuccessorContractCandidate {
  id: string
  contractNumber: string
  status: string
  startDate: Date
  endDate: Date
  createdAt: Date
}

export interface ExtendedExpiredContractAuditResult {
  contractId: string
  contractNumber: string
  status: string
  isExtended: boolean
  businessStatus: string | null
  renterName: string
  renterPhone: string
  roomInfo: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  remarks: string | null
  hasRenewalRemarkEvidence: boolean
  successorContracts: Array<{
    contractId: string
    contractNumber: string
    status: string
    startDate: string
    endDate: string
    createdAt: string
  }>
}

export interface ExtendedExpiredContractAuditSummary {
  totalMatchedContracts: number
  contractsWithRenewalRemarkEvidence: number
  contractsWithSuccessorCandidates: number
  results: ExtendedExpiredContractAuditResult[]
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function hasRenewalRemarkEvidence(remarks: string | null): boolean {
  if (!remarks) {
    return false
  }

  return RENEWAL_REMARK_MARKERS.some((marker) => remarks.includes(marker))
}

async function loadCandidateContracts(
  filters: AuditFilters = {}
): Promise<CandidateExtendedExpiredContract[]> {
  return prisma.contract.findMany({
    where: {
      status: 'EXPIRED',
      isExtended: true,
      ...(filters.contractNumbers?.length
        ? {
            contractNumber: {
              in: filters.contractNumbers,
            },
          }
        : {}),
    },
    orderBy: [{ endDate: 'asc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      contractNumber: true,
      roomId: true,
      renterId: true,
      status: true,
      isExtended: true,
      businessStatus: true,
      startDate: true,
      endDate: true,
      remarks: true,
      createdAt: true,
      updatedAt: true,
      renter: {
        select: {
          name: true,
          phone: true,
        },
      },
      room: {
        select: {
          roomNumber: true,
          building: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })
}

async function loadSuccessorContracts(
  contract: CandidateExtendedExpiredContract
): Promise<SuccessorContractCandidate[]> {
  return prisma.contract.findMany({
    where: {
      id: {
        not: contract.id,
      },
      roomId: contract.roomId,
      renterId: contract.renterId,
      startDate: {
        gte: contract.endDate,
      },
    },
    orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
    take: 3,
    select: {
      id: true,
      contractNumber: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
    },
  })
}

export async function auditExtendedExpiredContracts(
  filters: AuditFilters = {}
): Promise<ExtendedExpiredContractAuditSummary> {
  const candidates = await loadCandidateContracts(filters)
  const results = await Promise.all(
    candidates.map(async (contract) => {
      const successorContracts = await loadSuccessorContracts(contract)

      return {
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        status: contract.status,
        isExtended: contract.isExtended,
        businessStatus: contract.businessStatus,
        renterName: contract.renter.name,
        renterPhone: contract.renter.phone,
        roomInfo: `${contract.room.building.name} - ${contract.room.roomNumber}`,
        startDate: formatDateKey(contract.startDate),
        endDate: formatDateKey(contract.endDate),
        createdAt: contract.createdAt.toISOString(),
        updatedAt: contract.updatedAt.toISOString(),
        remarks: contract.remarks,
        hasRenewalRemarkEvidence: hasRenewalRemarkEvidence(contract.remarks),
        successorContracts: successorContracts.map((candidate) => ({
          contractId: candidate.id,
          contractNumber: candidate.contractNumber,
          status: candidate.status,
          startDate: formatDateKey(candidate.startDate),
          endDate: formatDateKey(candidate.endDate),
          createdAt: candidate.createdAt.toISOString(),
        })),
      } satisfies ExtendedExpiredContractAuditResult
    })
  )

  return {
    totalMatchedContracts: results.length,
    contractsWithRenewalRemarkEvidence: results.filter(
      (result) => result.hasRenewalRemarkEvidence
    ).length,
    contractsWithSuccessorCandidates: results.filter(
      (result) => result.successorContracts.length > 0
    ).length,
    results,
  }
}
