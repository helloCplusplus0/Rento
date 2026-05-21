#!/usr/bin/env node

import { spawn } from 'node:child_process'
import nextEnv from '@next/env'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const { loadEnvConfig } = nextEnv

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(scriptDir, '..')
const isValidateOnly = process.argv.includes('--validate-only')

// Reuse Next.js env loading so the wrapper and the dev server read the same .env* precedence.
loadEnvConfig(projectDir, true)

const validation = await validateDevRuntime()

if (!validation.ok) {
  printValidationFailure(validation.errors, validation.warnings)
  process.exit(1)
}

printValidationSuccess(validation.warnings, validation.summary)

if (isValidateOnly) {
  process.exit(0)
}

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['next', 'dev', '--port', validation.summary.port],
  {
    cwd: projectDir,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: validation.summary.port,
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

async function validateDevRuntime() {
  const errors = []
  const warnings = []

  const port = readPort()
  const devOrigin = `http://localhost:${port}`
  const sessionSecret =
    readOptionalEnv('AUTH_SESSION_SECRET') || readOptionalEnv('NEXTAUTH_SECRET')
  const databaseUrl = readOptionalEnv('DATABASE_URL')
  const adminPasswordHash = readOptionalEnv('ADMIN_PASSWORD_HASH')
  const adminUsername = readOptionalEnv('ADMIN_USERNAME') || 'admin'
  const nextAuthUrl = readOptionalEnv('NEXTAUTH_URL')
  const allowedOrigins = readOptionalEnv('ALLOWED_ORIGINS')
  const redisUrl = readOptionalEnv('REDIS_URL')

  if (!sessionSecret) {
    errors.push(
      '缺少会话签名密钥：请至少配置 `AUTH_SESSION_SECRET`，如需兼容也可仅配置 `NEXTAUTH_SECRET`。'
    )
  } else if (!readOptionalEnv('AUTH_SESSION_SECRET')) {
    warnings.push(
      '当前仅检测到 `NEXTAUTH_SECRET`。建议补齐 `AUTH_SESSION_SECRET`，避免继续依赖历史兼容回退。'
    )
  }

  if (!databaseUrl) {
    errors.push('缺少数据库连接：请配置 `DATABASE_URL`。')
  } else if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    errors.push(
      '`DATABASE_URL` 必须指向 PostgreSQL，当前开发入口不接受 SQLite 或其他数据库协议。'
    )
  } else {
    const databaseHost = readHostname(databaseUrl)
    if (databaseHost === 'postgres') {
      errors.push(
        '当前开发入口运行在宿主机，请将 `DATABASE_URL` 指向宿主机可访问地址（如 `127.0.0.1`），并把容器内连接写入 `CONTAINER_DATABASE_URL`。'
      )
    } else {
      await verifyDatabaseConnection(databaseUrl, errors)
    }
  }

  if (!adminPasswordHash) {
    errors.push('缺少管理员密码哈希：请配置 `ADMIN_PASSWORD_HASH`。')
  } else if (!/^scrypt:[^:]+:[^:]+$/.test(adminPasswordHash)) {
    errors.push(
      '`ADMIN_PASSWORD_HASH` 格式无效，必须为 `scrypt:<salt>:<hash>`。'
    )
  }

  if (!nextAuthUrl) {
    warnings.push(
      `建议配置 \`NEXTAUTH_URL=${devOrigin}\`，避免浏览器登录和回调地址口径漂移。`
    )
  } else if (nextAuthUrl !== devOrigin) {
    warnings.push(
      `当前 \`NEXTAUTH_URL=${nextAuthUrl}\`，若本机开发仍走 ${devOrigin}，请确认是否为有意使用局域网地址。`
    )
  }

  if (!allowedOrigins) {
    warnings.push(
      `建议配置 \`ALLOWED_ORIGINS=${devOrigin}\`，保持本地浏览器与 API 来源白名单一致。`
    )
  } else if (
    !allowedOrigins
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .includes(devOrigin)
  ) {
    warnings.push(
      `\`ALLOWED_ORIGINS\` 未包含 ${devOrigin}。若本机浏览器访问开发服务，请补齐该来源。`
    )
  }

  if (!redisUrl) {
    warnings.push(
      '当前未配置 `REDIS_URL`。现有开发入口不会因此阻止启动，但若后续接入缓存依赖，应同步补齐。'
    )
  } else {
    const redisHost = readHostname(redisUrl)
    if (redisHost === 'redis') {
      warnings.push(
        '当前 `REDIS_URL` 指向容器服务名 `redis`。若宿主机开发需要直接访问缓存，请改为 `127.0.0.1` 并把容器内连接写入 `CONTAINER_REDIS_URL`。'
      )
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      adminUsername,
      devOrigin,
      port,
      sessionSecretSource: readOptionalEnv('AUTH_SESSION_SECRET')
        ? 'AUTH_SESSION_SECRET'
        : 'NEXTAUTH_SECRET',
    },
  }
}

async function verifyDatabaseConnection(databaseUrl, errors) {
  let prisma

  try {
    const { PrismaClient } = await import('@prisma/client')
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })
    await prisma.$queryRawUnsafe('SELECT 1')
  } catch (error) {
    const message = error instanceof Error ? summarizeError(error.message) : '未知错误'
    errors.push(`\`DATABASE_URL\` 连接校验失败：${message}`)
  } finally {
    if (prisma) {
      await prisma.$disconnect().catch(() => {})
    }
  }
}

function summarizeError(message) {
  return message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-2)
    .join(' ')
}

function readPort() {
  const rawPort =
    readOptionalEnv('APP_INTERNAL_PORT') || readOptionalEnv('PORT') || '3001'
  const port = Number.parseInt(rawPort, 10)

  if (!Number.isInteger(port) || port <= 0) {
    console.error(
      `开发入口配置错误：\`APP_INTERNAL_PORT\` / \`PORT\` 必须是有效正整数，当前值为 ${rawPort}。`
    )
    process.exit(1)
  }

  return String(port)
}

function readOptionalEnv(name) {
  const value = process.env[name]
  return typeof value === 'string' ? value.trim() : ''
}

function readHostname(rawUrl) {
  try {
    return new URL(rawUrl).hostname
  } catch {
    return ''
  }
}

function printValidationFailure(errors, warnings) {
  console.error('开发态运行入口校验失败，已阻止 `next dev` 启动。')

  for (const error of errors) {
    console.error(`- ${error}`)
  }

  if (warnings.length > 0) {
    console.error('')
    console.error('附加提示：')

    for (const warning of warnings) {
      console.error(`- ${warning}`)
    }
  }
}

function printValidationSuccess(warnings, summary) {
  console.log('开发态运行上下文校验通过。')
  console.log(`- 启动端口: ${summary.port}`)
  console.log(`- 本机开发地址: ${summary.devOrigin}`)
  console.log(`- 管理员账号: ${summary.adminUsername}`)
  console.log(`- 会话密钥来源: ${summary.sessionSecretSource}`)

  if (warnings.length > 0) {
    console.log('- 非阻断提示:')

    for (const warning of warnings) {
      console.log(`  - ${warning}`)
    }
  }

  if (isValidateOnly) {
    console.log('已完成校验，未启动开发服务器。')
  } else {
    console.log('即将启动 `next dev`。')
  }
}
