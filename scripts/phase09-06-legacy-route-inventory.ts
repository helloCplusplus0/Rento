import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  PHASE09_06_LEGACY_ROUTE_INVENTORY,
  PHASE09_06_LEGACY_ROUTE_PHASE10_INPUT,
  flattenLegacyRouteInventory,
  summarizeLegacyRouteInventory,
  type Phase10InputBucket,
} from '../server/lib/legacy-route-inventory'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const legacyApiRoot = path.join(projectRoot, 'src', 'app', 'api')

async function main() {
  const scannedRouteFiles = await collectRouteFiles(legacyApiRoot)
  const inventoryFiles = PHASE09_06_LEGACY_ROUTE_INVENTORY.map((entry) => entry.filePath)
  const inventoryFileSet = new Set(inventoryFiles)
  const scannedFileSet = new Set(scannedRouteFiles)
  const flattenedOperations = flattenLegacyRouteInventory()
  const summary = summarizeLegacyRouteInventory()

  const missingFromInventory = scannedRouteFiles.filter(
    (filePath) => !inventoryFileSet.has(filePath)
  )
  const inventoryWithoutFile = inventoryFiles.filter(
    (filePath) => !scannedFileSet.has(filePath)
  )
  const duplicateInventoryFiles = findDuplicates(inventoryFiles)

  const unresolvedFormalHosts = await resolveMissingProjectPaths(
    flattenedOperations.flatMap((item) => item.formalHosts)
  )
  const unresolvedDomainServices = await resolveMissingProjectPaths(
    flattenedOperations.flatMap((item) => item.domainServicePaths)
  )

  printHeader('phase09-06 旧路由兼容与退出清单校验')
  console.log(`项目根目录: ${projectRoot}`)
  console.log(`扫描旧路由文件: ${scannedRouteFiles.length}`)
  console.log(`清单覆盖文件: ${summary.files}`)
  console.log(`清单操作条目: ${summary.operations}`)
  console.log('')

  printHeader('分类统计')
  console.log(`formal-host-owned: ${summary.categories['formal-host-owned']}`)
  console.log(`compat-wrapper: ${summary.categories['compat-wrapper']}`)
  console.log(`retained-legacy: ${summary.categories['retained-legacy']}`)
  console.log('')

  printHeader('phase10 输入统计')
  console.log(`exit-evaluation: ${summary.phase10['exit-evaluation']}`)
  console.log(`keep-compat: ${summary.phase10['keep-compat']}`)
  console.log(`defer-unmigrated: ${summary.phase10['defer-unmigrated']}`)
  console.log('')

  printBucket(
    '可继续退出评估',
    PHASE09_06_LEGACY_ROUTE_PHASE10_INPUT.exitEvaluation,
    'exit-evaluation'
  )
  printBucket(
    '必须继续保留 compat',
    PHASE09_06_LEGACY_ROUTE_PHASE10_INPUT.keepCompat,
    'keep-compat'
  )
  printBucket(
    '仍未迁移且留待后续阶段',
    PHASE09_06_LEGACY_ROUTE_PHASE10_INPUT.deferUnmigrated,
    'defer-unmigrated'
  )

  const problems = [
    ...formatProblemLines('缺少清单覆盖的旧路由文件', missingFromInventory),
    ...formatProblemLines('清单引用但文件不存在', inventoryWithoutFile),
    ...formatProblemLines('清单存在重复文件定义', duplicateInventoryFiles),
    ...formatProblemLines('formalHosts 引用不存在', unresolvedFormalHosts),
    ...formatProblemLines('domainServicePaths 引用不存在', unresolvedDomainServices),
  ]

  if (problems.length > 0) {
    printHeader('校验失败')
    for (const line of problems) {
      console.error(`- ${line}`)
    }

    process.exitCode = 1
    return
  }

  printHeader('校验通过')
  console.log('- 清单已覆盖全部 src/app/api 旧路由文件')
  console.log('- formalHosts 与 domainServicePaths 引用均可解析')
  console.log('- phase10 输入分桶已可直接复核与复用')
}

async function collectRouteFiles(directory: string): Promise<string[]> {
  const dirEntries = await fs.readdir(directory, { withFileTypes: true })
  const routeFiles: string[] = []

  for (const dirEntry of dirEntries) {
    const absolutePath = path.join(directory, dirEntry.name)

    if (dirEntry.isDirectory()) {
      routeFiles.push(...(await collectRouteFiles(absolutePath)))
      continue
    }

    if (dirEntry.isFile() && dirEntry.name === 'route.ts') {
      routeFiles.push(toProjectRelativePath(absolutePath))
    }
  }

  return routeFiles.sort()
}

function toProjectRelativePath(targetPath: string) {
  return path.relative(projectRoot, targetPath).replaceAll(path.sep, '/')
}

function findDuplicates(items: string[]) {
  const counts = new Map<string, number>()

  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1)
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([item]) => item)
}

async function resolveMissingProjectPaths(items: string[]) {
  const uniqueItems = Array.from(new Set(items))
  const missing: string[] = []

  for (const item of uniqueItems) {
    const absolutePath = path.join(projectRoot, ...item.split('/'))
    const exists = await fileExists(absolutePath)
    if (!exists) {
      missing.push(item)
    }
  }

  return missing
}

async function fileExists(targetPath: string) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

function printBucket(
  title: string,
  items: ReturnType<typeof flattenLegacyRouteInventory>,
  bucket: Phase10InputBucket
) {
  printHeader(title)

  if (items.length === 0) {
    console.log(`- ${bucket}: 0`)
    console.log('')
    return
  }

  for (const item of items) {
    console.log(
      `- [${item.methods.join(',')}] ${item.routePath} -> ${item.category} (${item.filePath})`
    )
  }
  console.log('')
}

function formatProblemLines(title: string, items: string[]) {
  if (items.length === 0) {
    return []
  }

  return items.map((item) => `${title}: ${item}`)
}

function printHeader(title: string) {
  console.log(`== ${title} ==`)
}

main().catch((error) => {
  console.error('phase09-06 legacy route inventory script failed')
  console.error(error)
  process.exitCode = 1
})
