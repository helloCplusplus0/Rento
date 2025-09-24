/**
 * 格式化工具函数
 * 提供货币、日期等常用格式化功能
 */

/**
 * 格式化货币金额
 * @param amount 金额数值或字符串
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(num)) {
    return '¥0'
  }
  
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * 格式化日期
 * @param date 日期对象或字符串
 * @returns 格式化后的日期字符串 (YYYY-MM-DD)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) {
    return '--'
  }
  
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/**
 * 格式化日期时间
 * @param date 日期对象或字符串
 * @returns 格式化后的日期时间字符串 (YYYY-MM-DD HH:mm)
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) {
    return '--'
  }
  
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * 格式化相对时间
 * @param date 日期对象或字符串
 * @returns 相对时间字符串 (如: 3天前, 2小时后)
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) {
    return '--'
  }
  
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '明天'
  } else if (diffDays === -1) {
    return '昨天'
  } else if (diffDays > 0) {
    return `${diffDays}天后`
  } else {
    return `${Math.abs(diffDays)}天前`
  }
}

/**
 * 计算逾期天数
 * @param dueDate 到期日期
 * @returns 逾期天数 (正数表示逾期，负数表示未到期)
 */
export function calculateOverdueDays(dueDate: Date | string): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  
  if (isNaN(due.getTime())) {
    return 0
  }
  
  const now = new Date()
  const diffMs = now.getTime() - due.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * 格式化房间号
 * @param buildingName 楼栋名称
 * @param roomNumber 房间号
 * @returns 格式化后的房间标识
 */
export function formatRoomId(buildingName: string, roomNumber: string): string {
  return `${buildingName}-${roomNumber}`
}

/**
 * 格式化百分比
 * @param value 数值
 * @param total 总数
 * @returns 百分比字符串
 */
export function formatPercentage(value: number, total: number): string {
  if (total === 0) {
    return '0%'
  }
  
  const percentage = (value / total) * 100
  return `${percentage.toFixed(1)}%`
}