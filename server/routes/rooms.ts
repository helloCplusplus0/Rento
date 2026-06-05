import {
  contractsDomainBoundary,
  deleteGuardsDomainBoundary,
  metersDomainBoundary,
} from '@/lib/domain'

import type { MinixServerEnv } from '../lib/env'

import { createDomainRouteSkeleton } from './domain-skeleton'

export function createRoomRoutes(env: MinixServerEnv) {
  return createDomainRouteSkeleton(env, {
    routeKey: 'rooms',
    legacyCompat: {
      currentState: 'legacy-source-of-truth',
      targetStrategy: 'read-only-reference',
      legacyPaths: [
        'src/app/api/rooms/route.ts',
        'src/app/api/rooms/batch/route.ts',
        'src/app/api/rooms/[id]/route.ts',
        'src/app/api/rooms/[id]/status/route.ts',
        'src/app/api/rooms/[id]/meters/route.ts',
      ],
      reason:
        '房间入口与删除门禁、合同锚点、仪表解绑强耦合，phase09-01 先保留旧实现作为高风险路径参考。',
      exitCondition:
        '当房间状态切换、删除门禁与仪表解绑均迁入共享领域服务，并完成至少一条主链验证后，旧 rooms 入口退化为只读参考或移除。',
    },
    modules: [
      deleteGuardsDomainBoundary,
      contractsDomainBoundary,
      metersDomainBoundary,
    ],
  })
}
