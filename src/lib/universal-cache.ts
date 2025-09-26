import { BillCache } from './bill-cache'
import { ErrorLogger, ErrorType, ErrorSeverity } from './error-logger'

/**
 * 缓存模块配置接口
 */
interface CacheModuleConfig {
  /** 默认缓存时间（毫秒） */
  defaultTTL: number
  /** 最大缓存项数量 */
  maxSize: number
  /** 清理间隔（毫秒） */
  cleanupInterval: number
}

/**
 * 通用缓存管理器
 * 
 * 为不同模块提供统一的缓存管理，支持：
 * - 模块化缓存实例管理
 * - 统一的缓存策略配置
 * - 全局缓存清理和监控
 * - 缓存性能统计
 */
class UniversalCacheManager {
  private static instance: UniversalCacheManager
  private caches = new Map<string, BillCache>()
  private logger = ErrorLogger.getInstance()
  
  // 默认配置
  private defaultConfig: CacheModuleConfig = {
    defaultTTL: 5 * 60 * 1000,      // 5分钟
    maxSize: 500,                   // 500个缓存项
    cleanupInterval: 60 * 1000      // 1分钟清理间隔
  }
  
  // 模块特定配置
  private moduleConfigs: Record<string, Partial<CacheModuleConfig>> = {
    // 账单模块 - 高频访问，较长缓存时间
    bills: {
      defaultTTL: 10 * 60 * 1000,   // 10分钟
      maxSize: 1000
    },
    
    // 房间模块 - 中频访问，中等缓存时间
    rooms: {
      defaultTTL: 5 * 60 * 1000,    // 5分钟
      maxSize: 500
    },
    
    // 租客模块 - 低频访问，较短缓存时间
    renters: {
      defaultTTL: 3 * 60 * 1000,    // 3分钟
      maxSize: 300
    },
    
    // 合同模块 - 中频访问，中等缓存时间
    contracts: {
      defaultTTL: 5 * 60 * 1000,    // 5分钟
      maxSize: 500
    },
    
    // 统计模块 - 高频访问，较长缓存时间
    stats: {
      defaultTTL: 15 * 60 * 1000,   // 15分钟
      maxSize: 200
    },
    
    // 搜索模块 - 短期缓存，快速过期
    search: {
      defaultTTL: 2 * 60 * 1000,    // 2分钟
      maxSize: 100
    }
  }

  private constructor() {
    this.logger.logInfo('UniversalCache initialized', {
      modules: Object.keys(this.moduleConfigs),
      defaultConfig: this.defaultConfig
    })
  }

  /**
   * 获取单例实例
   */
  static getInstance(): UniversalCacheManager {
    if (!UniversalCacheManager.instance) {
      UniversalCacheManager.instance = new UniversalCacheManager()
    }
    return UniversalCacheManager.instance
  }

  /**
   * 获取指定模块的缓存实例
   */
  getCache(module: string): BillCache {
    if (!this.caches.has(module)) {
      const moduleConfig = this.moduleConfigs[module] || {}
      const config = { ...this.defaultConfig, ...moduleConfig }
      
      this.caches.set(module, new BillCache(config))
      
      this.logger.logInfo(`Cache instance created for module: ${module}`, {
        module,
        config
      })
    }
    
    return this.caches.get(module)!
  }

  /**
   * 清理指定模块的缓存
   */
  async invalidateModule(module: string): Promise<void> {
    const cache = this.caches.get(module)
    if (cache) {
      await cache.clear()
      this.logger.logInfo(`Cache cleared for module: ${module}`, { module })
    }
  }

  /**
   * 清理所有模块的缓存
   */
  async invalidateAll(): Promise<void> {
    const promises = Array.from(this.caches.entries()).map(async ([module, cache]) => {
      await cache.clear()
      this.logger.logInfo(`Cache cleared for module: ${module}`, { module })
    })
    
    await Promise.all(promises)
    this.logger.logInfo('All caches cleared', {})
  }

  /**
   * 获取所有模块的缓存统计
   */
  getAllStats(): Record<string, {
    size: number
    maxSize: number
    hitRate: number
    memoryUsage: number
  }> {
    const stats: Record<string, any> = {}
    
    this.caches.forEach((cache, module) => {
      stats[module] = cache.getStats()
    })
    
    return stats
  }

  /**
   * 获取缓存总体统计
   */
  getOverallStats(): {
    totalModules: number
    totalSize: number
    totalMaxSize: number
    averageHitRate: number
    totalMemoryUsage: number
  } {
    const allStats = this.getAllStats()
    const modules = Object.keys(allStats)
    
    if (modules.length === 0) {
      return {
        totalModules: 0,
        totalSize: 0,
        totalMaxSize: 0,
        averageHitRate: 0,
        totalMemoryUsage: 0
      }
    }
    
    const totalSize = modules.reduce((sum, module) => sum + allStats[module].size, 0)
    const totalMaxSize = modules.reduce((sum, module) => sum + allStats[module].maxSize, 0)
    const averageHitRate = modules.reduce((sum, module) => sum + allStats[module].hitRate, 0) / modules.length
    const totalMemoryUsage = modules.reduce((sum, module) => sum + allStats[module].memoryUsage, 0)
    
    return {
      totalModules: modules.length,
      totalSize,
      totalMaxSize,
      averageHitRate,
      totalMemoryUsage
    }
  }

  /**
   * 销毁所有缓存实例
   */
  destroy(): void {
    this.caches.forEach((cache, module) => {
      cache.destroy()
      this.logger.logInfo(`Cache destroyed for module: ${module}`, { module })
    })
    
    this.caches.clear()
    this.logger.logInfo('UniversalCache destroyed', {})
  }

