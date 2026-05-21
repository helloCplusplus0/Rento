const { performance } = require('perf_hooks')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * 性能基准测试工具
 */
class BenchmarkTool {
  constructor() {
    this.results = []
    this.baseUrl =
      process.env.NEXTAUTH_URL ||
      `http://localhost:${process.env.APP_PORT || process.env.APP_INTERNAL_PORT || '3001'}`
  }

  /**
   * 数据库查询性能测试
   */
  async benchmarkDatabaseQueries() {
    console.log('🔍 开始数据库性能测试...')

    // 测试基础查询
    await this.benchmarkOperation('房间列表查询', async () => {
      const rooms = await prisma.room.findMany({
        include: {
          building: true,
          contracts: {
            include: {
              renter: true,
            },
          },
        },
      })
      return rooms.length
    })

    // 测试复杂聚合查询
    await this.benchmarkOperation('账单统计查询', async () => {
      const stats = await prisma.bill.groupBy({
        by: ['status'],
        _count: true,
        _sum: {
          amount: true,
        },
      })
      return stats.length
    })

    // 测试深度关联查询
    await this.benchmarkOperation('深度关联查询', async () => {
      const contracts = await prisma.contract.findMany({
        where: {
          status: 'ACTIVE',
        },
        include: {
          room: {
            include: {
              building: true,
            },
          },
          renter: true,
          bills: {
            where: {
              status: 'PENDING',
            },
          },
        },
      })
      return contracts.length
    })

    // 测试分页查询
    await this.benchmarkOperation('分页查询测试', async () => {
      const bills = await prisma.bill.findMany({
        take: 20,
        skip: 0,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          contract: {
            include: {
              room: true,
              renter: true,
            },
          },
        },
      })
      return bills.length
    })

