import fs from 'fs/promises'
import path from 'path'

export interface ErrorLog {
  id: string
  timestamp: Date
  level: 'error' | 'warn' | 'info'
  message: string
  stack?: string
  context?: Record<string, any>
  userId?: string
  requestId?: string
}

export interface AlertConfig {
  enabled: boolean
  emailRecipients?: string[]
  webhookUrl?: string
  slackChannel?: string
}

/**
 * 错误追踪和日志记录系统
 * 提供结构化的文件日志和告警功能。
 * 当前阶段它保留为兼容型/辅助型日志能力，主错误日志入口是 error-logger。
 */
export class ErrorTracker {
  private logDir: string
  private alertConfig: AlertConfig

  constructor() {
    this.logDir = process.env.LOG_DIR || '/app/logs'
    this.alertConfig = {
      enabled: process.env.ENABLE_ALERTS === 'true',
      emailRecipients: process.env.ALERT_EMAIL?.split(','),
      webhookUrl: process.env.ALERT_WEBHOOK_URL,
      slackChannel: process.env.SLACK_ALERT_CHANNEL,
    }
  }

  /**
   * 记录错误日志
   */
  async logError(error: ErrorLog): Promise<void> {
    try {
      // 确保日志目录存在
      await fs.mkdir(this.logDir, { recursive: true })

      // 按日期和级别分文件
      const date = new Date().toISOString().split('T')[0]
      const logFile = path.join(this.logDir, `${error.level}-${date}.log`)

      // 格式化日志条目
      const logEntry =
        JSON.stringify({
          ...error,
          timestamp: error.timestamp.toISOString(),
          hostname: process.env.HOSTNAME || 'unknown',
          pid: process.pid,
        }) + '\n'

      // 追加到日志文件
      await fs.appendFile(logFile, logEntry)

      // 控制台输出（开发环境）
      if (process.env.NODE_ENV === 'development') {
        this.consoleLog(error)
      }

      // 严重错误发送告警
      if (error.level === 'error' && this.alertConfig.enabled) {
        await this.sendAlert(error)
      }
    } catch (logError) {
      console.error('❌ 日志记录失败:', logError)
      // 降级到控制台输出
      this.consoleLog(error)
    }
  }

  /**
   * 记录警告日志
   */
  async logWarning(
    message: string,
    context?: Record<string, any>
  ): Promise<void> {
    await this.logError({
      id: `warn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level: 'warn',
      message,
      context,
    })
  }

  /**
   * 记录信息日志
   */
  async logInfo(message: string, context?: Record<string, any>): Promise<void> {
    await this.logError({
      id: `info-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level: 'info',
      message,
      context,
    })
  }

