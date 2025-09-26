'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * 懒加载图片Hook的配置选项
 */
export interface LazyImageOptions {
  /** 占位符图片URL */
  placeholder?: string
  /** 交叉观察器的阈值 */
  threshold?: number
  /** 根边距，用于提前加载 */
  rootMargin?: string
  /** 是否启用淡入动画 */
  enableFadeIn?: boolean
  /** 重试次数 */
  retryCount?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
  /** 是否启用智能预加载 */
  enableSmartPreload?: boolean
  /** 预加载距离（像素） */
  preloadDistance?: number
  /** 是否启用优先级加载 */
  enablePriorityLoading?: boolean
}

/**
 * 懒加载图片Hook的返回值
 */
export interface LazyImageResult {
  /** 当前显示的图片源 */
  imageSrc: string
  /** 是否已加载完成 */
  isLoaded: boolean
  /** 是否加载失败 */
  isError: boolean
  /** 是否正在加载 */
  isLoading: boolean
  /** 图片元素的ref */
  imgRef: React.RefObject<HTMLImageElement | null>
  /** 重新加载图片 */
  reload: () => void
}

/**
 * 图片懒加载Hook
 * 
 * 使用Intersection Observer API实现图片懒加载，
 * 只有当图片进入视口时才开始加载，提升页面性能。
 * 
 * 特性：
 * - 基于Intersection Observer的懒加载
 * - 支持占位符图片
 * - 支持加载失败重试
 * - 支持淡入动画
 * - 内存优化，自动清理观察器
 * 
 * @param src 图片源URL
 * @param options 配置选项
 * @returns 懒加载状态和控制方法
 * 
 * @example
 * ```tsx
 * const { imageSrc, isLoaded, isError, imgRef } = useLazyImage('/image.jpg', {
 *   placeholder: '/placeholder.svg',
 *   threshold: 0.1,
 *   rootMargin: '50px'
 * })
 * 
 * return (
 *   <img
 *     ref={imgRef}
 *     src={imageSrc}
 *     alt="Lazy loaded image"
 *     className={`transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-50'}`}
 *   />
 * )
 * ```
 */
export function useLazyImage(
  src: string,
  options: LazyImageOptions = {}
): LazyImageResult {
  const {
    placeholder = '',
    threshold = 0.1,
    rootMargin = '100px', // 增加预加载距离
    enableFadeIn = true,
    retryCount = 3,
    retryDelay = 1000,
    enableSmartPreload = true,
    preloadDistance = 200,
    enablePriorityLoading = false
  } = options

  const [imageSrc, setImageSrc] = useState(placeholder)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentRetry, setCurrentRetry] = useState(0)

  const imgRef = useRef<HTMLImageElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const imageInstanceRef = useRef<HTMLImageElement | null>(null)
  const preloadObserverRef = useRef<IntersectionObserver | null>(null)

  // 加载图片的核心函数
  const loadImage = useCallback(() => {
    if (!src || isLoaded) return

    setIsLoading(true)
    setIsError(false)

    const img = new Image()
    imageInstanceRef.current = img

    img.onload = () => {
      if (imageInstanceRef.current === img) {
        setImageSrc(src)
        setIsLoaded(true)
        setIsLoading(false)
        setIsError(false)
        setCurrentRetry(0)
      }
    }

    img.onerror = () => {
      if (imageInstanceRef.current === img) {
        setIsLoading(false)
        
        if (currentRetry < retryCount) {
          // 重试加载
          setTimeout(() => {
            setCurrentRetry(prev => prev + 1)
            loadImage()
          }, retryDelay)
        } else {
          setIsError(true)
          setCurrentRetry(0)
        }
      }
    }

    img.src = src
  }, [src, isLoaded, currentRetry, retryCount, retryDelay])

  // 重新加载图片
  const reload = useCallback(() => {
    setIsLoaded(false)
    setIsError(false)
    setCurrentRetry(0)
    setImageSrc(placeholder)
    loadImage()
  }, [loadImage, placeholder])

  // 设置Intersection Observer
  useEffect(() => {
    if (!imgRef.current || isLoaded || isError) return

    // 清理之前的观察器
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadImage()
          // 加载开始后断开观察器
          if (observerRef.current) {
            observerRef.current.disconnect()
          }
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    observerRef.current.observe(imgRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadImage, threshold, rootMargin, isLoaded, isError])

  // 清理资源
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      if (imageInstanceRef.current) {
        imageInstanceRef.current.onload = null
        imageInstanceRef.current.onerror = null
        imageInstanceRef.current = null
      }
    }
  }, [])

  // 当src改变时重置状态
  useEffect(() => {
    if (src !== imageSrc && !placeholder) {
      setIsLoaded(false)
      setIsError(false)
      setIsLoading(false)
      setCurrentRetry(0)
      setImageSrc('')
    }
  }, [src, imageSrc, placeholder])

  return {
    imageSrc,
    isLoaded,
    isError,
    isLoading,
    imgRef,
    reload
  }
}

/**
 * 批量图片预加载Hook
 * 
 * 用于预加载一组图片，提升用户体验
 * 
 * @param urls 图片URL数组
 * @param options 配置选项
 * @returns 预加载状态
 * 
 * @example
 * ```tsx
 * const { loadedCount, totalCount, isAllLoaded } = useImagePreloader([
 *   '/image1.jpg',
 *   '/image2.jpg',
 *   '/image3.jpg'
 * ])
 * 
 * return (
 *   <div>
 *     预加载进度: {loadedCount}/{totalCount}
 *     {isAllLoaded && <p>所有图片已加载完成</p>}
 *   </div>
 * )
 * ```
 */
export function useImagePreloader(urls: string[], options: { priority?: boolean } = {}) {
  const [loadedCount, setLoadedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [isAllLoaded, setIsAllLoaded] = useState(false)

  useEffect(() => {
    if (urls.length === 0) {
      setIsAllLoaded(true)
      return
    }

    let loadedImages = 0
    let failedImages = 0

    const preloadImage = (url: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image()
        
        img.onload = () => {
          loadedImages++
          setLoadedCount(loadedImages)
          resolve()
        }
        
        img.onerror = () => {
          failedImages++
          setFailedCount(failedImages)
          resolve()
        }

        img.src = url
      })
    }

    // 并行预加载所有图片
    Promise.all(urls.map(preloadImage)).then(() => {
      setIsAllLoaded(true)
    })

  }, [urls])

  return {
    loadedCount,
    failedCount,
    totalCount: urls.length,
    isAllLoaded,
    progress: urls.length > 0 ? (loadedCount + failedCount) / urls.length : 1
  }
}

export default useLazyImage