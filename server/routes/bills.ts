import { billingDomainBoundary } from '@/lib/domain'

import type { MinixServerEnv } from '../lib/env'

import { createDomainRouteSkeleton } from './domain-skeleton'

export function createBillRoutes(env: MinixServerEnv) {
  return createDomainRouteSkeleton(env, {
    routeKey: 'bills',
    legacyCompat: {
      currentState: 'legacy-source-of-truth',
      targetStrategy: 'compat-wrapper',
      legacyPaths: [
        'src/app/api/bills/route.ts',
        'src/app/api/bills/stats/route.ts',
        'src/app/api/bills/repair-details/route.ts',
        'src/app/api/bills/[id]/route.ts',
        'src/app/api/bills/[id]/status/route.ts',
        'src/app/api/bills/[id]/details/route.ts',
        'src/app/api/bills/[id]/utility-details/route.ts',
        'src/app/api/contracts/[id]/generate-bills/route.ts',
      ],
      reason:
        '账务旧入口仍承担存量账单语义和回滚参考职责，phase09-01 不在此阶段迁移正式业务逻辑。',
      exitCondition:
        '当账单生成、状态回写与金额语义已由 server/routes/* + src/lib/domain/billing 承接并完成验证后，旧账务入口退化为 compat wrapper 或只读参考。',
    },
    modules: [billingDomainBoundary],
  })
}
