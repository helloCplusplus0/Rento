export type DomainCompatStrategy =
  | 'compat-wrapper'
  | 'thin-forwarder'
  | 'read-only-reference'

export interface DomainCompatBoundary {
  strategy: DomainCompatStrategy
  reason: string
  exitCondition: string
}

export interface DomainTransactionBoundary {
  owner: 'src/lib/domain/*'
  client: 'Prisma'
  isolationLevel: 'Serializable'
  retryCode: 'P2034'
  retryPolicy: 'bounded-retry-with-backoff'
  note: string
}

/**
 * Prisma 官方事务文档建议：并发敏感写路径可优先使用 Serializable，
 * 并对 P2034 写冲突/死锁结果执行有限重试。
 * phase09-01 先把这条规则冻结为共享领域服务默认候选，后续子任务再按模块落地实现。
 */
export const PRISMA_CONCURRENT_WRITE_TRANSACTION_CANDIDATE: DomainTransactionBoundary =
  {
    owner: 'src/lib/domain/*',
    client: 'Prisma',
    isolationLevel: 'Serializable',
    retryCode: 'P2034',
    retryPolicy: 'bounded-retry-with-backoff',
    note:
      '并发敏感写路径默认由共享领域服务声明 Prisma 事务边界，优先采用 Serializable，并在遇到 P2034 时执行有限重试。',
  }

export interface DomainModuleBoundary {
  name: 'contracts' | 'billing' | 'meters' | 'delete-guards'
  description: string
  compatBoundary: DomainCompatBoundary
  transactionBoundary: DomainTransactionBoundary
}

export function defineDomainModuleBoundary(
  boundary: DomainModuleBoundary
): DomainModuleBoundary {
  return boundary
}