  /**
   * 查询错误日志
   */
  async queryLogs(
    options: {
      level?: 'error' | 'warn' | 'info'
      startDate?: Date
      endDate?: Date
      limit?: number
    } = {}
  ): Promise<ErrorLog[]> {
    try {
      const { level, startDate, endDate, limit = 100 } = options
      const logs: ErrorLog[] = []

      // 获取日志文件列表
      const files = await fs.readdir(this.logDir)
      const logFiles = files.filter((file) => {
        if (level && !file.startsWith(`${level}-`)) return false
        if (file.endsWith('.log')) return true
        return false
      })

      // 按日期排序（最新的在前）
      logFiles.sort().reverse()

      // 读取日志文件
      for (const file of logFiles) {
        if (logs.length >= limit) break

        const filePath = path.join(this.logDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const lines = content
          .trim()
          .split('\n')
          .filter((line) => line)

        for (const line of lines.reverse()) {
          if (logs.length >= limit) break

          try {
            const log = JSON.parse(line) as ErrorLog
            log.timestamp = new Date(log.timestamp)

            // 日期过滤
            if (startDate && log.timestamp < startDate) continue
            if (endDate && log.timestamp > endDate) continue

            logs.push(log)
          } catch (parseError) {
            console.error('解析日志行失败:', parseError)
          }
        }
      }

      return logs.slice(0, limit)
    } catch (error) {
      console.error('查询日志失败:', error)
      return []
    }
  }

  /**
   * 获取错误统计
   */
  async getErrorStats(days: number = 7): Promise<{
    totalErrors: number
    totalWarnings: number
    totalInfo: number
    errorsByDay: Record<string, number>
    topErrors: Array<{ message: string; count: number }>
  }> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const logs = await this.queryLogs({ startDate, endDate, limit: 10000 })

    const stats = {
      totalErrors: 0,
      totalWarnings: 0,
      totalInfo: 0,
      errorsByDay: {} as Record<string, number>,
      topErrors: [] as Array<{ message: string; count: number }>,
    }

    const errorCounts = new Map<string, number>()

    for (const log of logs) {
      // 按级别统计
      if (log.level === 'error') stats.totalErrors++
      else if (log.level === 'warn') stats.totalWarnings++
      else if (log.level === 'info') stats.totalInfo++

      // 按日期统计
      const day = log.timestamp.toISOString().split('T')[0]
      stats.errorsByDay[day] = (stats.errorsByDay[day] || 0) + 1

      // 错误消息统计
      if (log.level === 'error') {
        const message = log.message.substring(0, 100) // 截取前100字符
        errorCounts.set(message, (errorCounts.get(message) || 0) + 1)
      }
    }

    // 获取top错误
    stats.topErrors = Array.from(errorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }))

    return stats
  }

  /**
   * 清理旧日志文件
   */
  async cleanupOldLogs(retentionDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      const files = await fs.readdir(this.logDir)
      const logFiles = files.filter((file) => file.endsWith('.log'))

      let deletedCount = 0

      for (const file of logFiles) {
        // 从文件名提取日期
        const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})\.log$/)
        if (dateMatch) {
          const fileDate = new Date(dateMatch[1])
          if (fileDate < cutoffDate) {
            const filePath = path.join(this.logDir, file)
            await fs.unlink(filePath)
            console.log(`🗑️  删除旧日志文件: ${file}`)
            deletedCount++
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ 清理完成，删除了 ${deletedCount} 个旧日志文件`)
      }

      return deletedCount
    } catch (error) {
      console.error('日志清理失败:', error)
      return 0
    }
  }

  /**
   * 发送告警通知
   */
  private async sendAlert(error: ErrorLog): Promise<void> {
    try {
      const alertMessage = this.formatAlertMessage(error)

      // 邮件告警
      if (this.alertConfig.emailRecipients?.length) {
        await this.sendEmailAlert(alertMessage, error)
      }

      // Webhook告警
      if (this.alertConfig.webhookUrl) {
        await this.sendWebhookAlert(alertMessage, error)
      }

      // Slack告警
      if (this.alertConfig.slackChannel) {
        await this.sendSlackAlert(alertMessage, error)
      }

      // 控制台告警（开发环境）
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 错误告警:', alertMessage)
      }
    } catch (alertError) {
      console.error('发送告警失败:', alertError)
    }
  }

  /**
   * 格式化告警消息
   */
  private formatAlertMessage(error: ErrorLog): string {
    return `
🚨 系统错误告警

时间: ${error.timestamp.toLocaleString()}
级别: ${error.level.toUpperCase()}
消息: ${error.message}
ID: ${error.id}
${error.userId ? `用户: ${error.userId}` : ''}
${error.requestId ? `请求: ${error.requestId}` : ''}
${error.context ? `上下文: ${JSON.stringify(error.context, null, 2)}` : ''}
${error.stack ? `堆栈: ${error.stack}` : ''}
    `.trim()
  }

  /**
   * 发送邮件告警
   */
  private async sendEmailAlert(
    message: string,
    error: ErrorLog
  ): Promise<void> {
    // 这里可以集成邮件服务，如SendGrid、AWS SES等
    console.log('📧 邮件告警 (未实现):', { message, error: error.id })
  }

  /**
   * 发送Webhook告警
   */
  private async sendWebhookAlert(
    message: string,
    error: ErrorLog
  ): Promise<void> {
    try {
      if (!this.alertConfig.webhookUrl) return

      const response = await fetch(this.alertConfig.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          error: error,
          timestamp: error.timestamp.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Webhook请求失败: ${response.status}`)
      }
    } catch (webhookError) {
      console.error('Webhook告警发送失败:', webhookError)
    }
  }

  /**
   * 发送Slack告警
   */
  private async sendSlackAlert(
    message: string,
    error: ErrorLog
  ): Promise<void> {
    // 这里可以集成Slack API
    console.log('💬 Slack告警 (未实现):', { message, error: error.id })
  }

  /**
   * 控制台日志输出
   */
  private consoleLog(error: ErrorLog): void {
    const emoji =
      error.level === 'error' ? '❌' : error.level === 'warn' ? '⚠️' : 'ℹ️'
    console.log(`${emoji} [${error.level.toUpperCase()}] ${error.message}`, {
      id: error.id,
      timestamp: error.timestamp.toISOString(),
      context: error.context,
      stack: error.stack,
    })
  }
}

// 导出单例实例
export const errorTracker = new ErrorTracker()
