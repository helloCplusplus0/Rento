import {
  defineDomainModuleBoundary,
  PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
} from '../shared'

/**
 * 删除门禁服务只表达“能否删、为什么不能删”的业务规则。
 * 具体的房间、合同、账单、仪表删除入口后续复用这层能力，不在 phase09-01 直接迁业务逻辑。
 */
export const deleteGuardsDomainBoundary = defineDomainModuleBoundary({
  name: 'delete-guards',
  description: '承接合同、房间、账单、仪表等高风险删除门禁语义。',
  compatBoundary: {
    strategy: 'read-only-reference',
    reason:
      'phase09-01 先冻结删除门禁共享边界，旧删除入口仍需作为高风险路径对照基线，避免提前放宽业务门禁。',
    exitCondition:
      '当房间、合同、账单、仪表删除门禁均已迁入共享领域服务，并完成至少一条主链验证后，旧删除实现退化为只读参考或移除。',
  },
  transactionBoundary: {
    ...PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE,
    note:
      '删除前校验与终止/解绑编排统一下沉到共享领域服务，避免页面、路由和数据库各自维护一套规则。',
  },
})
