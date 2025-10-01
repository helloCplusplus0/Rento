import { backupManager, BackupOptions } from './backup-manager'
import { errorTracker } from './error-tracker'

export interface ScheduleConfig {
  enabled: boolean
  cronExpression: string
  backupOptions: BackupOptions
  retentionDays: number
  alertOnFailure: boolean
}

/**
 * 备份调度器
 * 负责定时执行数据库备份任务
 */
export class BackupScheduler {
  private schedules: Map<string, NodeJS.Timeout> = new Map()
  private isRunning = false

  /**
   * 启动备份调度器
   */
  start(configs: Record<string, ScheduleConfig> = {}): void {
    if (this.isRunning) {
      console.log('⚠️  备份调度器已在运行')
      return
    }

    // 默认配置
    const defaultConfigs: Record<string, ScheduleConfig> = {
      daily: {
        enabled: true,
        cronExpression: '0 2 * * *', // 每日凌晨2点
        backupOptions: { compress: true, includeSchema: true },
        retentionDays: 7,
        alertOnFailure: true,
      },
      weekly: {
        enabled: true,
        cronExpression: '0 3 * * 0', // 每周日凌晨3点
        backupOptions: { compress: true, includeSchema: true },
        retentionDays: 30,
        alertOnFailure: true,
      },
    }

    // 合并配置
    const finalConfigs = { ...defaultConfigs, ...configs }

    // 启动各个调度任务
    for (const [name, config] of Object.entries(finalConfigs)) {
      if (config.enabled) {
        this.scheduleBackup(name, config)
      }
    }

    this.isRunning = true
    console.log('🚀 备份调度器已启动')
  }

  /**
   * 停止备份调度器
   */
  stop(): void {
    for (const [name, timeout] of this.schedules) {
      clearTimeout(timeout)
      console.log(`⏹️  停止备份调度: ${name}`)
    }

    this.schedules.clear()
    this.isRunning = false
    console.log('🛑 备份调度器已停止')
  }

  /**
   * 手动执行备份
   */
  async executeBackup(
    name: string,
    options: BackupOptions = {}
  ): Promise<boolean> {
    try {
      console.log(`🔄 开始执行手动备份: ${name}`)

      const backupInfo = await backupManager.createBackup(options)

      console.log(`✅ 手动备份完成: ${name}`, {
        filename: backupInfo.filename,
        size: this.formatFileSize(backupInfo.size),
      })

      return true
    } catch (error) {
      console.error(`❌ 手动备份失败: ${name}`, error)

      await errorTracker.logError({
        id: `backup-manual-${Date.now()}`,
        timestamp: new Date(),
        level: 'error',
        message: `手动备份失败: ${name}`,
        stack: error instanceof Error ? error.stack : undefined,
        context: { backupName: name, options },
      })

      return false
    }
  }

  /**
   * 获取调度状态
   */
  getStatus(): {
    isRunning: boolean
    activeSchedules: string[]
    nextExecutions: Record<string, Date>
  } {
    return {
      isRunning: this.isRunning,
      activeSchedules: Array.from(this.schedules.keys()),
      nextExecutions: {}, // 简化实现，实际可以计算下次执行时间
    }
  }

  /**
   * 调度单个备份任务
   */
  private scheduleBackup(name: string, config: ScheduleConfig): void {
    // 解析cron表达式并计算下次执行时间
    const nextExecution = this.parseNextExecution(config.cronExpression)
    const delay = nextExecution.getTime() - Date.now()

    if (delay <= 0) {
      // 如果计算出的时间已过，则立即执行并重新调度
      this.executeScheduledBackup(name, config)
      return
    }

    const timeout = setTimeout(() => {
      this.executeScheduledBackup(name, config)
    }, delay)

    this.schedules.set(name, timeout)

    console.log(
      `📅 备份调度已设置: ${name} (下次执行: ${nextExecution.toLocaleString()})`
    )
  }

  /**
   * 执行调度的备份任务
   */
  private async executeScheduledBackup(
    name: string,
    config: ScheduleConfig
  ): Promise<void> {
    try {
      console.log(`🔄 开始执行定时备份: ${name}`)

      // 执行备份
      const backupInfo = await backupManager.createBackup(config.backupOptions)

      // 清理旧备份
      const deletedCount = await backupManager.cleanupOldBackups(
        config.retentionDays
      )

      console.log(`✅ 定时备份完成: ${name}`, {
        filename: backupInfo.filename,
        size: this.formatFileSize(backupInfo.size),
        deletedOldBackups: deletedCount,
      })

      // 重新调度下次执行
      this.scheduleBackup(name, config)
    } catch (error) {
      console.error(`❌ 定时备份失败: ${name}`, error)

      // 记录错误日志
      await errorTracker.logError({
        id: `backup-scheduled-${Date.now()}`,
        timestamp: new Date(),
        level: 'error',
        message: `定时备份失败: ${name}`,
        stack: error instanceof Error ? error.stack : undefined,
        context: {
          backupName: name,
          config,
          cronExpression: config.cronExpression,
        },
      })

      // 发送告警（如果启用）
      if (config.alertOnFailure) {
        await this.sendBackupAlert(name, error)
      }

      // 重新调度（即使失败也要继续调度）
      this.scheduleBackup(name, config)
    }
  }

  /**
   * 解析cron表达式，计算下次执行时间
   * 简化实现，仅支持基本格式
   */
  private parseNextExecution(cronExpression: string): Date {
    // 简化的cron解析，实际项目中建议使用专业的cron库
    const parts = cronExpression.split(' ')
    if (parts.length !== 5) {
      throw new Error(`无效的cron表达式: ${cronExpression}`)
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
    const now = new Date()
    const next = new Date(now)

    // 简单实现：设置到明天的指定时间
    if (minute !== '*') next.setMinutes(parseInt(minute))
    if (hour !== '*') next.setHours(parseInt(hour))

    // 如果时间已过，则设置到明天
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }

    return next
  }

  /**
   * 发送备份告警
   */
  private async sendBackupAlert(
    backupName: string,
    error: unknown
  ): Promise<void> {
    // 这里可以集成邮件、Slack、钉钉等通知服务
    console.error(`🚨 备份告警: ${backupName}`, {
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString(),
    })

    // 可以扩展为实际的通知服务
    // 例如：发送邮件、调用Webhook等
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }
}

// 导出单例实例
export const backupScheduler = new BackupScheduler()

// 在生产环境自动启动
if (process.env.NODE_ENV === 'production') {
  // 延迟启动，确保应用完全初始化
  setTimeout(() => {
    backupScheduler.start()
  }, 5000)
}
