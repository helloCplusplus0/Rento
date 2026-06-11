export const billDetailMobileStyles = {
  pageSection: 'space-y-2 pb-2 sm:space-y-5 sm:pb-5',
  card: 'rounded-lg border border-gray-100 shadow-sm gap-2.5 py-2.5 sm:gap-5 sm:py-5',
  cardHeader: 'gap-1 px-3 pb-0 sm:gap-1 sm:px-5',
  cardHeaderRow: 'flex items-start justify-between gap-2.5',
  cardTitle: 'text-base sm:text-lg',
  headerActionButton:
    'h-8 gap-1.5 px-3 text-sm text-gray-500 hover:text-gray-700 sm:h-8',
  cardContent: 'space-y-2.5 px-3 pt-0 pb-2.5 sm:space-y-3.5 sm:px-5 sm:pb-5',
  summaryCard:
    'rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 p-2 sm:p-3',
  summaryStatusRow: 'mb-2 flex justify-center sm:mb-2.5',
  summaryAmountBlock: 'border-y border-blue-200/50 py-1.5 text-center sm:py-2',
  summaryAmountLabel:
    'mb-0.5 text-[11px] font-medium leading-4 text-gray-600 sm:text-xs',
  summaryAmountValue:
    'mb-1 text-[28px] font-bold leading-none tracking-tight text-green-600 sm:mb-1 sm:text-[34px]',
  summaryMetaRow: 'mt-2 flex justify-center gap-4 sm:mt-2.5 sm:gap-6',
  summaryMetaBlock: 'text-center',
  summaryMetaLabel: 'text-[11px] font-medium leading-4 text-gray-500 sm:text-xs',
  summaryMetaValue: 'text-sm font-semibold leading-none sm:text-base',
  contentStack: 'space-y-2.5 sm:space-y-3.5',
  fieldsGrid: 'grid grid-cols-2 gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-2.5',
  fieldBlock: 'grid content-start gap-0.5 sm:gap-1',
  fieldWide: 'col-span-2',
  fieldLabel: 'text-[11px] font-medium leading-5 text-gray-500 sm:text-xs',
  fieldValue: 'text-sm leading-6 text-gray-900',
  fieldValueStrong: 'text-sm font-medium leading-6 text-gray-900',
  fieldValueMono: 'truncate font-mono text-sm leading-6 text-gray-900',
  fieldLink:
    'group inline-flex items-start gap-1 text-left text-sm font-medium leading-6 text-blue-600 transition-colors hover:text-blue-800',
  fieldLinkMono:
    'text-left font-mono text-sm font-medium leading-6 text-blue-600 transition-colors hover:text-blue-800',
  inlineMeta: 'text-xs leading-5 text-gray-500',
  noteBlock: 'space-y-0',
  noteText: 'rounded-md bg-gray-50 px-2.5 py-2 text-sm leading-5 text-gray-700',
  footerMetaGrid: 'grid grid-cols-2 gap-x-3 gap-y-2.5 border-t pt-2.5 sm:gap-x-4 sm:pt-3',
  warningBox: 'rounded-lg border border-red-200 bg-red-50 p-2.5 sm:p-3',
  warningText: 'text-sm font-medium leading-6 text-red-700',
  sectionBox: 'rounded-lg bg-gray-50 px-1.5 py-2.5 sm:px-3 sm:py-4',
  sectionHeader: 'mb-2.5 flex items-center justify-between gap-2',
  sectionTitle: 'text-sm font-semibold leading-6 text-gray-900',
  detailCard: 'rounded-lg border bg-white px-1.5 py-2 sm:px-2.5 sm:py-3',
  detailCardHeader:
    'mb-2 flex flex-col gap-2 sm:mb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2',
  detailCardMetaRow:
    'flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:justify-between',
  actionsCard: 'page-safe-bottom border-0 bg-transparent p-0 shadow-none',
  actionsRow: 'flex flex-row gap-2 sm:justify-end sm:gap-3',
  actionButton: 'h-9 min-w-0 flex-1 px-2.5 text-sm sm:w-auto sm:flex-none sm:px-4',
} as const
