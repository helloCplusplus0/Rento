export const renewContractMobileStyles = {
  pageSection: 'mx-auto max-w-4xl space-y-2.5 pb-2.5 sm:space-y-6 sm:pb-6',
  card: 'rounded-lg border border-gray-100 shadow-sm',
  cardHeader: 'gap-1 px-3 pb-0 sm:gap-1.5 sm:px-6',
  cardTitle: 'flex items-center gap-2 text-base sm:text-lg',
  cardDescription: 'text-[11px] leading-4 text-gray-500 sm:text-sm sm:leading-5',
  cardContent: 'space-y-3 px-3 pt-0 pb-3 sm:space-y-4 sm:px-6 sm:pb-6',
  summaryGrid:
    'grid grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-4 sm:gap-y-3 md:grid-cols-2 lg:grid-cols-3',
  summaryWideField: 'col-span-2 lg:col-span-1',
  fieldBlock: 'grid content-start gap-0.5 sm:gap-1',
  fieldLabel: 'text-[11px] font-medium leading-4 text-gray-500 sm:text-sm sm:leading-5',
  fieldValue: 'text-sm font-medium leading-5 text-gray-900 sm:leading-6',
  fieldValueMono:
    'break-all font-mono text-sm font-medium leading-5 text-gray-900 sm:break-normal sm:leading-6',
  fieldValueAccent: 'text-sm font-medium leading-5 text-green-600 sm:leading-6',
  statusBadgeWrapper: 'mt-0.5',
  noteSection: 'mt-3 border-t pt-3 sm:mt-4 sm:pt-4',
  noteBox: 'rounded-lg border bg-gray-50 p-2.5 sm:p-3',
  noteText: 'text-sm leading-5 whitespace-pre-wrap text-gray-700 sm:leading-6',
  formStack: 'space-y-4 sm:space-y-6',
  formSection: 'space-y-3 sm:space-y-4',
  sectionTitle: 'text-sm font-medium leading-5 text-gray-900',
  formGrid: 'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4',
  formLabel: 'flex items-center gap-2 text-sm leading-none font-medium',
  input: 'mt-1 h-10 text-sm sm:h-11 sm:text-base',
  textarea: 'mt-1 min-h-[104px] text-sm sm:text-base',
  helperText:
    'mt-1 text-[11px] leading-4 text-gray-500 sm:text-xs sm:leading-5',
  select:
    'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:text-base',
  separator: 'my-0',
  actionsCard:
    'page-safe-bottom rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none',
  actionsRow: 'flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3',
  actionButton: 'h-10 w-full text-sm sm:h-9 sm:w-auto',
} as const
