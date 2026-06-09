import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPort = env.MINIX_SERVER_PORT || env.APP_INTERNAL_PORT || '3002'
  const rawPwaEnabled = process.env.VITE_ENABLE_PWA ?? env.VITE_ENABLE_PWA ?? 'false'
  const pwaEnabled = rawPwaEnabled.trim().toLowerCase() === 'true' ? 'true' : 'false'

  return {
    plugins: [
      react(),
      {
        name: 'inject-minix-pwa-flag',
        transformIndexHtml(html) {
          return html.replace(/%VITE_ENABLE_PWA%/g, pwaEnabled)
        },
      },
    ],
    define: {
      'import.meta.env.VITE_ENABLE_PWA': JSON.stringify(pwaEnabled),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: Number.parseInt(env.MINIX_WEB_PORT || '5173', 10),
      proxy: {
        '/api': {
          target: env.MINIX_API_ORIGIN || `http://127.0.0.1:${apiPort}`,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const forwardedHost = req.headers.host
              if (forwardedHost) {
                proxyReq.setHeader('x-forwarded-host', forwardedHost)
              }

              const forwardedProto =
                req.socket instanceof Object && 'encrypted' in req.socket && req.socket.encrypted
                  ? 'https'
                  : 'http'
              proxyReq.setHeader('x-forwarded-proto', forwardedProto)
            })
          },
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})
