#!/usr/bin/env node

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(scriptDir, '..')
const distDir = path.join(projectDir, '.next')
const standaloneDir = path.join(distDir, 'standalone')
const standaloneServerPath = path.join(standaloneDir, 'server.js')

if (!isLegacyStartApproved()) {
  printLegacyStartNotice()
  process.exit(1)
}

const validation = validateProductionArtifacts(distDir)

if (!validation.ok) {
  printFailure(validation.errors)
  process.exit(1)
}

const port = readPort()

if (fs.existsSync(standaloneServerPath)) {
  prepareStandaloneRuntime({
    projectDir,
    distDir,
    standaloneDir,
  })
}

const child = spawn(
  readNodeCommand(),
  createStartCommandArgs({
    port,
    projectDir,
    standaloneServerPath,
  }),
  {
    cwd: projectDir,
    env: {
      ...process.env,
      PORT: port,
      HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
    },
    stdio: 'inherit',
  }
)

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

function validateProductionArtifacts(nextDir) {
  const errors = []

  if (!fs.existsSync(nextDir)) {
    errors.push('缺少 `.next/` 目录。请先执行 `npm run build`。')
    return { ok: false, errors }
  }

  const buildIdPath = path.join(nextDir, 'BUILD_ID')
  if (!fs.existsSync(buildIdPath)) {
    errors.push(
      '缺少 `.next/BUILD_ID`，当前不是完整的生产构建产物。请先执行 `npm run build`，再运行 `npm run start`。'
    )
  }

  const staticDir = path.join(nextDir, 'static')
  const staticFiles = listFiles(staticDir)
  const hashedStaticFiles = staticFiles.filter((filePath) =>
    /\/(?:chunks|css)\/.+-[a-f0-9]{8,}\./.test(filePath.replace(/\\/g, '/'))
  )

  if (hashedStaticFiles.length === 0) {
    errors.push(
      '未检测到 `.next/static/` 下的生产静态资源。当前产物看起来更像开发态残留或不完整构建，不能直接用于 `next start`。'
    )
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}

function prepareStandaloneRuntime({ projectDir, distDir, standaloneDir }) {
  // Next.js standalone 运行时要求把 public 和 .next/static 带到 standalone 目录旁边。
  syncDirectory(path.join(projectDir, 'public'), path.join(standaloneDir, 'public'))
  syncDirectory(
    path.join(distDir, 'static'),
    path.join(standaloneDir, '.next', 'static')
  )
}

function syncDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return
  }

  fs.mkdirSync(path.dirname(targetDir), { recursive: true })
  fs.cpSync(sourceDir, targetDir, {
    recursive: true,
    force: true,
  })
}

function createStartCommandArgs({ port, projectDir, standaloneServerPath }) {
  if (fs.existsSync(standaloneServerPath)) {
    return [standaloneServerPath]
  }

  return [
    path.join(projectDir, 'node_modules', 'next', 'dist', 'bin', 'next'),
    'start',
    '--port',
    port,
  ]
}

function readNodeCommand() {
  return process.execPath
}

function listFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return []
  }

  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      return listFiles(fullPath)
    }

    if (entry.isFile()) {
      return [fullPath]
    }

    return []
  })
}

function printFailure(errors) {
  console.error('生产启动前校验失败，已阻止 `next start` 启动。')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  console.error('')
  console.error('建议顺序：')
  console.error('1. 如需继续验证 phase15/phase16 正式链路，请改用 `npm run build:minix` 或 `npm run build:minix:pwa`')
  console.error('2. 然后执行 `npm run start:minix` 与 `bash ./scripts/pwa-smoke-check.sh --profile ...`')
  console.error('3. `npm run start` 仅保留给 legacy 对照/回滚基线，不再作为 phase15 正式 PWA 验证入口')
}

function isLegacyStartApproved() {
  return process.env.LEGACY_START === '1'
}

function printLegacyStartNotice() {
  console.error('`npm run start` 已降级为 legacy 对照/回滚基线入口，默认不再直接启动。')
  console.error('如需继续验证 phase15/phase16 正式链路，请改用：')
  console.error('1. `npm run build:minix` 或 `npm run build:minix:pwa`')
  console.error('2. `npm run start:minix`')
  console.error('3. `bash ./scripts/pwa-smoke-check.sh --profile ...`')
  console.error('')
  console.error('只有在明确验证 legacy 对照/回滚基线时，才使用 `LEGACY_START=1 npm run start`。')
}

function readPort() {
  const rawPort = process.env.APP_INTERNAL_PORT || process.env.PORT || '3001'
  const parsedPort = Number.parseInt(rawPort, 10)

  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    console.error(
      `生产启动入口配置错误：\`APP_INTERNAL_PORT\` / \`PORT\` 必须是有效正整数，当前值为 ${rawPort}。`
    )
    process.exit(1)
  }

  return String(parsedPort)
}
