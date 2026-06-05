import {
  defineDomainModuleBoundary,
  PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
} from '../shared'

/**
 * 仪表与抄表主链必须保留多仪表历史语义。
 * phase09-01 只建立共享领域目录，不在此阶段迁移读写逻辑。
 */
export const metersDomainBoundary = defineDomainModuleBoundary({
  name: 'meters',
  description: '承接仪表、抄表、BillDetail 与历史追溯相关语义。',
  compatBoundary: {
    strategy: 'compat-wrapper',
    reason:
      '旧抄表与仪表入口仍承接存量主链流量，同时作为多仪表历史语义的迁移对照基线。',
    exitCondition:
      '当抄表写入、BillDetail 联动、终抄结算接口已迁入 server/routes/*，并由 src/lib/domain/meters 承接事务边界后，旧入口仅保留薄包装或只读参考。',
  },
  transactionBoundary: {
    ...PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
    note:
      '抄表写入、出账联动与退租终抄的事务编排统一放到 src/lib/domain/meters。',
  },
})
