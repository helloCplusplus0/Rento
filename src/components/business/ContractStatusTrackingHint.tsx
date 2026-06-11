import type { ContractStatusTrackingHint as ContractStatusTrackingHintViewModel } from '@/lib/contract-alert-semantics'
import { cn } from '@/lib/utils'

interface ContractStatusTrackingHintProps {
  hint: ContractStatusTrackingHintViewModel
  inverted?: boolean
  className?: string
}

const defaultToneClassNames = {
  warning: 'border-orange-200 bg-orange-50 text-orange-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
} as const

const invertedToneClassNames = {
  warning: 'border-white/20 bg-white/15 text-white',
  danger: 'border-white/20 bg-white/15 text-white',
} as const

export function ContractStatusTrackingHint({
  hint,
  inverted = false,
  className,
}: ContractStatusTrackingHintProps) {
  const toneClassNames = inverted
    ? invertedToneClassNames[hint.tone]
    : defaultToneClassNames[hint.tone]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap',
        toneClassNames,
        className
      )}
    >
      {hint.text}
    </span>
  )
}
