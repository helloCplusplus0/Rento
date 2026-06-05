export { billingDomainBoundary } from './billing'
export { contractsDomainBoundary } from './contracts'
export { deleteGuardsDomainBoundary } from './delete-guards'
export { metersDomainBoundary } from './meters'
export type { DomainModuleBoundary } from './shared'

import { billingDomainBoundary } from './billing'
import { contractsDomainBoundary } from './contracts'
import { deleteGuardsDomainBoundary } from './delete-guards'
import { metersDomainBoundary } from './meters'

/**
 * 共享领域骨架只冻结目录、命名与职责边界。
 * phase09-01 不在这里迁入具体业务实现，后续子任务再围绕这些承接位逐步落地。
 */
export const phase09DomainModuleBoundaries = [
  contractsDomainBoundary,
  billingDomainBoundary,
  metersDomainBoundary,
  deleteGuardsDomainBoundary,
] as const
