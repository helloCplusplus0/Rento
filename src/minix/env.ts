const runtimeMode = import.meta.env.MODE || 'development'

export const minixClientEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  mode: runtimeMode,
  isDevelopment: runtimeMode === 'development',
  appName: import.meta.env.VITE_APP_NAME || 'Rento-miniX',
  appVersion: import.meta.env.VITE_APP_VERSION || '未配置版本号',
  legacyAppOrigin: import.meta.env.VITE_LEGACY_APP_ORIGIN?.trim() || '',
} as const
