import fs from 'node:fs/promises'
import path from 'node:path'

import type { Context } from 'hono'

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

export async function serveMinixAsset(c: Context, distDir: string) {
  const requestPath = normalizeRequestPath(c.req.path)
  const indexPath = path.join(distDir, 'index.html')

  const assetPath =
    requestPath === '/' ? null : resolveAssetPath(distDir, requestPath.slice(1))

  if (assetPath && (await isFile(assetPath))) {
    return createFileResponse(assetPath)
  }

  if (await isFile(indexPath)) {
    return createFileResponse(indexPath, 'text/html; charset=utf-8')
  }

  if (process.env.NODE_ENV !== 'production') {
    return c.json({
      message: 'Minix runtime is healthy. Use the Vite dev server for frontend pages in development.',
      suggestedFrontendOrigin: `http://localhost:${process.env.MINIX_WEB_PORT || '5173'}`,
    })
  }

  return c.text(
    'Minix frontend assets are missing. Run `npm run build:minix` before `npm run start:minix`.',
    503
  )
}

async function createFileResponse(filePath: string, forcedContentType?: string) {
  const body = await fs.readFile(filePath)
  const contentType =
    forcedContentType || MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'

  return new Response(new Uint8Array(body), {
    headers: {
      'content-type': contentType,
      'cache-control': filePath.endsWith('index.html')
        ? 'no-cache'
        : 'public, max-age=31536000, immutable',
    },
  })
}

async function isFile(filePath: string) {
  try {
    const stats = await fs.stat(filePath)
    return stats.isFile()
  } catch {
    return false
  }
}

function normalizeRequestPath(requestPath: string) {
  if (!requestPath || requestPath === '') {
    return '/'
  }

  return requestPath.startsWith('/') ? requestPath : `/${requestPath}`
}

function resolveAssetPath(distDir: string, relativePath: string) {
  const safeRelativePath = relativePath.replace(/^\/+/, '')
  const resolvedPath = path.resolve(distDir, safeRelativePath)

  if (!resolvedPath.startsWith(distDir)) {
    return null
  }

  return resolvedPath
}
