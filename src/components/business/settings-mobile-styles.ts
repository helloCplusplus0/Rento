import { billDetailMobileStyles } from '@/components/business/bill-detail-mobile-styles'
import { contractDetailMobileStyles } from '@/components/business/contract-detail-mobile-styles'
import { contractListMobileStyles } from '@/components/business/contract-list-mobile-styles'

export const settingsMobileStyles = {
  pageSection: contractListMobileStyles.pageSection,
  introBox: contractDetailMobileStyles.infoBox,
  introText: contractDetailMobileStyles.infoText,
  card: billDetailMobileStyles.card,
  cardHeader: billDetailMobileStyles.cardHeader,
  cardTitle: billDetailMobileStyles.cardTitle,
  cardContent: 'px-3 pt-0 pb-3 sm:px-6 sm:pb-6',
  itemList: 'space-y-0',
  item: 'border-b border-gray-100 py-2.5 last:border-b-0 sm:py-4',
  itemRow: 'flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between',
  itemMain: 'min-w-0 flex-1',
  itemTitle: 'text-sm font-medium leading-5 text-gray-900',
  itemDescription: 'mt-0.5 text-xs leading-4 text-gray-500 sm:text-sm sm:leading-5',
  itemControlRow:
    'flex flex-wrap items-center justify-end gap-2 self-end sm:ml-4 sm:flex-nowrap sm:self-start',
  itemValue: 'text-sm font-medium leading-5 text-gray-900',
  itemValueMuted: 'text-sm leading-5 text-gray-600',
  itemUnit: 'ml-1 text-[11px] leading-4 text-gray-500',
  inlineInput: 'h-8 w-24 text-sm sm:w-28',
  inlineSelectWrap: 'relative w-full sm:w-auto',
  inlineSelect:
    'h-9 w-full min-w-[7rem] appearance-none rounded-md border border-gray-200 bg-white pr-8 pl-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none sm:w-auto',
  inlineSelectIcon:
    'pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-gray-400',
  inlineButton: 'h-8 px-2.5 text-sm',
  switchButton:
    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
  inlineError: 'text-xs leading-4 text-red-600',
  noteStack: 'space-y-2.5 text-sm leading-6 text-gray-600',
  noteGroup: 'space-y-1',
} as const
