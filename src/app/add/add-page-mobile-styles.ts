import { contractListMobileStyles } from '@/components/business/contract-list-mobile-styles'

export const addPageMobileStyles = {
  pageSection: contractListMobileStyles.pageSection,
  introCard: contractListMobileStyles.toolbarCard,
  introTitle: 'text-sm font-medium leading-5 text-gray-900',
  introText: 'text-sm leading-5 text-gray-600',
  grid: 'grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3',
  card: contractListMobileStyles.card,
  cardContent: 'p-3 sm:p-4',
  cardHeader: 'flex items-start justify-between gap-2',
  cardLeading: 'flex min-w-0 flex-1 items-start gap-2.5',
  iconBox:
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10',
  title: contractListMobileStyles.cardTitle,
  description: 'mt-0.5 text-sm leading-5 text-gray-600',
  footer: contractListMobileStyles.footer,
  footerRow: contractListMobileStyles.footerRow,
  footerHint: 'text-[11px] font-medium leading-4 text-gray-500',
} as const
