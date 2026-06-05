import {
  billingDomainBoundary,
  contractsDomainBoundary,
  deleteGuardsDomainBoundary,
  metersDomainBoundary,
} from '@/lib/domain'

import type { MinixServerEnv } from '../lib/env'

import { createDomainRouteSkeleton } from './domain-skeleton'

export function createCheckoutRoutes(env: MinixServerEnv) {
  return createDomainRouteSkeleton(env, {
    routeKey: 'checkout',
    legacyCompat: {
      currentState: 'legacy-source-of-truth',
      targetStrategy: 'compat-wrapper',
      legacyPaths: ['src/app/api/contracts/[id]/checkout/route.ts'],
      reason:
        '退租结算当前仍由旧宿主承担真实业务链路，phase09-01 先冻结新宿主骨架并保留对照基线。',
      exitCondition:
        '当 checkout 正式入口迁入 server/routes/*，并由共享领域服务承接跨合同、账单、抄表事务后，旧 checkout 入口退化为 compat wrapper 或移除。',
    },
    modules: [
      contractsDomainBoundary,
      billingDomainBoundary,
      metersDomainBoundary,
      deleteGuardsDomainBoundary,
    ],
  })
}
