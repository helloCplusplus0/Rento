import path from 'node:path'

import { API_BASE_PATH, getPublicApiPaths } from './api-contract'

const DEFAULT_DIST_DIR = 'dist'
const DEFAULT_HOST = '0.0.0.0'
const DEFAULT_PORT = '3002'
const DEFAULT_RUNTIME_NAME = 'rento-minix-runtime'
const DEFAULT_WEB_PORT = '5173'
const DEFAULT_MAX_REQUEST_SIZE = '10485760'
const DEFAULT_REQUEST_TIMEOUT = '30000'

type SessionSecretSource = 'AUTH_SESSION_SECRET' | 'NEXTAUTH_SECRET'

export interface SessionSecretConfig {
  configured: boolean
  source: SessionSecretSource
}

export interface ApiContractConfig {
  basePath: typeof API_BASE_PATH
  protectedByDefault: true
  publicPaths: string[]
}

export interface RequestGovernanceConfig {
  allowedOrigins: string[]
  corsEnabled: boolean
  maxRequestSize: number
  timeoutMs: number
}

export interface MinixServerEnv {
  api: ApiContractConfig
  distDir: string
  host: string
  isProduction: boolean
  nodeEnv: string
  port: number
  requestGovernance: RequestGovernanceConfig
  runtimeName: string
  sessionSecret: SessionSecretConfig
  webPort: number
}

export function getMinixServerEnv(): MinixServerEnv {
  const nodeEnv = process.env.NODE_ENV || 'development'

  return {
    api: {
      basePath: API_BASE_PATH,
      protectedByDefault: true,
      publicPaths: getPublicApiPaths(),
    },
    distDir: path.resolve(process.cwd(), process.env.MINIX_DIST_DIR || DEFAULT_DIST_DIR),
    host: readHost(process.env.MINIX_SERVER_HOST || DEFAULT_HOST),
    isProduction: nodeEnv === 'production',
    nodeEnv,
    port: readPort(
      process.env.MINIX_SERVER_PORT || process.env.APP_INTERNAL_PORT || DEFAULT_PORT,
      'MINIX_SERVER_PORT / APP_INTERNAL_PORT'
    ),
    requestGovernance: {
      allowedOrigins: readAllowedOrigins(process.env.ALLOWED_ORIGINS || ''),
      corsEnabled: readBoolean(process.env.CORS_ENABLED || 'true', 'CORS_ENABLED'),
      maxRequestSize: readPort(
        process.env.MAX_REQUEST_SIZE || DEFAULT_MAX_REQUEST_SIZE,
        'MAX_REQUEST_SIZE'
      ),
      timeoutMs: readNonNegativeInteger(
        process.env.REQUEST_TIMEOUT || DEFAULT_REQUEST_TIMEOUT,
        'REQUEST_TIMEOUT'
      ),
    },
    runtimeName: DEFAULT_RUNTIME_NAME,
    sessionSecret: readSessionSecretConfig(),
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

function readNonNegativeInteger(rawValue: string, label: string): number {
  const value = Number.parseInt(rawValue, 10)

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer, received: ${rawValue}`)
  }

  return value
}

function readBoolean(rawValue: string, label: string): boolean {
  const normalized = rawValue.trim().toLowerCase()

  if (normalized === 'true') {
    return true
  }

  if (normalized === 'false') {
    return false
  }

  throw new Error(`${label} must be "true" or "false", received: ${rawValue}`)
}

function readAllowedOrigins(rawOrigins: string) {
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function readSessionSecretConfig(): SessionSecretConfig {
  const authSessionSecret = process.env.AUTH_SESSION_SECRET?.trim()
  if (authSessionSecret) {
    return {
      configured: true,
      source: 'AUTH_SESSION_SECRET',
    }
  }

  const legacySessionSecret = process.env.NEXTAUTH_SECRET?.trim()
  if (legacySessionSecret) {
    return {
      configured: true,
      source: 'NEXTAUTH_SECRET',
    }
  }

  throw new Error(
    'Missing session secret. Configure AUTH_SESSION_SECRET first, or keep NEXTAUTH_SECRET only as a legacy fallback.'
  )
}
