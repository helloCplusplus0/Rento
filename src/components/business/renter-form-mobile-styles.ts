import { contractDetailMobileStyles } from '@/components/business/contract-detail-mobile-styles'
import { contractListMobileStyles } from '@/components/business/contract-list-mobile-styles'
import { renterDetailMobileStyles } from '@/components/business/renter-detail-mobile-styles'

export const renterFormMobileStyles = {
  pageSection: contractListMobileStyles.pageSection,
  card: renterDetailMobileStyles.card,
  cardHeader: renterDetailMobileStyles.cardHeader,
  cardTitle: renterDetailMobileStyles.cardTitle,
  cardDescription: 'text-sm leading-5 text-gray-500',
  cardContent: renterDetailMobileStyles.cardContent,
  fieldsGrid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4',
  fieldStack: 'space-y-1.5',
  sectionBlock: renterDetailMobileStyles.sectionBlock,
  sectionTitle: renterDetailMobileStyles.sectionTitle,
  input: 'h-10 text-sm placeholder:text-sm sm:h-11 sm:text-base sm:placeholder:text-base',
  select:
    'h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:h-11 sm:text-base',
  textarea:
    'min-h-[88px] text-sm placeholder:text-sm sm:min-h-[104px] sm:text-base sm:placeholder:text-base',
  actionsRow: contractDetailMobileStyles.actionsGrid,
  actionButton: 'h-10 w-full text-sm sm:h-10 sm:text-sm',
} as const
