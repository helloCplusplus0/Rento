#!/usr/bin/env node

import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(scriptDir, '..')

loadEnvConfig(projectDir, true)

// `dev:minix` is intentionally a local development-only topology:
// `tsx watch` serves the Hono runtime, and Vite serves the frontend shell.
// It is not a production or deployment entry.
const serverPort = readPort(
  process.env.MINIX_SERVER_PORT || process.env.APP_INTERNAL_PORT || '3002'
)
const webPort = readPort(process.env.MINIX_WEB_PORT || '5173')

const sharedEnv = {
  ...process.env,
  NODE_ENV: 'development',
  APP_INTERNAL_PORT: process.env.APP_INTERNAL_PORT || serverPort,
  MINIX_SERVER_PORT: serverPort,
  MINIX_WEB_PORT: webPort,
}

console.log('Rento-miniX development topology')
console.log(`- frontend: http://localhost:${webPort}`)
console.log(`- backend:  http://localhost:${serverPort}`)
console.log('- api proxy: /api -> Hono runtime')

const serverProcess = spawn(readNpxCommand(), ['tsx', 'watch', 'server/index.ts'], {
  cwd: projectDir,
  env: sharedEnv,
  stdio: 'inherit',
})

const viteProcess = spawn(
  readNpxCommand(),
  ['vite', '--host', '0.0.0.0', '--port', webPort, '--clearScreen', 'false'],
  {
    cwd: projectDir,
    env: sharedEnv,
    stdio: 'inherit',
  }
)

pipeTermination(serverProcess, viteProcess)
pipeTermination(viteProcess, serverProcess)

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!serverProcess.killed) {
      serverProcess.kill(signal)
    }
    if (!viteProcess.killed) {
      viteProcess.kill(signal)
    }
  })
}

function pipeTermination(current, sibling) {
  current.on('exit', (code, signal) => {
    if (!sibling.killed) {
      sibling.kill(signal || 'SIGTERM')
    }

    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 0)
  })
}

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
