export const OVERALL_HEALTH_STATUSES = [
  'healthy',
  'degraded',
  'unhealthy',
] as const

export type OverallHealthStatus = (typeof OVERALL_HEALTH_STATUSES)[number]

export const HEALTH_CHECK_SIGNALS = ['pass', 'warn', 'fail'] as const

export type HealthCheckSignal = (typeof HEALTH_CHECK_SIGNALS)[number]

export const DEFAULT_SLOW_REQUEST_THRESHOLD_MS = 2000
export const DEFAULT_MAX_PERFORMANCE_METRICS = 1000

export const OBSERVABILITY_BASELINE = {
  health: {
    primaryEndpoint: '/api/health',
    auxiliaryEndpoints: ['/api/health/system', '/api/health/bills'],
    overallStatuses: OVERALL_HEALTH_STATUSES,
    checkSignals: HEALTH_CHECK_SIGNALS,
    statusMapping: {
      pass: 'healthy',
      warn: 'degraded',
      fail: 'unhealthy',
    } satisfies Record<HealthCheckSignal, OverallHealthStatus>,
  },
  logging: {
    primaryModule: 'src/lib/error-logger.ts',
    auxiliaryModules: ['src/lib/error-tracker.ts'],
    notes: {
      primary:
        'API 错误、运行失败和主要业务错误统一进入 error-logger 主线。',
      auxiliary:
        'error-tracker 保留为文件型兼容日志能力，不再作为当前阶段主入口。',
    },
  },
  performance: {
    primaryModule: 'src/lib/performance-monitor.ts',
    ingestion: 'src/lib/api-error-handler.ts',
    notes: {
      primary: '主 API 路径通过 withApiErrorHandler 统一采集请求级性能指标。',
      auxiliary:
        'withPerformanceMonitoring 和 createMiddleware 保留为显式包装器，属于辅助接入能力。',
    },
  },
} as const

export type ObservabilityMetadata = typeof OBSERVABILITY_BASELINE & {
  performance: typeof OBSERVABILITY_BASELINE.performance & {
    slowRequestThresholdMs: number
  }
}

export function mapHealthSignalToOverallStatus(
  signal: HealthCheckSignal
): OverallHealthStatus {
  return OBSERVABILITY_BASELINE.health.statusMapping[signal]
}

export function deriveOverallStatusFromSignals(
  signals: HealthCheckSignal[]
): OverallHealthStatus {
  if (signals.includes('fail')) {
    return 'unhealthy'
  }

  if (signals.includes('warn')) {
    return 'degraded'
  }

  return 'healthy'
}

export function getHealthHttpStatus(status: OverallHealthStatus): number {
  return status === 'unhealthy' ? 503 : 200
}

export function getSlowRequestThresholdMs(): number {
  return parseInt(
    process.env.SLOW_REQUEST_THRESHOLD ||
      String(DEFAULT_SLOW_REQUEST_THRESHOLD_MS),
    10
  )
}

export function getMaxPerformanceMetrics(): number {
  return parseInt(
    process.env.MAX_PERFORMANCE_METRICS ||
      String(DEFAULT_MAX_PERFORMANCE_METRICS),
    10
  )
}

export function getObservabilityMetadata(): ObservabilityMetadata {
  return {
    ...OBSERVABILITY_BASELINE,
    performance: {
      ...OBSERVABILITY_BASELINE.performance,
      slowRequestThresholdMs: getSlowRequestThresholdMs(),
    },
  }
}
