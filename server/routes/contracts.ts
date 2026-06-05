import {
  contractsDomainBoundary,
  deleteGuardsDomainBoundary,
} from '@/lib/domain'

import type { MinixServerEnv } from '../lib/env'

import { createDomainRouteSkeleton } from './domain-skeleton'

export function createContractRoutes(env: MinixServerEnv) {
  return createDomainRouteSkeleton(env, {
    routeKey: 'contracts',
    legacyCompat: {
      currentState: 'legacy-source-of-truth',
      targetStrategy: 'compat-wrapper',
      legacyPaths: [
        'src/app/api/contracts/route.ts',
        'src/app/api/contracts/activate/route.ts',
        'src/app/api/contracts/[id]/route.ts',
        'src/app/api/contracts/[id]/renew/route.ts',
        'src/app/api/contracts/[id]/generate-bills/route.ts',
      ],
      reason:
        'phase09-01 只冻结正式宿主骨架，旧合同入口仍承接存量请求并作为迁移前对照基线。',
      exitCondition:
        '当合同相关 server/routes/* 入口已接入共享领域服务并通过主链 smoke 后，旧合同入口只保留 compat wrapper 或移除。',
    },
    modules: [contractsDomainBoundary, deleteGuardsDomainBoundary],
  })
}
