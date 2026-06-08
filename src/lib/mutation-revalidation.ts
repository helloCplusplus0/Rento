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

export type MutationRevalidationRuntime =
  | 'next-route-handler'
  | 'hono-runtime'

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
  executionRuntime?: MutationRevalidationRuntime
  runtimeName?: string
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
 * 统一收口写操作后的路径鲜度处理。
 * 当前运行拓扑同时存在：
 * 1. 仍可直接调用 Next Route Handler 的 legacy/compat 路径
 * 2. 已承接正式职责的独立 Hono runtime
 *
 * 因此这里不能再默认假设所有调用都运行在 Next App Router 上下文里。
 * 对独立 Hono runtime，只记录目标路径并跳过 `next/cache`，由调用方自行负责
 * 该 runtime 下可生效的鲜度策略（例如域缓存失效、直接读正式宿主等）。
 */
export async function revalidateMutationPaths({
  scopes,
  detailPaths = [],
  extraTargets = [],
  executionRuntime = 'next-route-handler',
  runtimeName,
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

  if (executionRuntime === 'hono-runtime') {
    logger.logInfo('Mutation paths marked stale for standalone Hono runtime', {
      module: 'mutation-revalidation',
      scopes,
      targets,
      executionRuntime,
      runtimeName,
      strategy:
        'skip-next-cache-revalidate-and-delegate-to-runtime-specific-freshness',
    })
    return
  }

  try {
    const { revalidatePath } = await import('next/cache')

    for (const target of targets) {
      revalidatePath(target.path, target.type)
    }

    logger.logInfo('Mutation paths revalidated through Next App Router', {
      module: 'mutation-revalidation',
      scopes,
      targets,
      executionRuntime,
      runtimeName,
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
        executionRuntime,
        runtimeName,
      },
      error instanceof Error ? error : undefined
    )
  }
}
