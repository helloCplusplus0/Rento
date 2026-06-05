import { billingDomainBoundary, metersDomainBoundary } from '@/lib/domain'

import type { MinixServerEnv } from '../lib/env'

import { createDomainRouteSkeleton } from './domain-skeleton'

export function createMeterReadingRoutes(env: MinixServerEnv) {
  return createDomainRouteSkeleton(env, {
    routeKey: 'meter-readings',
    legacyCompat: {
      currentState: 'legacy-source-of-truth',
      targetStrategy: 'compat-wrapper',
      legacyPaths: [
        'src/app/api/meter-readings/route.ts',
        'src/app/api/meter-readings/status-check/route.ts',
        'src/app/api/meter-readings/repair-status/route.ts',
        'src/app/api/meter-readings/[id]/route.ts',
        'src/app/api/meter-readings/[id]/related-bills/route.ts',
        'src/app/api/utility-readings/route.ts',
        'src/app/api/meters/[meterId]/route.ts',
        'src/app/api/meters/[meterId]/status/route.ts',
      ],
      reason:
        '旧抄表/仪表入口仍负责存量主链请求，并为多仪表历史保留语义提供迁移对照。',
      exitCondition:
        '当抄表写入、相关账单追溯和终抄路径已由 server/routes/* + src/lib/domain/meters 承接并通过验证后，旧入口退化为 compat wrapper 或只读参考。',
    },
    modules: [metersDomainBoundary, billingDomainBoundary],
  })
}
