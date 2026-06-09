import fs from 'node:fs/promises'
import path from 'node:path'

import type { Context } from 'hono'

import type { MinixServerEnv } from './env'

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

export async function serveMinixAsset(
  c: Context,
  env: Pick<MinixServerEnv, 'distDir' | 'isProduction' | 'webPort'>
) {
  const requestPath = normalizeRequestPath(c.req.path)
  const indexPath = path.join(env.distDir, 'index.html')
  const expectsStaticAsset = hasAssetExtension(requestPath)

  const assetPath =
    requestPath === '/' ? null : resolveAssetPath(env.distDir, requestPath.slice(1))

  if (assetPath && (await isFile(assetPath))) {
    return createFileResponse(assetPath)
  }

  // Only extensionless paths fall back to the SPA shell.
  if (!expectsStaticAsset && (await isFile(indexPath))) {
    return createFileResponse(indexPath, 'text/html; charset=utf-8')
  }

  if (!env.isProduction) {
    return c.json(
      {
        message: expectsStaticAsset
          ? 'Frontend asset is not served by the Hono runtime in development.'
          : 'Minix runtime is healthy. Use the Vite dev server for frontend pages in development.',
        spaFallbackReserved: !expectsStaticAsset,
        suggestedFrontendOrigin: `http://localhost:${env.webPort}`,
      },
      expectsStaticAsset ? 404 : 200
    )
  }

  if (expectsStaticAsset) {
    return c.text('Minix frontend asset not found in dist output.', 404)
  }

  return c.text(
    'Minix frontend assets are missing. Run `npm run build:minix` before `npm run start:minix`.',
    503
  )
}

async function createFileResponse(filePath: string, forcedContentType?: string) {
  const body = await fs.readFile(filePath)
  const contentType = resolveContentType(filePath, forcedContentType)
  const headers = createAssetHeaders(filePath, contentType)

  return new Response(new Uint8Array(body), {
    headers,
  })
}

function resolveContentType(filePath: string, forcedContentType?: string) {
  if (forcedContentType) {
    return forcedContentType
  }

  if (path.basename(filePath) === 'manifest.json') {
    return 'application/manifest+json; charset=utf-8'
  }

  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
}

function createAssetHeaders(filePath: string, contentType: string) {
  const basename = path.basename(filePath)
  const headers: Record<string, string> = {
    'content-type': contentType,
  }

  if (basename === 'index.html') {
    headers['cache-control'] = 'no-cache'
    return headers
  }

  if (basename === 'sw.js') {
    headers['cache-control'] = 'no-cache, no-store, must-revalidate'
    headers['service-worker-allowed'] = '/'
    return headers
  }

  if (basename === 'manifest.json') {
    headers['cache-control'] = 'no-cache'
    return headers
  }

  headers['cache-control'] = 'public, max-age=31536000, immutable'
  return headers
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

function hasAssetExtension(requestPath: string) {
  const basename = path.posix.basename(requestPath)
  return basename.includes('.') && basename !== '.well-known'
}

function resolveAssetPath(distDir: string, relativePath: string) {
  const safeRelativePath = relativePath.replace(/^\/+/, '')
  const resolvedPath = path.resolve(distDir, safeRelativePath)

  if (!resolvedPath.startsWith(distDir)) {
    return null
  }

  return resolvedPath
}
