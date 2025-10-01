'use client'

import { ErrorLogger, ErrorSeverity, ErrorType } from './error-logger'

/**
 * 本地缓存项接口
 */
interface LocalCacheItem<T> {
  data: T
  timestamp: number
  maxAge: number
  version?: string
  tags?: string[]
}

/**
 * 本地缓存配置接口
 */
export interface LocalCacheConfig {
  /** 缓存前缀 */
  prefix: string
  /** 默认过期时间（毫秒） */
  maxAge: number
  /** 是否启用版本控制 */
  enableVersioning: boolean
  /** 当前版本号 */
  version?: string
  /** 是否启用压缩 */
  enableCompression: boolean
  /** 最大存储大小（字节） */
  maxStorageSize: number
}

/**
 * 本地存储缓存类
 *
 * 基于localStorage/sessionStorage的前端缓存系统，提供：
 * - 自动过期管理
 * - 版本控制
 * - 数据压缩
 * - 存储空间管理
 * - 标签系统
 */
export class LocalStorageCache {
  private prefix: string
  private maxAge: number
  private enableVersioning: boolean
  private version: string
  private enableCompression: boolean
  private maxStorageSize: number
  private logger = ErrorLogger.getInstance()
  private storage: Storage

  constructor(config: LocalCacheConfig, useSessionStorage: boolean = false) {
    this.prefix = config.prefix
    this.maxAge = config.maxAge
    this.enableVersioning = config.enableVersioning
    this.version = config.version || '1.0.0'
    this.enableCompression = config.enableCompression
    this.maxStorageSize = config.maxStorageSize

    // 选择存储类型
    this.storage = useSessionStorage ? sessionStorage : localStorage

    // 初始化时清理过期数据
    this.cleanup()
  }

  /**
   * 设置缓存数据
   */
  set<T>(
    key: string,
    data: T,
    options?: {
      maxAge?: number
      tags?: string[]
      version?: string
    }
  ): boolean {
    try {
      const item: LocalCacheItem<T> = {
        data,
        timestamp: Date.now(),
        maxAge: options?.maxAge || this.maxAge,
        version: options?.version || this.version,
        tags: options?.tags,
      }

      const serialized = this.serialize(item)
      const fullKey = this.getFullKey(key)

      // 检查存储空间
      if (this.getStorageSize() + serialized.length > this.maxStorageSize) {
        this.evictOldest()
      }

      this.storage.setItem(fullKey, serialized)
      return true
    } catch (error) {
      this.logger.logWarning('Failed to set cache item', {
        key,
        error: (error as Error).message,
      })
      return false
    }
  }

  /**
   * 获取缓存数据
   */
  get<T>(
    key: string,
    options?: {
      acceptVersion?: string
      acceptTags?: string[]
    }
  ): T | null {
    try {
      const fullKey = this.getFullKey(key)
      const serialized = this.storage.getItem(fullKey)

      if (!serialized) {
        return null
      }

      const item = this.deserialize<T>(serialized)

      // 检查过期时间
      if (Date.now() - item.timestamp > item.maxAge) {
        this.delete(key)
        return null
      }

      // 检查版本
      if (this.enableVersioning && options?.acceptVersion) {
        if (item.version !== options.acceptVersion) {
          return null
        }
      }

      // 检查标签
      if (options?.acceptTags && item.tags) {
        const hasMatchingTag = options.acceptTags.some((tag) =>
          item.tags!.includes(tag)
        )
        if (!hasMatchingTag) {
          return null
        }
      }

      return item.data
    } catch (error) {
      this.logger.logWarning('Failed to get cache item', {
        key,
        error: (error as Error).message,
      })
      return null
    }
  }

  /**
   * 获取或设置缓存数据
   */
  async getOrSet<T>(
    key: string,
    generator: () => Promise<T> | T,
    options?: {
      maxAge?: number
      tags?: string[]
      version?: string
    }
  ): Promise<T> {
    const cached = this.get<T>(key, {
      acceptVersion: options?.version,
      acceptTags: options?.tags,
    })

    if (cached !== null) {
      return cached
    }

    const data = await generator()
    this.set(key, data, options)
    return data
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    try {
      const fullKey = this.getFullKey(key)
      this.storage.removeItem(fullKey)
      return true
    } catch (error) {
      this.logger.logWarning('Failed to delete cache item', {
        key,
        error: (error as Error).message,
      })
      return false
    }
  }

