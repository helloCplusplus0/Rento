export const minixClientEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  mode: import.meta.env.MODE,
  appName: import.meta.env.VITE_APP_NAME || 'Rento-miniX',
} as const
