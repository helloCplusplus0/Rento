/**
 * AlertManager提供者组件
 * 浏览器宿主只保留 provider 外壳，避免把服务端告警/Prisma 依赖带入首包。
 */

'use client'

interface AlertManagerProviderProps {
  children: React.ReactNode
}

export function AlertManagerProvider({ children }: AlertManagerProviderProps) {
  return <>{children}</>
}
