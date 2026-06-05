import {
  defineDomainModuleBoundary,
  PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
} from '../shared'

/**
 * Contract 仍是主链事实锚点。
 * phase09-01 先冻结共享领域承接位，具体写入逻辑后续再从旧宿主迁入。
 */
export const contractsDomainBoundary = defineDomainModuleBoundary({
  name: 'contracts',
  description: '承接合同生命周期、续租、退租前置校验与房态联动语义。',
  compatBoundary: {
    strategy: 'compat-wrapper',
    reason:
      'phase09-01 仅冻结新宿主与共享领域承接位，旧 src/app/api/contracts/* 仍需承接存量请求与迁移对照。',
    exitCondition:
      '当合同相关正式入口已迁入 server/routes/*，并由 src/lib/domain/contracts 承接事务边界且通过主链 smoke 后，旧入口降级为薄包装或移除。',
  },
  transactionBoundary: {
    ...PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
    note:
      '合同创建、续租、退租等跨聚合写操作的事务编排统一下沉到 src/lib/domain/contracts，而不是散落在路由层。',
  },
})
