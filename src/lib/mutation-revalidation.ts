import { revalidatePath } from 'next/cache'

import { ErrorLogger, ErrorSeverity, ErrorType } from './error-logger'

type RevalidateTarget = {
  path: string
  type?: 'page' | 'layout'
}

type MutationScope =
  | 'dashboard'
  | 'contracts'
  | 'bills'
  | 'rooms'
  | 'renters'
  | 'meters'
  | 'settings'

const SCOPE_TARGETS: Record<MutationScope, RevalidateTarget[]> = {
  dashboard: [{ path: '/' }],
  contracts: [
    { path: '/contracts' },
    { path: '/contracts/[id]', type: 'page' },
    { path: '/contracts/new' },
  ],
  bills: [
    { path: '/bills' },
    { path: '/bills/[id]', type: 'page' },
    { path: '/bills/stats' },
    { path: '/bills/create' },
  ],
  rooms: [
    { path: '/rooms' },
    { path: '/rooms/[id]', type: 'page' },
  ],
  renters: [
    { path: '/renters' },
    { path: '/renters/[id]', type: 'page' },
    { path: '/renters/new' },
  ],
  meters: [
    { path: '/meter-readings/history' },
    { path: '/meter-readings/batch' },
  ],
  settings: [
    { path: '/settings' },
    { path: '/contracts/new' },
    { path: '/meter-readings/batch' },
  ],
}

interface RevalidateMutationPathsOptions {
  scopes: MutationScope[]
  detailPaths?: Array<string | undefined | null>
  extraTargets?: RevalidateTarget[]
}

function dedupeTargets(targets: RevalidateTarget[]): RevalidateTarget[] {
  const seen = new Set<string>()
  const uniqueTargets: RevalidateTarget[] = []

  for (const target of targets) {
    const normalizedPath = target.path.trim()
    if (!normalizedPath) {
      continue
    }

    const key = `${target.type ?? 'literal'}:${normalizedPath}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    uniqueTargets.push({
      path: normalizedPath,
      type: target.type,
    })
  }

  return uniqueTargets
}

/**
 * 统一收口写操作后的 App Router 路径失效。
 * Route Handler 中采用 best-effort 模式，避免缓存刷新异常覆盖真实写入结果。
 */
export async function revalidateMutationPaths({
  scopes,
  detailPaths = [],
  extraTargets = [],
}: RevalidateMutationPathsOptions): Promise<void> {
  const logger = ErrorLogger.getInstance()
  const scopeTargets = scopes.flatMap((scope) => SCOPE_TARGETS[scope] ?? [])
  const detailTargets = detailPaths
    .filter((path): path is string => Boolean(path))
    .map((path) => ({ path }))
  const targets = dedupeTargets([
    ...scopeTargets,
    ...detailTargets,
    ...extraTargets,
  ])

  try {
    for (const target of targets) {
      revalidatePath(target.path, target.type)
    }

    logger.logInfo('Mutation paths revalidated', {
      module: 'mutation-revalidation',
      scopes,
      targets,
    })
  } catch (error) {
    await logger.logError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.MEDIUM,
      'Failed to revalidate mutation paths',
      {
        module: 'mutation-revalidation',
        scopes,
        targets,
      },
      error instanceof Error ? error : undefined
    )
  }
}
