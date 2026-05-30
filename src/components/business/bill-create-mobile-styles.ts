import { billDetailMobileStyles } from '@/components/business/bill-detail-mobile-styles'
import { contractDetailMobileStyles } from '@/components/business/contract-detail-mobile-styles'
import { contractListMobileStyles } from '@/components/business/contract-list-mobile-styles'

export const billCreateMobileStyles = {
  pageSection: billDetailMobileStyles.pageSection,
  card: billDetailMobileStyles.card,
  cardHeader: billDetailMobileStyles.cardHeader,
  cardTitle: billDetailMobileStyles.cardTitle,
  cardDescription: 'text-sm leading-5 text-gray-500',
  cardContent: billDetailMobileStyles.cardContent,
  selectorStack: 'space-y-2.5',
  searchWrap: contractListMobileStyles.searchWrap,
  searchIcon: contractListMobileStyles.searchIcon,
  searchInput: contractListMobileStyles.searchInput,
  listWrap: 'max-h-64 space-y-2 overflow-y-auto pr-0.5',
  emptyState: 'py-8 text-center text-sm text-gray-500',
  contractCard: contractListMobileStyles.card,
  contractCardSelected: 'border-blue-200 bg-blue-50',
  contractCardContent: contractListMobileStyles.cardContent,
  contractRow: 'flex items-start justify-between gap-2',
  contractLeading: 'min-w-0 flex-1',
  contractTitleRow: 'flex items-center gap-1.5',
  contractTitle: contractListMobileStyles.cardTitle,
  contractCheck: 'h-4 w-4 shrink-0 text-blue-600',
  contractMeta: 'mt-0.5 text-sm leading-5 text-gray-600',
  contractSubtle: 'mt-0.5 text-[11px] leading-4 text-gray-500',
  typeGrid: 'grid grid-cols-2 gap-2 sm:gap-2.5',
  typeButton:
    'h-auto min-h-[88px] justify-center rounded-lg border px-2 py-2.5 text-center text-sm shadow-sm sm:min-h-[84px] sm:justify-start sm:px-3 sm:py-3 sm:text-left',
  typeButtonActive: 'border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100',
  typeButtonBody:
    'flex flex-col items-center justify-center gap-1.5 sm:flex-row sm:items-center sm:justify-start sm:gap-3',
  typeButtonIcon: 'h-4 w-4 shrink-0 sm:h-5 sm:w-5',
  typeButtonTitle: 'text-sm font-medium leading-5',
  typeButtonDescription: 'hidden text-[11px] leading-4 opacity-75 sm:block',
  typeButtonText: 'text-center sm:text-left',
  form: 'space-y-4 sm:space-y-5',
  helperBox: contractDetailMobileStyles.infoBox,
  helperText: contractDetailMobileStyles.infoText,
  actionRow: 'grid grid-cols-2 gap-2.5 sm:max-w-sm',
  actionButton: 'h-10 w-full text-sm',
} as const
