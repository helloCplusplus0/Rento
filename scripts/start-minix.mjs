#!/usr/bin/env node

import fs from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(scriptDir, '..')
const distDir = path.join(projectDir, process.env.MINIX_DIST_DIR || 'dist')
const indexHtmlPath = path.join(distDir, 'index.html')

loadEnvConfig(projectDir, false)

if (!fs.existsSync(indexHtmlPath)) {
  console.error('缺少 `dist/index.html`，请先执行 `npm run build:minix`。')
  process.exit(1)
}

const serverPort = readPort(
  process.env.MINIX_SERVER_PORT || process.env.APP_INTERNAL_PORT || '3002'
)

const child = spawn(readNpxCommand(), ['tsx', 'server/index.ts'], {
  cwd: projectDir,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    APP_INTERNAL_PORT: process.env.APP_INTERNAL_PORT || serverPort,
    MINIX_SERVER_PORT: serverPort,
  },
  stdio: 'inherit',
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill(signal)
    }
  })
}

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

function readNpxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx'
}

function readPort(rawValue) {
  const port = Number.parseInt(rawValue, 10)

  if (!Number.isInteger(port) || port <= 0) {
    console.error(`Invalid minix port: ${rawValue}`)
    process.exit(1)
  }

  return String(port)
}