    // 测试搜索查询
    await this.benchmarkOperation('模糊搜索查询', async () => {
      const renters = await prisma.renter.findMany({
        where: {
          OR: [
            { name: { contains: '张' } },
            { phone: { contains: '138' } },
            { idCard: { contains: '1234' } },
          ],
        },
        include: {
          contracts: {
            include: {
              room: true,
            },
          },
        },
      })
      return renters.length
    })
  }

  /**
   * API端点性能测试
   */
  async benchmarkAPIEndpoints() {
    console.log('🌐 开始API性能测试...')

    const endpoints = [
      { path: '/api/health', method: 'GET', name: '健康检查' },
      { path: '/api/rooms', method: 'GET', name: '房间列表' },
      { path: '/api/contracts', method: 'GET', name: '合同列表' },
      { path: '/api/bills', method: 'GET', name: '账单列表' },
      { path: '/api/dashboard/stats', method: 'GET', name: '仪表板统计' },
      { path: '/api/renters', method: 'GET', name: '租客列表' },
    ]

    for (const endpoint of endpoints) {
      await this.benchmarkOperation(`API ${endpoint.name}`, async () => {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint.path}`, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            throw new Error(
              `API请求失败: ${response.status} ${response.statusText}`
            )
          }

          const data = await response.json()
          return Array.isArray(data) ? data.length : 1
        } catch (error) {
          console.warn(`API测试失败 ${endpoint.path}:`, error.message)
          return 0
        }
      })
    }
  }

  /**
   * 并发性能测试
   */
  async benchmarkConcurrency() {
    console.log('⚡ 开始并发性能测试...')

    const concurrencyLevels = [1, 5, 10]

    for (const concurrency of concurrencyLevels) {
      await this.benchmarkOperation(`并发查询 (${concurrency}个)`, async () => {
        const promises = Array(concurrency)
          .fill(null)
          .map(() =>
            prisma.room.findMany({
              include: {
                building: true,
                contracts: true,
              },
            })
          )

        const results = await Promise.all(promises)
        return results.reduce((total, rooms) => total + rooms.length, 0)
      })
    }
  }

  /**
   * 执行基准测试操作
   */
  async benchmarkOperation(name, operation) {
    const iterations = 3 // 减少迭代次数
    const durations = []
    const memoryDeltas = []

    for (let i = 0; i < iterations; i++) {
      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc()
      }

      const memoryBefore = process.memoryUsage()
      const start = performance.now()

      const recordsProcessed = await operation()

      const duration = performance.now() - start
      const memoryAfter = process.memoryUsage()
      const memoryDelta = memoryAfter.heapUsed - memoryBefore.heapUsed

      durations.push(duration)
      memoryDeltas.push(memoryDelta)

      // 短暂延迟
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const avgMemoryDelta =
      memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length
    const throughput = 1000 / avgDuration // 每秒操作数

    const result = {
      operation: name,
      duration: Math.round(avgDuration * 100) / 100,
      recordsProcessed: 0,
      throughput: Math.round(throughput * 100) / 100,
      memoryUsage: {
        delta: Math.round((avgMemoryDelta / 1024 / 1024) * 100) / 100, // MB
      },
    }

    this.results.push(result)
    console.log(
      `✅ ${name}: ${result.duration}ms (${result.throughput} ops/sec, ${result.memoryUsage.delta}MB)`
    )
  }

  /**
   * 生成性能报告
   */
  generateReport() {
    if (this.results.length === 0) {
      throw new Error('没有基准测试结果')
    }

    console.log('\n📊 性能基准测试报告')
    console.log('='.repeat(60))

    // 基本统计
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)
    const averageDuration = totalDuration / this.results.length

    // 找出最慢和最快的操作
    const slowestOperation = this.results.reduce((prev, curr) =>
      prev.duration > curr.duration ? prev : curr
    )
    const fastestOperation = this.results.reduce((prev, curr) =>
      prev.duration < curr.duration ? prev : curr
    )

    console.log(`总操作数: ${this.results.length}`)
    console.log(`总耗时: ${Math.round(totalDuration)}ms`)
    console.log(`平均耗时: ${Math.round(averageDuration)}ms`)
    console.log(
      `最慢操作: ${slowestOperation.operation} (${slowestOperation.duration}ms)`
    )
    console.log(
      `最快操作: ${fastestOperation.operation} (${fastestOperation.duration}ms)`
    )
    console.log('')

    console.log('📈 性能排行:')
    this.results
      .sort((a, b) => a.duration - b.duration)
      .forEach((result, index) => {
        const emoji =
          index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  '
        console.log(
          `${emoji} ${result.operation}: ${result.duration}ms (${result.throughput} ops/sec)`
        )
      })

    console.log('')
    console.log('💾 内存使用排行:')
    this.results
      .sort((a, b) => a.memoryUsage.delta - b.memoryUsage.delta)
      .forEach((result, index) => {
        const emoji =
          index === 0 ? '🟢' : result.memoryUsage.delta > 10 ? '🔴' : '🟡'
        console.log(
          `${emoji} ${result.operation}: ${result.memoryUsage.delta}MB`
        )
      })

    // 性能警告
    console.log('')
    console.log('⚠️  性能警告:')
    const slowOperations = this.results.filter((r) => r.duration > 1000)
    const memoryHeavyOperations = this.results.filter(
      (r) => r.memoryUsage.delta > 50
    )

    if (slowOperations.length > 0) {
      console.log('慢操作 (>1000ms):')
      slowOperations.forEach((op) => {
        console.log(`  - ${op.operation}: ${op.duration}ms`)
      })
    }

    if (memoryHeavyOperations.length > 0) {
      console.log('高内存操作 (>50MB):')
      memoryHeavyOperations.forEach((op) => {
        console.log(`  - ${op.operation}: ${op.memoryUsage.delta}MB`)
      })
    }

    if (slowOperations.length === 0 && memoryHeavyOperations.length === 0) {
      console.log('✅ 所有操作性能良好')
    }

    return {
      totalOperations: this.results.length,
      totalDuration,
      averageDuration,
      slowestOperation,
      fastestOperation,
    }
  }
}

/**
 * 运行完整的基准测试套件
 */
async function runFullBenchmark() {
  const benchmark = new BenchmarkTool()

  try {
    console.log('🚀 开始性能基准测试套件')
    console.log('时间:', new Date().toLocaleString())
    console.log('')

    // 数据库性能测试
    await benchmark.benchmarkDatabaseQueries()
    console.log('')

    // API性能测试
    await benchmark.benchmarkAPIEndpoints()
    console.log('')

    // 并发性能测试
    await benchmark.benchmarkConcurrency()
    console.log('')

    // 生成报告
    const summary = benchmark.generateReport()

    console.log('')
    console.log('🎉 基准测试完成!')

    return summary
  } catch (error) {
    console.error('❌ 基准测试失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runFullBenchmark()
}

module.exports = { BenchmarkTool, runFullBenchmark }
