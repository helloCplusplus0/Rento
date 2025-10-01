import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface BackupOptions {
  compress?: boolean
  includeSchema?: boolean
  excludeTables?: string[]
}

export interface BackupInfo {
  filename: string
  filepath: string
  size: number
  createdAt: Date
  compressed: boolean
}

/**
 * 数据备份和恢复管理器
 * 支持PostgreSQL数据库的自动备份、恢复和管理
 */
export class BackupManager {
  private backupDir: string
  private dbUrl: string
  private maxRetentionDays: number

  constructor() {
    this.backupDir = process.env.BACKUP_DIR || '/app/backups'
    this.dbUrl = process.env.DATABASE_URL!
    this.maxRetentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '7')

    if (!this.dbUrl) {
      throw new Error('DATABASE_URL环境变量未设置')
    }
  }

  /**
   * 创建数据库备份
   */
  async createBackup(options: BackupOptions = {}): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const baseFilename = `backup-${timestamp}`
    const extension = options.compress ? '.sql.gz' : '.sql'
    const filename = `${baseFilename}${extension}`
    const filepath = path.join(this.backupDir, filename)

    try {
      // 确保备份目录存在
      await fs.mkdir(this.backupDir, { recursive: true })

      // 构建pg_dump命令
      let command = `pg_dump "${this.dbUrl}"`

      // 添加选项
      if (options.includeSchema !== false) {
        command += ' --schema-only --data-only'
      }

      if (options.excludeTables && options.excludeTables.length > 0) {
        for (const table of options.excludeTables) {
          command += ` --exclude-table=${table}`
        }
      }

      // 添加压缩
      if (options.compress) {
        command += ` | gzip > "${filepath}"`
      } else {
        command += ` > "${filepath}"`
      }

      console.log(`开始创建数据库备份: ${filename}`)
      await execAsync(command)

      // 获取文件信息
      const stats = await fs.stat(filepath)

      const backupInfo: BackupInfo = {
        filename,
        filepath,
        size: stats.size,
        createdAt: new Date(),
        compressed: options.compress || false,
      }

      console.log(
        `✅ 备份创建成功: ${filename} (${this.formatFileSize(stats.size)})`
      )
      return backupInfo
    } catch (error) {
      console.error('❌ 备份创建失败:', error)
      throw new Error(
        `备份创建失败: ${error instanceof Error ? error.message : '未知错误'}`
      )
    }
  }

  /**
   * 恢复数据库
   */
  async restoreBackup(backupPath: string): Promise<void> {
    try {
      // 检查备份文件是否存在
      await fs.access(backupPath)

      const isCompressed = backupPath.endsWith('.gz')
      let command: string

      if (isCompressed) {
        command = `gunzip -c "${backupPath}" | psql "${this.dbUrl}"`
      } else {
        command = `psql "${this.dbUrl}" < "${backupPath}"`
      }

      console.log(`开始恢复数据库: ${path.basename(backupPath)}`)
      await execAsync(command)

      console.log(`✅ 数据库恢复成功: ${path.basename(backupPath)}`)
    } catch (error) {
      console.error('❌ 数据库恢复失败:', error)
      throw new Error(
        `数据库恢复失败: ${error instanceof Error ? error.message : '未知错误'}`
      )
    }
  }

  /**
   * 列出所有备份文件
   */
  async listBackups(): Promise<BackupInfo[]> {
    try {
      const files = await fs.readdir(this.backupDir)
      const backupFiles = files.filter(
        (file) =>
          file.startsWith('backup-') &&
          (file.endsWith('.sql') || file.endsWith('.sql.gz'))
      )

      const backups: BackupInfo[] = []

      for (const filename of backupFiles) {
        const filepath = path.join(this.backupDir, filename)
        const stats = await fs.stat(filepath)

        backups.push({
          filename,
          filepath,
          size: stats.size,
          createdAt: stats.mtime,
          compressed: filename.endsWith('.gz'),
        })
      }

      // 按创建时间倒序排列
      return backups.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )
    } catch (error) {
      console.error('获取备份列表失败:', error)
      return []
    }
  }

  /**
   * 清理旧备份文件
   */
  async cleanupOldBackups(retentionDays?: number): Promise<number> {
    const days = retentionDays || this.maxRetentionDays
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    try {
      const backups = await this.listBackups()
      const oldBackups = backups.filter(
        (backup) => backup.createdAt < cutoffDate
      )

      let deletedCount = 0
      for (const backup of oldBackups) {
        try {
          await fs.unlink(backup.filepath)
          console.log(`🗑️  删除旧备份: ${backup.filename}`)
          deletedCount++
        } catch (error) {
          console.error(`删除备份文件失败: ${backup.filename}`, error)
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ 清理完成，删除了 ${deletedCount} 个旧备份文件`)
      } else {
        console.log('📋 没有需要清理的旧备份文件')
      }

      return deletedCount
    } catch (error) {
      console.error('备份清理失败:', error)
      return 0
    }
  }

  /**
   * 验证备份文件完整性
   */
  async verifyBackup(backupPath: string): Promise<boolean> {
    try {
      const isCompressed = backupPath.endsWith('.gz')
      let command: string

      if (isCompressed) {
        // 验证gzip文件完整性
        command = `gunzip -t "${backupPath}"`
      } else {
        // 验证SQL文件语法
        command = `psql "${this.dbUrl}" --set ON_ERROR_STOP=1 --single-transaction --dry-run < "${backupPath}"`
      }

      await execAsync(command)
      console.log(`✅ 备份文件验证通过: ${path.basename(backupPath)}`)
      return true
    } catch (error) {
      console.error(`❌ 备份文件验证失败: ${path.basename(backupPath)}`, error)
      return false
    }
  }

  /**
   * 获取备份统计信息
   */
  async getBackupStats(): Promise<{
    totalBackups: number
    totalSize: number
    oldestBackup?: Date
    newestBackup?: Date
  }> {
    const backups = await this.listBackups()

    if (backups.length === 0) {
      return { totalBackups: 0, totalSize: 0 }
    }

    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0)
    const dates = backups.map((b) => b.createdAt)

    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup: new Date(Math.min(...dates.map((d) => d.getTime()))),
      newestBackup: new Date(Math.max(...dates.map((d) => d.getTime()))),
    }
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
export const backupManager = new BackupManager()