  /**
   * 设置模块配置
   */
  setModuleConfig(module: string, config: Partial<CacheModuleConfig>): void {
    this.moduleConfigs[module] = { ...this.moduleConfigs[module], ...config }
    
    // 如果缓存实例已存在，需要重新创建
    if (this.caches.has(module)) {
      const cache = this.caches.get(module)!
      cache.destroy()
      this.caches.delete(module)
    }
    
    this.logger.logInfo(`Module config updated: ${module}`, { config })
  }

  /**
   * 获取模块配置
   */
  getModuleConfig(module: string): CacheModuleConfig {
    const moduleConfig = this.moduleConfigs[module] || {}
    return { ...this.defaultConfig, ...moduleConfig }
  }
}

/**
 * 专用缓存类，继承自BillCache，提供特定功能
 */
export class QueryCache extends BillCache {
  constructor(module: string) {
    const config = UniversalCacheManager.getInstance().getModuleConfig(module)
    super(config)
  }

  /**
   * 生成查询缓存键
   */
  generateQueryKey(params: {
    type: 'list' | 'search' | 'filter' | 'detail'
    page?: number
    limit?: number
    filters?: Record<string, any>
    search?: string
    id?: string
  }): string {
    const { type, page, limit, filters, search, id } = params
    const parts: string[] = [type]
    
    if (id) parts.push(`id-${id}`)
    if (page) parts.push(`page-${page}`)
    if (limit) parts.push(`limit-${limit}`)
    if (search) parts.push(`search-${search}`)
    if (filters) {
      const filterStr = Object.entries(filters)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}-${value}`)
        .sort()
        .join(',')
      if (filterStr) parts.push(`filters-${filterStr}`)
    }
    
    return parts.join('|')
  }

  /**
   * 获取缓存查询结果
   */
  async getCachedQuery<T>(
    params: Parameters<QueryCache['generateQueryKey']>[0],
    generator: () => Promise<T>
  ): Promise<T> {
    const key = this.generateQueryKey(params)
    return this.getOrSet(key, generator)
  }

  /**
   * 清理查询缓存
   */
  async invalidateQueryCache(pattern?: string): Promise<number> {
    return this.deletePattern(pattern || '*')
  }
}

/**
 * 统计缓存类
 */
export class StatsCache extends BillCache {
  constructor(module: string) {
    const config = UniversalCacheManager.getInstance().getModuleConfig(`${module}-stats`)
    super({
      ...config,
      defaultTTL: 15 * 60 * 1000  // 统计数据缓存15分钟
    })
  }

  /**
   * 生成统计缓存键
   */
  generateStatsKey(params: {
    type: 'overview' | 'detailed' | 'trend' | 'status'
    startDate?: string
    endDate?: string
    groupBy?: string
    filters?: Record<string, any>
  }): string {
    const { type, startDate, endDate, groupBy, filters } = params
    const parts = [`stats-${type}`]
    
    if (startDate) parts.push(`start-${startDate}`)
    if (endDate) parts.push(`end-${endDate}`)
    if (groupBy) parts.push(`group-${groupBy}`)
    if (filters) {
      const filterStr = Object.entries(filters)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}-${value}`)
        .sort()
        .join(',')
      if (filterStr) parts.push(`filters-${filterStr}`)
    }
    
    return parts.join('|')
  }

  /**
   * 获取缓存统计数据
   */
  async getCachedStats<T>(
    params: Parameters<StatsCache['generateStatsKey']>[0],
    generator: () => Promise<T>
  ): Promise<T> {
    const key = this.generateStatsKey(params)
    return this.getOrSet(key, generator)
  }

  /**
   * 清理统计缓存
   */
  async invalidateStatsCache(pattern?: string): Promise<number> {
    return this.deletePattern(pattern || 'stats-*')
  }
}

// 创建模块化缓存实例
const universalCache = UniversalCacheManager.getInstance()

// 导出各模块的缓存实例
export const roomCache = new QueryCache('rooms')
export const renterCache = new QueryCache('renters')
export const contractCache = new QueryCache('contracts')
export const searchCache = new QueryCache('search')

// 导出统计缓存实例
export const roomStatsCache = new StatsCache('rooms')
export const renterStatsCache = new StatsCache('renters')
export const contractStatsCache = new StatsCache('contracts')

/**
 * 全局缓存失效函数
 * 当数据发生变更时，清理相关缓存
 */
export async function invalidateRelatedCaches(
  entity: 'room' | 'renter' | 'contract' | 'bill',
  entityId?: string
): Promise<void> {
  const logger = ErrorLogger.getInstance()
  
  try {
    switch (entity) {
      case 'room':
        await Promise.all([
          roomCache.clear(),
          roomStatsCache.clear(),
          contractCache.deletePattern('*room*'),
          searchCache.clear()
        ])
        break
        
      case 'renter':
        await Promise.all([
          renterCache.clear(),
          renterStatsCache.clear(),
          contractCache.deletePattern('*renter*'),
          searchCache.clear()
        ])
        break
        
      case 'contract':
        await Promise.all([
          contractCache.clear(),
          contractStatsCache.clear(),
          roomCache.deletePattern('*contract*'),
          renterCache.deletePattern('*contract*'),
          searchCache.clear()
        ])
        break
        
      case 'bill':
        await Promise.all([
          universalCache.invalidateModule('bills'),
          contractCache.deletePattern('*bill*'),
          searchCache.clear()
        ])
        break
    }
    
    logger.logInfo(`Related caches invalidated for ${entity}`, { entityId })
  } catch (error) {
    await logger.logError(
      ErrorType.DATABASE_ERROR,
      ErrorSeverity.MEDIUM,
      'Failed to invalidate related caches',
      { entity, entityId },
      error as Error
    )
  }
}

export { UniversalCacheManager }
export default universalCache