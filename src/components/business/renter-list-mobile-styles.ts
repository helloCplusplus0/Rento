import { contractListMobileStyles } from '@/components/business/contract-list-mobile-styles'

export const renterListMobileStyles = {
  ...contractListMobileStyles,
  filterHighlightButton:
    'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800',
  filterHighlightButtonActive:
    'border-purple-600 bg-purple-600 text-white hover:bg-purple-700',
  filterHighlightCount: 'bg-purple-100 text-purple-700',
  cardAvatar:
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 sm:h-9 sm:w-9',
  cardHeaderInline: 'flex min-w-0 items-center gap-2',
  cardPhone: 'truncate text-[11px] leading-4 text-gray-500',
  cardDetailValueTight: 'max-w-[62%] text-right text-xs leading-4 text-gray-700',
} as const
