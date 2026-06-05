import path from 'node:path'

const DEFAULT_DIST_DIR = 'dist'
const DEFAULT_HOST = '0.0.0.0'
const DEFAULT_PORT = '3002'
const DEFAULT_RUNTIME_NAME = 'rento-minix-runtime'
const DEFAULT_WEB_PORT = '5173'

export interface MinixServerEnv {
  distDir: string
  host: string
  isProduction: boolean
  nodeEnv: string
  port: number
  runtimeName: string
  webPort: number
}

export function getMinixServerEnv(): MinixServerEnv {
  const nodeEnv = process.env.NODE_ENV || 'development'

  return {
    distDir: path.resolve(process.cwd(), process.env.MINIX_DIST_DIR || DEFAULT_DIST_DIR),
    host: readHost(process.env.MINIX_SERVER_HOST || DEFAULT_HOST),
    isProduction: nodeEnv === 'production',
    nodeEnv,
    port: readPort(
      process.env.MINIX_SERVER_PORT || process.env.APP_INTERNAL_PORT || DEFAULT_PORT,
      'MINIX_SERVER_PORT / APP_INTERNAL_PORT'
    ),
    runtimeName: DEFAULT_RUNTIME_NAME,
    webPort: readPort(process.env.MINIX_WEB_PORT || DEFAULT_WEB_PORT, 'MINIX_WEB_PORT'),
  }
}

function readHost(rawHost: string): string {
  const host = rawHost.trim()

  if (host.length === 0) {
    throw new Error('MINIX_SERVER_HOST must not be empty.')
  }

  return host
}

function readPort(rawPort: string, label: string): number {
  const port = Number.parseInt(rawPort, 10)

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`${label} must be a positive integer, received: ${rawPort}`)
  }

  return port
}
