/**
 * 兼容包装层：
 * fix_014 起仅保留纯 shared 账单展示语义，阻断浏览器运行时穿透到 server-only 的
 * src/lib/domain/billing；服务端若需要正式账务真相，应直接依赖 domain/billing。
 */
export {
  BILL_AMOUNT_EPSILON,
  OPEN_BILL_STATUSES,
  SETTLED_BILL_STATUSES,
  buildBillPresentationStats,
  compareBillsForDisplay,
  createBillPresentationStats,
  createBillStatusCountMap,
  getBillPresentationStatus,
  getBillPresentationStatusLabel,
  isBillSettled,
  isOpenBillStatus,
  isSettledBillStatus,
  resolveBillStatus,
  sortBillsForDisplay,
  toBillAmount,
} from '@/lib/bill-semantics.shared'

export type {
  BillDisplaySortableLike,
  BillPresentationLike,
  BillPresentationStats,
  BillPresentationStatus,
  SharedBillStatus,
} from '@/lib/bill-semantics.shared'
