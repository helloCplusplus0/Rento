import path from 'node:path'

export interface MinixServerEnv {
  distDir: string
  host: string
  port: number
}

export function getMinixServerEnv(): MinixServerEnv {
  return {
    distDir: path.resolve(process.cwd(), process.env.MINIX_DIST_DIR || 'dist'),
    host: process.env.MINIX_SERVER_HOST || '0.0.0.0',
    port: readPort(
      process.env.MINIX_SERVER_PORT || process.env.APP_INTERNAL_PORT || '3002'
    ),
  }
}

function readPort(rawPort: string): number {
  const port = Number.parseInt(rawPort, 10)

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(
      `MINIX_SERVER_PORT / APP_INTERNAL_PORT must be a positive integer, received: ${rawPort}`
    )
  }

  return port
}
