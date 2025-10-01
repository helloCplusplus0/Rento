'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * 虚拟滚动组件属性接口
 */
export interface VirtualListProps<T> {
  /** 数据项数组 */
  items: T[]
  /** 每个项目的高度（像素） */
  itemHeight: number
  /** 容器高度（像素） */
  containerHeight: number
  /** 渲染单个项目的函数 */
  renderItem: (item: T, index: number) => React.ReactNode
  /** 预渲染项目数量，用于优化滚动体验 */
  overscan?: number
  /** 滚动事件回调 */
  onScroll?: (scrollTop: number) => void
  /** 容器类名 */
  className?: string
  /** 是否启用滚动到底部加载更多 */
  enableLoadMore?: boolean
  /** 滚动到底部的回调 */
  onLoadMore?: () => void
  /** 加载更多的阈值（距离底部多少像素时触发） */
  loadMoreThreshold?: number
  /** 是否启用渲染缓存优化 */
  enableRenderCache?: boolean
  /** 缓存大小限制 */
  cacheSize?: number
}

/**
 * 虚拟滚动组件
 *
 * 用于高性能渲染大量数据的列表，只渲染可见区域的项目，
 * 大大减少DOM节点数量，提升渲染性能和内存使用效率。
 *
 * 特性：
 * - 支持固定高度项目的虚拟滚动
 * - 预渲染机制，优化滚动体验
 * - 支持滚动到底部加载更多
 * - 内存优化，自动回收不可见项目
 * - 渲染缓存，提升重复渲染性能
 *
 * @example
 * ```tsx
 * <VirtualList
 *   items={bills}
 *   itemHeight={120}
 *   containerHeight={600}
 *   renderItem={(bill, index) => <BillCard key={bill.id} bill={bill} />}
 *   overscan={5}
 *   enableLoadMore
 *   onLoadMore={loadMoreBills}
 *   enableRenderCache={true}
 * />
 * ```
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  onScroll,
  className = '',
  enableLoadMore = false,
  onLoadMore,
  loadMoreThreshold = 100,
  enableRenderCache = true,
  cacheSize = 50,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isLoadingMore = useRef(false)

  // 渲染缓存
  const renderCache = useRef<Map<number, React.ReactNode>>(new Map())
  const cacheKeys = useRef<number[]>([])

  // 防抖滚动处理
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isScrolling, setIsScrolling] = useState(false)

  // 优化的可见范围计算
  const visibleRange = useMemo(() => {
    const itemCount = items.length
    if (itemCount === 0) {
      return { startIndex: 0, endIndex: 0, visibleItems: [] }
    }

    // 使用更精确的计算方法
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    )
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const endIndex = Math.min(
      itemCount,
      startIndex + visibleCount + overscan * 2
    )

    // 获取可见项目
    const visibleItems = items.slice(startIndex, endIndex)

    return { startIndex, endIndex, visibleItems }
  }, [items, itemHeight, containerHeight, scrollTop, overscan])

  // 缓存管理函数
  const manageCacheSize = useCallback(() => {
    if (renderCache.current.size > cacheSize) {
      // 移除最旧的缓存项
      const keysToRemove = cacheKeys.current.splice(
        0,
        renderCache.current.size - cacheSize
      )
      keysToRemove.forEach((key) => {
        renderCache.current.delete(key)
      })
    }
  }, [cacheSize])

  // 获取缓存的渲染项或创建新的
  const getCachedRenderItem = useCallback(
    (item: T, index: number) => {
      if (!enableRenderCache) {
        return renderItem(item, index)
      }

      const cacheKey = index

      if (renderCache.current.has(cacheKey)) {
        return renderCache.current.get(cacheKey)
      }

      const renderedItem = renderItem(item, index)
      renderCache.current.set(cacheKey, renderedItem)
      cacheKeys.current.push(cacheKey)

      // 管理缓存大小
      manageCacheSize()

      return renderedItem
    },
    [renderItem, enableRenderCache, manageCacheSize]
  )

  // 总高度
  const totalHeight = items.length * itemHeight

  // 可见项目的偏移量
  const offsetY = visibleRange.startIndex * itemHeight

  // 优化的滚动事件处理
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      const newScrollTop = target.scrollTop

      // 使用requestAnimationFrame优化滚动性能
      requestAnimationFrame(() => {
        setScrollTop(newScrollTop)
        onScroll?.(newScrollTop)
      })

      // 设置滚动状态
      setIsScrolling(true)

      // 清除之前的定时器
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // 滚动结束后重置状态
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 150)

      // 检查是否需要加载更多
      if (enableLoadMore && onLoadMore && !isLoadingMore.current) {
        const scrollHeight = target.scrollHeight
        const clientHeight = target.clientHeight
        const distanceFromBottom = scrollHeight - (newScrollTop + clientHeight)

        if (distanceFromBottom <= loadMoreThreshold) {
          isLoadingMore.current = true
          onLoadMore()
          // 重置加载状态，允许下次加载
          setTimeout(() => {
            isLoadingMore.current = false
          }, 1000)
        }
      }
    },
    [onScroll, enableLoadMore, onLoadMore, loadMoreThreshold]
  )

  // 滚动到指定索引
  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        const scrollTop = index * itemHeight
        containerRef.current.scrollTop = scrollTop
        setScrollTop(scrollTop)
      }
    },
    [itemHeight]
  )

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    scrollToIndex(0)
  }, [scrollToIndex])

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    scrollToIndex(items.length - 1)
  }, [scrollToIndex, items.length])

  // 清理缓存
  const clearCache = useCallback(() => {
    renderCache.current.clear()
    cacheKeys.current = []
  }, [])

  // 当items变化时清理缓存
  useEffect(() => {
    if (enableRenderCache) {
      clearCache()
    }
  }, [items, enableRenderCache, clearCache])

  // 暴露滚动方法
  useEffect(() => {
    if (containerRef.current) {
      ;(containerRef.current as any).scrollToIndex = scrollToIndex
      ;(containerRef.current as any).scrollToTop = scrollToTop
      ;(containerRef.current as any).scrollToBottom = scrollToBottom
      ;(containerRef.current as any).clearCache = clearCache
    }
  }, [scrollToIndex, scrollToTop, scrollToBottom, clearCache])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`virtual-list-container overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* 总高度占位符，用于正确显示滚动条 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 可见项目容器 */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            // 滚动时减少重绘
            willChange: isScrolling ? 'transform' : 'auto',
          }}
        >
          {visibleRange.visibleItems.map((item, index) => {
            const actualIndex = visibleRange.startIndex + index
            return (
              <div
                key={actualIndex}
                style={{
                  height: itemHeight,
                  // 优化渲染性能
                  contain: 'layout style paint',
                }}
                className="virtual-list-item"
              >
                {getCachedRenderItem(item, actualIndex)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * 虚拟滚动Hook，用于管理虚拟滚动状态
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const itemCount = items.length
    if (itemCount === 0) {
      return { startIndex: 0, endIndex: 0, visibleItems: [] }
    }

    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    )
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const endIndex = Math.min(
      itemCount,
      startIndex + visibleCount + overscan * 2
    )
    const visibleItems = items.slice(startIndex, endIndex)

    return { startIndex, endIndex, visibleItems }
  }, [items, itemHeight, containerHeight, scrollTop, overscan])

  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    totalHeight: items.length * itemHeight,
    offsetY: visibleRange.startIndex * itemHeight,
  }
}

export default VirtualList
