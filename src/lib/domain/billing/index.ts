import {
  defineDomainModuleBoundary,
  PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
} from '../shared'

/**
 * 账务语义需要围绕合同锚点保持稳定。
 * phase09-01 仅声明共享承接位，不复制旧实现中的账单生成逻辑。
 */
export const billingDomainBoundary = defineDomainModuleBoundary({
  name: 'billing',
  description: '承接账单金额、状态、支付周期与自动出账语义。',
  compatBoundary: {
    strategy: 'compat-wrapper',
    reason:
      '账务旧入口仍承担存量业务请求与对照基线职责，phase09-01 不在旧宿主继续新增账务真相。',
    exitCondition:
      '当账单生成、状态回写与支付周期接口已迁入 server/routes/*，并由 src/lib/domain/billing 承接写事务后，旧入口退化为薄包装或只读参考。',
  },
  transactionBoundary: {
    ...PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
    note:
      '账单生成、收款状态回写与明细聚合的事务边界统一收口到 src/lib/domain/billing。',
  },
})
