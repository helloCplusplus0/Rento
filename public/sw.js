const CACHE_NAME = 'rento-pwa-shell-v1'
const OFFLINE_FALLBACK_URL = '/offline'
const PRECACHE_URLS = [
  OFFLINE_FALLBACK_URL,
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-192x192-maskable.png',
  '/icons/icon-512x512-maskable.png',
]
const STATIC_PATH_PREFIXES = ['/assets/', '/icons/']
const STATIC_EXACT_PATHS = new Set(['/favicon.ico'])
const NON_CACHEABLE_PATH_PREFIXES = ['/api/']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(PRECACHE_URLS)
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()

      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )

      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable()
      }

      await self.clients.claim()
    })()
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})

function isNavigationRequest(request) {
  if (request.mode === 'navigate') {
    return true
  }

  const accept = request.headers.get('accept') || ''
  return accept.includes('text/html')
}

function isExplicitlyNonCacheable(requestUrl, request) {
  if (NON_CACHEABLE_PATH_PREFIXES.some((prefix) => requestUrl.pathname.startsWith(prefix))) {
    return true
  }

  return false
}

function isCacheableStaticRequest(requestUrl, request) {
  if (PRECACHE_URLS.includes(requestUrl.pathname)) {
    return true
  }

  if (STATIC_EXACT_PATHS.has(requestUrl.pathname)) {
    return true
  }

  if (STATIC_PATH_PREFIXES.some((prefix) => requestUrl.pathname.startsWith(prefix))) {
    return true
  }

  return false
}

function canStoreResponse(response) {
  if (!response || response.status !== 200 || response.type === 'opaque') {
    return false
  }

  const cacheControl = response.headers.get('cache-control') || ''
  return !/no-store|private/i.test(cacheControl)
}

async function handleNavigationRequest(event) {
  try {
    const preloadResponse = await event.preloadResponse

    if (preloadResponse) {
      return preloadResponse
    }

    return await fetch(event.request)
  } catch {
    const cache = await caches.open(CACHE_NAME)
    return (
      (await cache.match(OFFLINE_FALLBACK_URL, { ignoreSearch: true })) ||
      Response.error()
    )
  }
}

async function handleStaticRequest(event, requestUrl) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(event.request, {
    ignoreSearch: requestUrl.pathname === OFFLINE_FALLBACK_URL,
  })

  const networkPromise = fetch(event.request).then((response) => {
    if (canStoreResponse(response)) {
      void cache.put(event.request, response.clone())
    }

    return response
  })

  if (cachedResponse) {
    event.waitUntil(networkPromise.catch(() => undefined))
    return cachedResponse
  }

  return networkPromise
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(request.url)

  if (requestUrl.origin !== self.location.origin) {
    return
  }

  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(event))
    return
  }

  if (isExplicitlyNonCacheable(requestUrl, request)) {
    return
  }

  if (!isCacheableStaticRequest(requestUrl, request)) {
    return
  }

  event.respondWith(handleStaticRequest(event, requestUrl))
})
