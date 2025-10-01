import { ErrorLogger, ErrorSeverity, ErrorType } from './error-logger'

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

/**
 * 缓存配置接口
 */
interface CacheConfig {
  defaultTTL: number // 默认缓存时间（毫秒）
  maxSize: number // 最大缓存项数量
  cleanupInterval: number // 清理间隔（毫秒）
}

/**
 * 账单缓存管理器
 * 提供统计数据和查询结果的高效缓存机制
 */
export class BillCache {
  private cache = new Map<string, CacheItem<any>>()
  private cleanupTimer: NodeJS.Timeout | null = null
  private readonly logger = ErrorLogger.getInstance()

  private readonly config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5分钟默认缓存
    maxSize: 1000, // 最大1000个缓存项
    cleanupInterval: 60 * 1000, // 每分钟清理一次
  }

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    this.startCleanupTimer()
  }

  /**
   * 获取缓存数据
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const item = this.cache.get(key)

      if (!item) {
        return null
      }

      // 检查是否过期
      if (Date.now() - item.timestamp > item.ttl) {
        this.cache.delete(key)
        return null
      }

      return item.data as T
    } catch (error) {
      await this.logger.logError(
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.LOW,
        '缓存获取失败',
        {
          module: 'BillCache',
          function: 'get',
          key,
        },
        error instanceof Error ? error : undefined
      )
      return null
    }
  }

  /**
   * 设置缓存数据
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      // 检查缓存大小限制
      if (this.cache.size >= this.config.maxSize) {
        this.evictOldest()
      }

      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL,
        key,
      }

      this.cache.set(key, item)
    } catch (error) {
      await this.logger.logError(
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.LOW,
        '缓存设置失败',
        {
          module: 'BillCache',
          function: 'set',
          key,
        },
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * 获取或生成缓存数据
   */
  async getOrSet<T>(
    key: string,
    generator: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    try {
      // 生成新数据
      const data = await generator()

      // 存入缓存
      await this.set(key, data, ttl)

      return data
    } catch (error) {
      await this.logger.logError(
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.MEDIUM,
        '缓存数据生成失败',
        {
          module: 'BillCache',
          function: 'getOrSet',
          key,
        },
        error instanceof Error ? error : undefined
      )
      throw error
    }
  }

  /**
   * 删除缓存项
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key)
  }

  /**
   * 批量删除缓存项（支持模式匹配）
   */
  async deletePattern(pattern: string): Promise<number> {
    let deletedCount = 0

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    return deletedCount
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    this.cache.clear()
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    memoryUsage: number
  } {
    const size = this.cache.size
    const maxSize = this.config.maxSize

    // 估算内存使用量（简单估算）
    let memoryUsage = 0
    for (const item of this.cache.values()) {
      memoryUsage += JSON.stringify(item).length * 2 // 粗略估算
    }

    return {
      size,
      maxSize,
      hitRate: 0, // TODO: 实现命中率统计
      memoryUsage,
    }
  }

  /**
   * 淘汰最旧的缓存项
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * 清理过期缓存项
   */
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key))

    if (expiredKeys.length > 0) {
      this.logger.logInfo('缓存清理完成', {
        module: 'BillCache',
        function: 'cleanup',
        expiredCount: expiredKeys.length,
        remainingCount: this.cache.size,
      })
    }
  }

  /**
   * 启动定期清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * 停止清理定时器
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * 销毁缓存实例
   */
  destroy(): void {
    this.stopCleanupTimer()
    this.cache.clear()
  }
}

/**
 * 账单统计缓存管理器
 * 专门用于账单统计数据的缓存
 */
export class BillStatsCache extends BillCache {
  constructor() {
    super({
      defaultTTL: 10 * 60 * 1000, // 统计数据缓存10分钟
      maxSize: 500, // 统计缓存项较少
      cleanupInterval: 2 * 60 * 1000, // 每2分钟清理一次
    })
  }

  /**
   * 生成统计缓存键
   */
  generateStatsKey(params: {
    type: 'overview' | 'detailed' | 'trend'
    startDate?: string
    endDate?: string
    groupBy?: string
    filters?: Record<string, any>
  }): string {
    const { type, startDate, endDate, groupBy, filters } = params
    const filterStr = filters ? JSON.stringify(filters) : ''
    return `bill-stats:${type}:${startDate || ''}:${endDate || ''}:${groupBy || ''}:${filterStr}`
  }

  /**
   * 获取缓存的统计数据
   */
  async getCachedStats<T>(
    params: Parameters<BillStatsCache['generateStatsKey']>[0],
    generator: () => Promise<T>
  ): Promise<T> {
    const key = this.generateStatsKey(params)
    return this.getOrSet(key, generator)
  }

  /**
   * 清除相关统计缓存
   */
  async invalidateStatsCache(pattern?: string): Promise<number> {
    return this.deletePattern(pattern || 'bill-stats:')
  }
}

/**
 * 账单查询缓存管理器
 * 专门用于账单查询结果的缓存
 */
export class BillQueryCache extends BillCache {
  constructor() {
    super({
      defaultTTL: 3 * 60 * 1000, // 查询结果缓存3分钟
      maxSize: 2000, // 查询缓存项较多
      cleanupInterval: 60 * 1000, // 每分钟清理一次
    })
  }

  /**
   * 生成查询缓存键
   */
  generateQueryKey(params: {
    type: 'list' | 'search' | 'filter'
    page?: number
    limit?: number
    filters?: Record<string, any>
    search?: string
  }): string {
    const { type, page, limit, filters, search } = params
    const filterStr = filters ? JSON.stringify(filters) : ''
    return `bill-query:${type}:${page || ''}:${limit || ''}:${search || ''}:${filterStr}`
  }

  /**
   * 获取缓存的查询结果
   */
  async getCachedQuery<T>(
    params: Parameters<BillQueryCache['generateQueryKey']>[0],
    generator: () => Promise<T>
  ): Promise<T> {
    const key = this.generateQueryKey(params)
    return this.getOrSet(key, generator, 2 * 60 * 1000) // 查询结果缓存2分钟
  }

  /**
   * 清除相关查询缓存
   */
  async invalidateQueryCache(pattern?: string): Promise<number> {
    return this.deletePattern(pattern || 'bill-query:')
  }
}

/**
 * 导出单例实例
 */
export const billStatsCache = new BillStatsCache()
export const billQueryCache = new BillQueryCache()

/**
 * 缓存失效处理
 * 当账单数据发生变化时调用
 */
export async function invalidateBillCaches(billId?: string): Promise<void> {
  try {
    // 清除统计缓存
    await billStatsCache.invalidateStatsCache()

    // 清除查询缓存
    await billQueryCache.invalidateQueryCache()

    const logger = ErrorLogger.getInstance()
    await logger.logInfo('账单缓存失效处理完成', {
      module: 'BillCache',
      function: 'invalidateBillCaches',
      billId,
    })
  } catch (error) {
    const logger = ErrorLogger.getInstance()
    await logger.logError(
      ErrorType.SYSTEM_ERROR,
      ErrorSeverity.LOW,
      '账单缓存失效处理失败',
      {
        module: 'BillCache',
        function: 'invalidateBillCaches',
        billId,
      },
      error instanceof Error ? error : undefined
    )
  }
}
