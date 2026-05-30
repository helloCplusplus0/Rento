import { contractListMobileStyles } from '@/components/business/contract-list-mobile-styles'

export const dashboardMobileStyles = {
  pageSection: contractListMobileStyles.pageSection,
  workbenchHero:
    'rounded-xl bg-gradient-to-br from-slate-700 via-slate-700 to-slate-800 px-3 py-3 text-white shadow-sm sm:px-4 sm:py-4',
  workbenchTopBar: 'flex items-center gap-2.5',
  workbenchAvatarButton:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus:ring-2 focus:ring-white/60 focus:outline-none sm:h-11 sm:w-11',
  quickSearchRow: 'flex items-center gap-2',
  searchWrap: 'relative flex-1',
  searchIcon:
    'absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400',
  searchInput:
    'h-10 w-full rounded-xl border-white/15 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-sm placeholder:text-gray-400 focus:border-white/30 focus:bg-white sm:h-11 sm:text-base sm:placeholder:text-base',
  searchButton:
    'h-10 w-10 shrink-0 rounded-xl bg-white text-slate-700 hover:bg-white/95 sm:h-11 sm:w-11',
  searchSubmitIcon:
    'absolute top-1/2 right-1.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none sm:right-2',
  section: 'space-y-2.5 sm:space-y-3',
  sectionHeader: 'flex items-center justify-between gap-3',
  sectionTitleWrap: 'min-w-0',
  sectionTitle: 'text-base font-semibold text-gray-900 sm:text-lg',
  sectionSubtle: 'text-xs text-gray-500',
  sectionMetaRow:
    'flex min-w-0 items-center gap-2 text-xs text-gray-500 whitespace-nowrap',
  sectionActions: 'flex shrink-0 items-center gap-2',
  sectionRefreshButton: 'h-8 px-3 text-sm',
  statsGrid: 'grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:gap-4',
  statsCard:
    'gap-0 overflow-hidden rounded-lg border border-gray-100 py-0 shadow-sm transition-shadow hover:shadow-md',
  statsHeader:
    'flex flex-row items-center justify-between gap-2 px-3 pt-3 pb-1.5 sm:px-4 sm:pt-4 sm:pb-2',
  statsTitle: 'truncate text-xs font-medium text-gray-600 sm:text-sm',
  statsIconBox:
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg p-1.5 sm:h-8 sm:w-8 sm:p-2',
  statsContent: 'px-3 pb-3 sm:px-4 sm:pb-4',
  statsValue: 'text-lg font-bold text-gray-900 sm:text-2xl',
  statsSubtitle: 'mt-0.5 text-xs leading-4 text-gray-500 sm:text-sm sm:leading-5',
  statsTrend: 'mt-1 flex items-center text-xs',
  shortcutCard:
    'gap-0 overflow-hidden rounded-lg border border-gray-100 py-0 shadow-sm',
  shortcutHeader: 'px-3 pt-3 pb-0 sm:px-4 sm:pt-4',
  shortcutTitle: 'text-base font-semibold text-gray-900 sm:text-lg',
  shortcutContent: 'px-3 pt-2.5 pb-3 sm:px-4 sm:pt-3 sm:pb-4',
  shortcutGrid: 'grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-5 sm:gap-x-3 sm:gap-y-4 lg:grid-cols-6',
  shortcutButton:
    'group flex h-full w-full flex-col items-center justify-start rounded-xl p-1.5 text-center transition-transform hover:scale-[1.01] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none active:scale-[0.99]',
  shortcutIconBox:
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:-translate-y-0.5 sm:h-12 sm:w-12',
  shortcutTitleText: 'mt-2 text-xs font-medium leading-4 text-gray-900 sm:text-sm',
  shortcutDescription: 'hidden',
  shortcutArrow: 'hidden',
  alertsCard:
    'gap-0 overflow-hidden rounded-lg border border-gray-100 py-0 shadow-sm',
  alertsHeader: 'px-3 pt-3 pb-0 sm:px-4 sm:pt-4',
  alertsTitleRow: 'flex items-center gap-2',
  alertsTitle: 'text-base font-semibold text-gray-900 sm:text-lg',
  alertsTitleDot: 'h-2 w-2 rounded-full bg-orange-500',
  alertsContent: 'px-3 pt-2.5 pb-3 sm:px-4 sm:pt-3 sm:pb-4',
  alertsGrid: 'grid grid-cols-4 gap-x-2 gap-y-3 sm:gap-x-3 sm:gap-y-4',
  alertButton:
    'group flex flex-col items-center rounded-xl p-1 text-center transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
  alertButtonActive: 'bg-blue-50',
  alertCountPanel:
    'mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 shadow-sm transition-transform group-hover:-translate-y-0.5 sm:h-12 sm:w-12',
  alertCountBox:
    'flex min-w-0 items-center justify-center text-lg font-semibold text-slate-700 sm:text-xl',
  alertLabel: 'mt-2 line-clamp-2 text-[11px] leading-4 text-gray-600 sm:text-xs',
  alertDetailsSection: 'mt-3 border-t border-gray-100 pt-3',
  alertDetailsHeader: 'mb-3 flex items-start justify-between gap-3',
  alertDetailsTitle: 'flex min-w-0 items-center gap-2 text-sm font-medium text-gray-700',
  alertDetailsList: 'max-h-64 space-y-2.5 overflow-y-auto',
  alertDetailsCard:
    'gap-0 overflow-hidden rounded-lg border py-0 shadow-sm transition-all hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
  alertDetailsContent: 'p-2.5 sm:p-3',
  alertDetailsTop: 'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between',
  alertDetailsMain: 'min-w-0 flex-1',
  alertDetailsCardTitle: 'truncate text-sm font-semibold leading-5 text-gray-900',
  alertDetailsCardText: 'mt-0.5 break-words text-xs leading-4 text-gray-600',
  alertDetailsAction: 'flex items-center gap-1 text-[11px] font-medium leading-4 text-gray-400',
  alertEmpty: 'py-4 text-center text-sm text-gray-500',
} as const
