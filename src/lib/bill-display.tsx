import {
  Droplets,
  FileText,
  Home,
  Key,
  ReceiptText,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

type BillDisplayLike = {
  type: string
  itemLabel?: string | null
  remarks?: string | null
}

interface BillVisualConfig {
  icon: LucideIcon
  containerClassName: string
  iconClassName: string
  amountClassName: string
}

export interface ResolvedOtherBillItemLabel {
  itemLabel: string | null
  source: 'structured' | 'legacy-safe' | 'remarks-summary' | 'none'
}

const BILL_TYPE_LABELS = {
  RENT: '租金',
  DEPOSIT: '押金',
  UTILITIES: '水电费',
  OTHER: '其他',
} as const

const GENERIC_OTHER_LABELS = new Set([
  '其他',
  '其他费用',
  '账单',
  '费用',
  '合同',
  '手动创建',
  '自动生成',
  'system',
  '待确定',
])

function normalizeText(value?: string | null): string {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

function extractRemarkSummary(remarks?: string | null): string | null {
  const normalizedRemarks = normalizeText(remarks)
  if (!normalizedRemarks) {
    return null
  }

  const firstSentence = normalizedRemarks.split(/[，。；\n]/)[0]?.trim() ?? ''
  const candidate = firstSentence
    .split(/\s*-\s*/)
    .map((segment) => segment.trim())
    .find(Boolean)

  if (!candidate) {
    return null
  }

  const sanitizedCandidate = candidate.replace(/账单$/u, '').trim()
  if (
    !sanitizedCandidate ||
    sanitizedCandidate.length > 16 ||
    GENERIC_OTHER_LABELS.has(sanitizedCandidate.toLowerCase())
  ) {
    return null
  }

  return sanitizedCandidate
}

export function resolveOtherBillItemLabel(
  bill: Pick<BillDisplayLike, 'itemLabel' | 'remarks'>
): ResolvedOtherBillItemLabel {
  const structuredItemLabel = normalizeText(bill.itemLabel)
  if (structuredItemLabel) {
    return {
      itemLabel: structuredItemLabel,
      source: 'structured',
    }
  }

  const normalizedRemarks = normalizeText(bill.remarks)
  if (!normalizedRemarks) {
    return {
      itemLabel: null,
      source: 'none',
    }
  }

  if (/钥匙.*押金|门卡.*押金/u.test(normalizedRemarks)) {
    return {
      itemLabel: '钥匙押金',
      source: 'legacy-safe',
    }
  }

  if (/清洁费|卫生费/u.test(normalizedRemarks)) {
    return {
      itemLabel: '卫生费',
      source: 'legacy-safe',
    }
  }

  const remarkSummary = extractRemarkSummary(normalizedRemarks)
  if (remarkSummary) {
    return {
      itemLabel: remarkSummary,
      source: 'remarks-summary',
    }
  }

  return {
    itemLabel: null,
    source: 'none',
  }
}

export function getBillBaseTypeLabel(type: string): string {
  return BILL_TYPE_LABELS[type as keyof typeof BILL_TYPE_LABELS] ?? type
}

export function getBillDisplayParts(bill: BillDisplayLike): {
  primaryLabel: string
  secondaryLabel: string | null
} {
  const primaryLabel = getBillBaseTypeLabel(bill.type)
  if (bill.type !== 'OTHER') {
    return {
      primaryLabel,
      secondaryLabel: null,
    }
  }

  const resolvedOtherItem = resolveOtherBillItemLabel(bill)
  return {
    primaryLabel,
    secondaryLabel: resolvedOtherItem.itemLabel,
  }
}

export function getBillDisplayLabel(bill: BillDisplayLike): string {
  const { primaryLabel, secondaryLabel } = getBillDisplayParts(bill)
  return secondaryLabel ? `${primaryLabel}-${secondaryLabel}` : primaryLabel
}

export function getBillVisualConfig(bill: BillDisplayLike): BillVisualConfig {
  if (bill.type === 'RENT') {
    return {
      icon: Home,
      containerClassName: 'bg-blue-50',
      iconClassName: 'bg-blue-100 text-blue-700',
      amountClassName: 'text-blue-700',
    }
  }

  if (bill.type === 'DEPOSIT') {
    return {
      icon: ReceiptText,
      containerClassName: 'bg-violet-50',
      iconClassName: 'bg-violet-100 text-violet-700',
      amountClassName: 'text-violet-700',
    }
  }

  if (bill.type === 'UTILITIES') {
    return {
      icon: Droplets,
      containerClassName: 'bg-cyan-50',
      iconClassName: 'bg-cyan-100 text-cyan-700',
      amountClassName: 'text-cyan-700',
    }
  }

  const resolvedOtherItem = resolveOtherBillItemLabel(bill).itemLabel
  if (resolvedOtherItem === '钥匙押金') {
    return {
      icon: Key,
      containerClassName: 'bg-amber-50',
      iconClassName: 'bg-amber-100 text-amber-700',
      amountClassName: 'text-amber-700',
    }
  }

  if (resolvedOtherItem === '卫生费') {
    return {
      icon: Sparkles,
      containerClassName: 'bg-emerald-50',
      iconClassName: 'bg-emerald-100 text-emerald-700',
      amountClassName: 'text-emerald-700',
    }
  }

  return {
    icon: FileText,
    containerClassName: 'bg-amber-50',
    iconClassName: 'bg-amber-100 text-amber-700',
    amountClassName: 'text-amber-700',
  }
}
