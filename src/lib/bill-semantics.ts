/**
 * 兼容包装层：
 * phase09-03 起账务金额/状态/展示语义的正式真相源迁入 src/lib/domain/billing。
 * 旧文件继续导出同名能力，避免存量页面与查询层在当前阶段被一次性切断。
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
  resolveBillAmounts,
  resolveBillStatus,
  sortBillsForDisplay,
  toBillAmount,
} from '@/lib/domain/billing'

export type {
  BillDisplaySortableLike,
  BillPresentationLike,
  BillPresentationStats,
  BillPresentationStatus,
} from '@/lib/domain/billing'
