'use client'

import React from 'react'

import { cn } from '@/lib/utils'
import { useLazyImage, type LazyImageOptions } from '@/hooks/useLazyImage'

/**
 * 懒加载图片组件属性接口
 */
export interface LazyImageProps extends LazyImageOptions {
  /** 图片源URL */
  src: string
  /** 图片alt属性 */
  alt: string
  /** 图片类名 */
  className?: string
  /** 容器类名 */
  containerClassName?: string
  /** 图片加载完成回调 */
  onLoad?: () => void
  /** 图片加载失败回调 */
  onError?: () => void
  /** 图片点击回调 */
  onClick?: () => void
  /** 是否显示加载指示器 */
  showLoadingIndicator?: boolean
  /** 是否显示错误指示器 */
  showErrorIndicator?: boolean
  /** 自定义加载指示器 */
  loadingIndicator?: React.ReactNode
  /** 自定义错误指示器 */
  errorIndicator?: React.ReactNode
  /** 图片样式 */
  style?: React.CSSProperties
  /** 容器样式 */
  containerStyle?: React.CSSProperties
}

/**
 * 懒加载图片组件
 *
 * 基于useLazyImage Hook实现的图片懒加载组件，
 * 提供完整的加载状态管理和用户体验优化。
 *
 * 特性：
 * - 自动懒加载，进入视口时才加载
 * - 占位符和加载状态显示
 * - 加载失败处理和重试
 * - 淡入动画效果
 * - 响应式设计支持
 *
 * @example
 * ```tsx
 * <LazyImage
 *   src="/large-image.jpg"
 *   alt="Large image"
 *   placeholder="/placeholder.svg"
 *   className="w-full h-64 object-cover"
 *   showLoadingIndicator
 *   onLoad={() => console.log('Image loaded')}
 * />
 * ```
 */
export function LazyImage({
  src,
  alt,
  className,
  containerClassName,
  placeholder = '/placeholder.svg',
  threshold = 0.1,
  rootMargin = '100px',
  enableFadeIn = true,
  retryCount = 3,
  retryDelay = 1000,
  onLoad,
  onError,
  onClick,
  showLoadingIndicator = true,
  showErrorIndicator = true,
  loadingIndicator,
  errorIndicator,
  style,
  containerStyle,
  enableSmartPreload = true,
  enablePriorityLoading = false,
  preloadDistance = 150,
  ...options
}: LazyImageProps) {
  const { imageSrc, isLoaded, isError, isLoading, imgRef, reload } =
    useLazyImage(src, {
      placeholder,
      threshold,
      rootMargin,
      enableFadeIn,
      retryCount,
      retryDelay,
      enableSmartPreload,
      enablePriorityLoading,
      preloadDistance,
      ...options,
    })

  // 处理加载完成
  React.useEffect(() => {
    if (isLoaded && onLoad) {
      onLoad()
    }
  }, [isLoaded, onLoad])

  // 处理加载失败
  React.useEffect(() => {
    if (isError && onError) {
      onError()
    }
  }, [isError, onError])

  return (
    <div
      className={cn('relative overflow-hidden', containerClassName)}
      style={containerStyle}
    >
      {/* 主图片 */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          {
            'opacity-100': isLoaded,
            'opacity-0': !isLoaded && enableFadeIn,
            'cursor-pointer': onClick,
          },
          className
        )}
        style={style}
        onClick={onClick}
        loading="lazy"
      />

      {/* 加载指示器 */}
      {isLoading && showLoadingIndicator && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {loadingIndicator || (
            <div className="flex flex-col items-center space-y-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span className="text-sm text-gray-500">加载中...</span>
            </div>
          )}
        </div>
      )}

      {/* 错误指示器 */}
      {isError && showErrorIndicator && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {errorIndicator || (
            <div className="flex flex-col items-center space-y-2 p-4">
              <div className="h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <span className="text-center text-sm text-gray-500">
                加载失败
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  reload()
                }}
                className="text-xs text-blue-500 underline hover:text-blue-600"
              >
                重试
              </button>
            </div>
          )}
        </div>
      )}

      {/* 占位符背景（当没有占位符图片时） */}
      {!isLoaded && !isError && !placeholder && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
    </div>
  )
}

/**
 * 头像懒加载组件
 * 专门用于用户头像的懒加载，提供圆形样式和默认占位符
 */
export function LazyAvatar({
  src,
  alt,
  size = 40,
  className,
  ...props
}: Omit<LazyImageProps, 'placeholder'> & {
  size?: number
  placeholder?: string
}) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      placeholder={props.placeholder || '/default-avatar.svg'}
      className={cn('rounded-full object-cover', className)}
      style={{
        width: size,
        height: size,
        ...props.style,
      }}
      {...props}
    />
  )
}

/**
 * 缩略图懒加载组件
 * 专门用于缩略图展示，提供固定尺寸和样式
 */
export function LazyThumbnail({
  src,
  alt,
  width = 120,
  height = 80,
  className,
  ...props
}: Omit<LazyImageProps, 'placeholder'> & {
  width?: number
  height?: number
  placeholder?: string
}) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      placeholder={props.placeholder || '/placeholder-thumbnail.svg'}
      className={cn(
        'rounded-lg border border-gray-200 object-cover',
        className
      )}
      style={{
        width,
        height,
        ...props.style,
      }}
      {...props}
    />
  )
}

/**
 * 背景图片懒加载组件
 * 使用CSS background-image实现的懒加载背景图片
 */
export function LazyBackgroundImage({
  src,
  children,
  className,
  style,
  ...options
}: {
  src: string
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
} & LazyImageOptions) {
  const { imageSrc, isLoaded, isError, imgRef } = useLazyImage(src, options)

  return (
    <div
      ref={imgRef as any}
      className={cn('relative', className)}
      style={{
        backgroundImage: isLoaded ? `url(${imageSrc})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        ...style,
      }}
    >
      {!isLoaded && !isError && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-sm text-gray-400">背景加载失败</span>
        </div>
      )}
      {children}
    </div>
  )
}

export default LazyImage
