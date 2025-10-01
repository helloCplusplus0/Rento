/**
 * 自动告警管理系统
 * 提供智能的错误检测和通知功能
 */

import { ErrorLogger, ErrorSeverity, ErrorType } from './error-logger'
import { prisma } from './prisma'

/**
 * 告警严重程度枚举
 */
export enum AlertSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/**
 * 告警状态枚举
 */
export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  SUPPRESSED = 'SUPPRESSED',
}

/**
 * 告警规则接口
 */
export interface AlertRule {
  id: string
  name: string
  description: string
  severity: AlertSeverity
  condition: () => Promise<boolean>
  message: string
  cooldown: number // 冷却时间（毫秒）
  enabled: boolean
  lastTriggered?: Date
}

/**
 * 告警记录接口
 */
export interface Alert {
  id: string
  ruleId: string
  ruleName: string
  severity: AlertSeverity
  message: string
  status: AlertStatus
  timestamp: Date
  resolvedAt?: Date
  metadata?: Record<string, any>
}

/**
 * 告警管理器
 */
export class AlertManager {
  private static instance: AlertManager
  private alertRules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, Alert> = new Map()
  private logger = ErrorLogger.getInstance()
  private checkInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.initializeDefaultRules()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager()
    }
    return AlertManager.instance
  }

  /**
   * 启动告警监控
   */
  startMonitoring(intervalMs = 5 * 60 * 1000): void {
    // 默认5分钟检查一次
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(async () => {
      await this.checkAndTriggerAlerts()
    }, intervalMs)

    this.logger.logInfo('告警监控已启动', {
      module: 'alert-manager',
      interval: intervalMs,
      rulesCount: this.alertRules.size,
    })
  }

  /**
   * 停止告警监控
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    this.logger.logInfo('告警监控已停止', {
      module: 'alert-manager',
    })
  }

  /**
   * 注册告警规则
   */
  registerRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule)

    this.logger.logInfo(`注册告警规则: ${rule.name}`, {
      module: 'alert-manager',
      ruleId: rule.id,
      severity: rule.severity,
    })
  }

  /**
   * 检查并触发告警
   */
  async checkAndTriggerAlerts(): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue

      try {
        // 检查冷却时间
        if (
          rule.lastTriggered &&
          Date.now() - rule.lastTriggered.getTime() < rule.cooldown
        ) {
          continue
        }

        const shouldAlert = await rule.condition()

        if (shouldAlert) {
          await this.triggerAlert(rule)
        }
      } catch (error) {
        await this.logger.logError(
          ErrorType.SYSTEM_ERROR,
          ErrorSeverity.MEDIUM,
          `告警规则检查失败: ${rule.name}`,
          {
            module: 'alert-manager',
            ruleId: rule.id,
            ruleName: rule.name,
          },
          error instanceof Error ? error : undefined
        )
      }
    }
  }

  /**
   * 触发告警
   */
  private async triggerAlert(rule: AlertRule): Promise<void> {
    const alert: Alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: rule.message,
      status: AlertStatus.ACTIVE,
      timestamp: new Date(),
      metadata: await this.collectAlertMetadata(rule),
    }

    // 更新规则的最后触发时间
    rule.lastTriggered = new Date()

    // 存储活跃告警
    this.activeAlerts.set(alert.id, alert)

    // 发送通知
    await this.sendNotification(alert)

    // 记录告警
    await this.logAlert(alert)

    this.logger.logInfo(`触发告警: ${rule.name}`, {
      module: 'alert-manager',
      alertId: alert.id,
      severity: alert.severity,
    })
  }

  /**
   * 解决告警
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId)
    if (!alert) return

    alert.status = AlertStatus.RESOLVED
    alert.resolvedAt = new Date()

    this.activeAlerts.delete(alertId)

    this.logger.logInfo(`告警已解决: ${alert.ruleName}`, {
      module: 'alert-manager',
      alertId,
      duration: alert.resolvedAt.getTime() - alert.timestamp.getTime(),
    })
  }

  /**
   * 发送通知
   */
  private async sendNotification(alert: Alert): Promise<void> {
    try {
      // 控制台通知（开发环境）
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🚨 [${alert.severity}] ${alert.message}`)
      }

      // 这里可以扩展到其他通知方式：
      // - 邮件通知
      // - 短信通知
      // - Webhook通知
      // - 企业微信/钉钉通知

      // 示例：Webhook通知
      if (process.env.ALERT_WEBHOOK_URL) {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'alert',
            severity: alert.severity,
            message: alert.message,
            timestamp: alert.timestamp,
            metadata: alert.metadata,
          }),
        })
      }
    } catch (error) {
      await this.logger.logError(
        ErrorType.EXTERNAL_SERVICE,
        ErrorSeverity.MEDIUM,
        '告警通知发送失败',
        {
          module: 'alert-manager',
          alertId: alert.id,
        },
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * 记录告警
   */
  private async logAlert(alert: Alert): Promise<void> {
    await this.logger.logError(
      ErrorType.SYSTEM_ERROR,
      alert.severity === AlertSeverity.CRITICAL
        ? ErrorSeverity.CRITICAL
        : alert.severity === AlertSeverity.HIGH
          ? ErrorSeverity.HIGH
          : alert.severity === AlertSeverity.MEDIUM
            ? ErrorSeverity.MEDIUM
            : ErrorSeverity.LOW,
      `告警触发: ${alert.message}`,
      {
        module: 'alert-manager',
        alertId: alert.id,
        ruleId: alert.ruleId,
        ruleName: alert.ruleName,
        metadata: alert.metadata,
      }
    )
  }

  /**
   * 收集告警元数据
   */
  private async collectAlertMetadata(
    rule: AlertRule
  ): Promise<Record<string, any>> {
    try {
      const metadata: Record<string, any> = {
        ruleId: rule.id,
        ruleName: rule.name,
        timestamp: new Date().toISOString(),
      }

      // 根据规则类型收集相关数据
      if (rule.name.includes('error_rate')) {
        const errorStats = this.logger.getErrorStats()
        metadata.errorStats = errorStats
      }

      if (rule.name.includes('bill')) {
        const recentBills = await prisma.bill.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        })
        metadata.recentBillCount = recentBills
      }

      return metadata
    } catch (error) {
      return { error: 'Failed to collect metadata' }
    }
  }

  /**
   * 初始化默认告警规则
   */
  private initializeDefaultRules(): void {
    // 高错误率告警
    this.registerRule({
      id: 'high_error_rate',
      name: '高错误率告警',
      description: '系统错误率超过阈值',
      severity: AlertSeverity.HIGH,
      message: '系统错误率过高，可能影响正常使用',
      condition: async () => {
        const errorStats = this.logger.getErrorStats()
        const errorRate = errorStats.recent24h / Math.max(1, errorStats.total)
        return errorRate > 0.1 // 10%错误率
      },
      cooldown: 30 * 60 * 1000, // 30分钟冷却
      enabled: true,
    })

    // 账单生成异常告警
    this.registerRule({
      id: 'bill_generation_stuck',
      name: '账单生成异常',
      description: '账单生成系统可能出现问题',
      severity: AlertSeverity.CRITICAL,
      message: '账单生成系统可能卡住，请检查系统状态',
      condition: async () => {
        try {
          const lastBill = await prisma.bill.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          })

          if (!lastBill) return false

          const timeSinceLastBill = Date.now() - lastBill.createdAt.getTime()
          return timeSinceLastBill > 4 * 60 * 60 * 1000 // 4小时无账单生成
        } catch {
          return false
        }
      },
      cooldown: 60 * 60 * 1000, // 1小时冷却
      enabled: true,
    })

    // 数据一致性问题告警
    this.registerRule({
      id: 'data_consistency_issues',
      name: '数据一致性问题',
      description: '检测到数据一致性问题',
      severity: AlertSeverity.MEDIUM,
      message: '检测到数据一致性问题，建议进行数据修复',
      condition: async () => {
        try {
          // 检查账单明细缺失
          const billsWithoutDetails = await prisma.bill.count({
            where: {
              type: 'UTILITIES',
              billDetails: { none: {} },
            },
          })

          // 检查抄表状态不一致
          const inconsistentReadings = await prisma.meterReading.count({
            where: {
              OR: [
                { status: 'BILLED', isBilled: false },
                { status: 'PENDING', isBilled: true },
              ],
            },
          })

          return billsWithoutDetails + inconsistentReadings > 5
        } catch {
          return false
        }
      },
      cooldown: 15 * 60 * 1000, // 15分钟冷却
      enabled: true,
    })

    // 数据库性能告警
    this.registerRule({
      id: 'database_performance',
      name: '数据库性能告警',
      description: '数据库响应时间过长',
      severity: AlertSeverity.MEDIUM,
      message: '数据库响应时间过长，可能影响系统性能',
      condition: async () => {
        try {
          const startTime = Date.now()
          await prisma.bill.findFirst()
          const responseTime = Date.now() - startTime

          return responseTime > 2000 // 2秒响应时间
        } catch {
          return true // 查询失败也触发告警
        }
      },
      cooldown: 10 * 60 * 1000, // 10分钟冷却
      enabled: true,
    })
  }

  /**
   * 生成告警ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取活跃告警
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
  }

  /**
   * 获取告警统计
   */
  getAlertStats(): {
    totalRules: number
    enabledRules: number
    activeAlerts: number
    alertsBySeverity: Record<AlertSeverity, number>
  } {
    const enabledRules = Array.from(this.alertRules.values()).filter(
      (r) => r.enabled
    ).length
    const activeAlerts = Array.from(this.activeAlerts.values())

    const alertsBySeverity = Object.values(AlertSeverity).reduce(
      (acc, severity) => {
        acc[severity] = activeAlerts.filter(
          (a) => a.severity === severity
        ).length
        return acc
      },
      {} as Record<AlertSeverity, number>
    )

    return {
      totalRules: this.alertRules.size,
      enabledRules,
      activeAlerts: activeAlerts.length,
      alertsBySeverity,
    }
  }
}

/**
 * 全局告警管理器实例
 */
export const alertManager = AlertManager.getInstance()
