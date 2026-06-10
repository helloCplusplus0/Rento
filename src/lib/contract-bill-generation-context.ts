/**
 * 合同基础账单生成上下文。
 * - NEW_SIGN: 首次新增合同，允许自动生成押金 / 钥匙押金 / 卫生费 / 租金
 * - RENEWAL: 续租合同，只允许自动生成卫生费 / 租金
 */
export const CONTRACT_BILL_GENERATION_CONTEXTS = ['NEW_SIGN', 'RENEWAL'] as const

export type ContractBillGenerationContext =
  (typeof CONTRACT_BILL_GENERATION_CONTEXTS)[number]

export interface ContractBillGenerationRule {
  includeDepositBill: boolean
  includeKeyDepositBill: boolean
  includeCleaningFeeBill: boolean
  includeRentBill: boolean
}

export interface ContractBillGenerationContextLike {
  remarks?: string | null
}

export const RENEWAL_REMARK_MARKER = '续租自合同'
const RENEWAL_REMARK_PREFIX_PATTERN = /^续租自合同[^\n。]*(?:。)?/

function normalizeRemarkInput(remarks: string | null | undefined): string {
  return typeof remarks === 'string' ? remarks.trim() : ''
}

function extractRenewalRemarkPrefix(
  remarks: string | null | undefined
): string | null {
  const normalizedRemarks = normalizeRemarkInput(remarks)

  if (!normalizedRemarks.startsWith(RENEWAL_REMARK_MARKER)) {
    return null
  }

  const matchedPrefix = normalizedRemarks.match(RENEWAL_REMARK_PREFIX_PATTERN)?.[0]

  if (!matchedPrefix) {
    return normalizedRemarks
  }

  return matchedPrefix.endsWith('。')
    ? matchedPrefix.slice(0, -1)
    : matchedPrefix
}

export function resolveContractBillGenerationContext(
  contract: ContractBillGenerationContextLike
): ContractBillGenerationContext {
  return isRenewalContractContext(contract) ? 'RENEWAL' : 'NEW_SIGN'
}

export function isRenewalContractContext(
  contract: ContractBillGenerationContextLike
): boolean {
  return typeof contract.remarks === 'string'
    ? contract.remarks.includes(RENEWAL_REMARK_MARKER)
    : false
}

export function getContractBillGenerationRule(
  context: ContractBillGenerationContext
): ContractBillGenerationRule {
  if (context === 'RENEWAL') {
    return {
      includeDepositBill: false,
      includeKeyDepositBill: false,
      includeCleaningFeeBill: true,
      includeRentBill: true,
    }
  }

  return {
    includeDepositBill: true,
    includeKeyDepositBill: true,
    includeCleaningFeeBill: true,
    includeRentBill: true,
  }
}

/**
 * 续租合同允许编辑备注，但必须保留“续租自合同xxx”的来源标记，
 * 否则后续手工“生成账单”会把该合同误识别回 NEW_SIGN。
 */
export function preserveRenewalRemarkMarker(
  existingRemarks: string | null | undefined,
  nextRemarks: string | null | undefined
): string | null {
  const renewalRemarkPrefix = extractRenewalRemarkPrefix(existingRemarks)
  if (!renewalRemarkPrefix) {
    return nextRemarks ?? null
  }

  const normalizedNextRemarks = normalizeRemarkInput(nextRemarks)
  if (!normalizedNextRemarks) {
    return renewalRemarkPrefix
  }

  const nextRemarkWithoutPrefix = normalizedNextRemarks
    .replace(RENEWAL_REMARK_PREFIX_PATTERN, '')
    .replace(/^[\s。]+/, '')

  return nextRemarkWithoutPrefix
    ? `${renewalRemarkPrefix}。${nextRemarkWithoutPrefix}`
    : renewalRemarkPrefix
}