  /**
   * 根据模式删除缓存项
   */
  deletePattern(pattern: string): number {
    let deletedCount = 0
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))

    try {
      const keysToDelete: string[] = []

      for (let i = 0; i < this.storage.length; i++) {
        const fullKey = this.storage.key(i)
        if (fullKey && fullKey.startsWith(this.prefix)) {
          const key = this.extractKey(fullKey)
          if (regex.test(key)) {
            keysToDelete.push(key)
          }
        }
      }

      keysToDelete.forEach((key) => {
        if (this.delete(key)) {
          deletedCount++
        }
      })
    } catch (error) {
      this.logger.logWarning('Failed to delete cache pattern', {
        pattern,
        error: (error as Error).message,
      })
    }

    return deletedCount
  }

  /**
   * 根据标签删除缓存项
   */
  deleteByTags(tags: string[]): number {
    let deletedCount = 0

    try {
      const keysToDelete: string[] = []

      for (let i = 0; i < this.storage.length; i++) {
        const fullKey = this.storage.key(i)
        if (fullKey && fullKey.startsWith(this.prefix)) {
          const serialized = this.storage.getItem(fullKey)
          if (serialized) {
            try {
              const item = this.deserialize(serialized)
              if (item.tags && item.tags.some((tag) => tags.includes(tag))) {
                keysToDelete.push(this.extractKey(fullKey))
              }
            } catch {
              // 忽略解析错误的项目
            }
          }
        }
      }

      keysToDelete.forEach((key) => {
        if (this.delete(key)) {
          deletedCount++
        }
      })
    } catch (error) {
      this.logger.logWarning('Failed to delete cache by tags', {
        tags,
        error: (error as Error).message,
      })
    }

    return deletedCount
  }

  /**
   * 清空所有缓存
   */
  clear(): number {
    let deletedCount = 0

    try {
      const keysToDelete: string[] = []

      for (let i = 0; i < this.storage.length; i++) {
        const fullKey = this.storage.key(i)
        if (fullKey && fullKey.startsWith(this.prefix)) {
          keysToDelete.push(this.extractKey(fullKey))
        }
      }

      keysToDelete.forEach((key) => {
        if (this.delete(key)) {
          deletedCount++
        }
      })
    } catch (error) {
      this.logger.logWarning('Failed to clear cache', {
        error: (error as Error).message,
      })
    }

    return deletedCount
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    itemCount: number
    totalSize: number
    oldestItem: Date | null
    newestItem: Date | null
    hitRate: number
  } {
    let itemCount = 0
    let totalSize = 0
    let oldestTimestamp = Infinity
    let newestTimestamp = 0

    try {
      for (let i = 0; i < this.storage.length; i++) {
        const fullKey = this.storage.key(i)
        if (fullKey && fullKey.startsWith(this.prefix)) {
          const serialized = this.storage.getItem(fullKey)
          if (serialized) {
            itemCount++
            totalSize += serialized.length

            try {
              const item = this.deserialize(serialized)
              oldestTimestamp = Math.min(oldestTimestamp, item.timestamp)
              newestTimestamp = Math.max(newestTimestamp, item.timestamp)
            } catch {
              // 忽略解析错误的项目
            }
          }
        }
      }
    } catch (error) {
      this.logger.logWarning('Failed to get cache stats', {
        error: (error as Error).message,
      })
    }

    return {
      itemCount,
      totalSize,
      oldestItem:
        oldestTimestamp === Infinity ? null : new Date(oldestTimestamp),
      newestItem: newestTimestamp === 0 ? null : new Date(newestTimestamp),
      hitRate: 0, // 需要额外的统计逻辑来计算命中率
    }
  }

  /**
   * 清理过期数据
   */
  cleanup(): number {
    let cleanedCount = 0
    const now = Date.now()

    try {
      const keysToDelete: string[] = []

      for (let i = 0; i < this.storage.length; i++) {
        const fullKey = this.storage.key(i)
        if (fullKey && fullKey.startsWith(this.prefix)) {
          const serialized = this.storage.getItem(fullKey)
          if (serialized) {
            try {
              const item = this.deserialize(serialized)
              if (now - item.timestamp > item.maxAge) {
                keysToDelete.push(this.extractKey(fullKey))
              }
            } catch {
              // 删除无法解析的项目
              keysToDelete.push(this.extractKey(fullKey))
            }
          }
        }
      }

      keysToDelete.forEach((key) => {
        if (this.delete(key)) {
          cleanedCount++
        }
      })
    } catch (error) {
      this.logger.logWarning('Failed to cleanup cache', {
        error: (error as Error).message,
      })
    }

    return cleanedCount
  }

  /**
   * 序列化数据
   */
  private serialize<T>(item: LocalCacheItem<T>): string {
    const json = JSON.stringify(item)

    if (this.enableCompression && json.length > 1024) {
      // 简单的压缩：移除空格
      return json.replace(/\s+/g, ' ')
    }

    return json
  }

  /**
   * 反序列化数据
   */
  private deserialize<T>(serialized: string): LocalCacheItem<T> {
    return JSON.parse(serialized)
  }

  /**
   * 获取完整键名
   */
  private getFullKey(key: string): string {
    return `${this.prefix}:${key}`
  }

  /**
   * 从完整键名提取原始键名
   */
  private extractKey(fullKey: string): string {
    return fullKey.substring(this.prefix.length + 1)
  }

  /**
   * 获取当前存储大小
   */
  private getStorageSize(): number {
    let size = 0

    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key && key.startsWith(this.prefix)) {
          const value = this.storage.getItem(key)
          if (value) {
            size += key.length + value.length
          }
        }
      }
    } catch {
      // 忽略错误
    }

    return size
  }

  /**
   * 清理最旧的缓存项
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Infinity

    try {
      for (let i = 0; i < this.storage.length; i++) {
        const fullKey = this.storage.key(i)
        if (fullKey && fullKey.startsWith(this.prefix)) {
          const serialized = this.storage.getItem(fullKey)
          if (serialized) {
            try {
              const item = this.deserialize(serialized)
              if (item.timestamp < oldestTimestamp) {
                oldestTimestamp = item.timestamp
                oldestKey = this.extractKey(fullKey)
              }
            } catch {
              // 删除无法解析的项目
              this.storage.removeItem(fullKey)
            }
          }
        }
      }

      if (oldestKey) {
        this.delete(oldestKey)
      }
    } catch (error) {
      this.logger.logWarning('Failed to evict oldest cache item', {
        error: (error as Error).message,
      })
    }
  }
}

// 预定义的缓存实例
export const searchCache = new LocalStorageCache({
  prefix: 'rento-search',
  maxAge: 2 * 60 * 1000, // 2分钟
  enableVersioning: false,
  enableCompression: true,
  maxStorageSize: 1024 * 1024, // 1MB
})

export const userPrefsCache = new LocalStorageCache({
  prefix: 'rento-prefs',
  maxAge: 24 * 60 * 60 * 1000, // 24小时
  enableVersioning: true,
  version: '1.0.0',
  enableCompression: false,
  maxStorageSize: 512 * 1024, // 512KB
})

export const apiCache = new LocalStorageCache({
  prefix: 'rento-api',
  maxAge: 5 * 60 * 1000, // 5分钟
  enableVersioning: true,
  version: '1.0.0',
  enableCompression: true,
  maxStorageSize: 2 * 1024 * 1024, // 2MB
})

export const tempCache = new LocalStorageCache(
  {
    prefix: 'rento-temp',
    maxAge: 30 * 1000, // 30秒
    enableVersioning: false,
    enableCompression: false,
    maxStorageSize: 256 * 1024, // 256KB
  },
  true
) // 使用sessionStorage

export default LocalStorageCache
