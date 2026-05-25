'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Info, Smartphone, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { usePwaInstallState } from '@/hooks/usePwaInstallState'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const INSTALL_PROMPT_STORAGE_PREFIX = 'rento:pwa-install-prompt'

type PromptVariant = 'installable' | 'manual-ios' | 'unsupported' | null

function getPromptVariant(params: {
  installMethod: ReturnType<typeof usePwaInstallState>['installMethod']
  isMobile: boolean
  platform: ReturnType<typeof usePwaInstallState>['platform']
  status: ReturnType<typeof usePwaInstallState>['status']
}): PromptVariant {
  const { installMethod, isMobile, platform, status } = params

  if (status === 'installed' || status === 'unknown') {
    return null
  }

  if (installMethod === 'native-prompt') {
    return 'installable'
  }

  if (installMethod === 'manual-ios') {
    return 'manual-ios'
  }

  if (status === 'unsupported' && isMobile && platform !== 'ios') {
    return 'unsupported'
  }

  return null
}

export function PwaInstallPrompt() {
  const pathname = usePathname()
  const { installMethod, isMobile, platform, promptInstall, status } =
    usePwaInstallState()
  const [dismissed, setDismissed] = useState(false)
  const [showManualSteps, setShowManualSteps] = useState(false)
  const [isPrompting, setIsPrompting] = useState(false)

  const promptVariant = useMemo(
    () =>
      getPromptVariant({
        installMethod,
        isMobile,
        platform,
        status,
      }),
    [installMethod, isMobile, platform, status]
  )

  useEffect(() => {
    if (!promptVariant || typeof window === 'undefined') {
      setDismissed(false)
      return
    }

    setShowManualSteps(false)
    setDismissed(
      window.localStorage.getItem(
        `${INSTALL_PROMPT_STORAGE_PREFIX}:${promptVariant}`
      ) === '1'
    )
  }, [promptVariant])

  if (pathname === '/offline' || !promptVariant || dismissed) {
    return null
  }

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        `${INSTALL_PROMPT_STORAGE_PREFIX}:${promptVariant}`,
        '1'
      )
    }

    setDismissed(true)
  }

  const handleInstallClick = async () => {
    setIsPrompting(true)

    try {
      const outcome = await promptInstall()

      if (outcome === 'accepted') {
        setDismissed(true)
      }
    } finally {
      setIsPrompting(false)
    }
  }

  const cardTone =
    promptVariant === 'unsupported'
      ? 'border-amber-200 bg-amber-50/95'
      : 'border-blue-200 bg-white/95'

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-[70] px-3 md:right-4 md:bottom-4 md:left-auto md:max-w-sm md:px-0">
      <section
        aria-live="polite"
        className={cn(
          'pointer-events-auto overflow-hidden rounded-2xl border shadow-lg shadow-slate-200/70 backdrop-blur',
          cardTone
        )}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            {promptVariant === 'unsupported' ? (
              <Info className="h-5 w-5" />
            ) : (
              <Smartphone className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              {promptVariant === 'installable'
                ? '安装 Rento 到桌面'
                : promptVariant === 'manual-ios'
                  ? 'iPhone/iPad 安装说明'
                  : '继续使用网页版'}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {promptVariant === 'installable'
                ? '当前浏览器已满足最小安装条件，可将 Rento 添加到桌面，后续将继续复用同一套业务界面。'
                : promptVariant === 'manual-ios'
                  ? 'iOS 暂不作为正式承诺平台，这里只保留最小安装说明，不影响继续作为普通 Web 使用。'
                  : '当前浏览器不提供统一安装提示，系统会自动退化为普通响应式 Web。'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-white/80 hover:text-slate-600"
            aria-label="关闭安装提示"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-t border-slate-200/80 px-4 py-3">
          {promptVariant === 'installable' ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                安卓 Chrome/Edge 优先支持
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleInstallClick}
                disabled={isPrompting}
              >
                <Download className="h-4 w-4" />
                {isPrompting ? '正在打开...' : '立即安装'}
              </Button>
            </div>
          ) : promptVariant === 'manual-ios' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  浏览器态与安装态共用同一套页面
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowManualSteps((current) => !current)}
                >
                  {showManualSteps ? '收起步骤' : '查看步骤'}
                </Button>
              </div>

              {showManualSteps ? (
                <ol className="space-y-2 text-sm text-slate-600">
                  <li>1. 点击 Safari 底部或顶部的“分享”。</li>
                  <li>2. 选择“添加到主屏幕”。</li>
                  <li>3. 确认名称为“Rento”后完成添加。</li>
                </ol>
              ) : null}
            </div>
          ) : (
            <p className="text-xs leading-5 text-slate-500">
              当前会继续以普通 Web 退化运行；即使启用最小 PWA，也不会缓存动态业务接口和鉴权态业务页面。
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
