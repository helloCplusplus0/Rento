import { NextRequest, NextResponse } from 'next/server'
import { globalSettings } from '@/lib/global-settings'
import { 
  withApiErrorHandler, 
  createSuccessResponse,
  parseRequestBody,
  validateRequired
} from '@/lib/api-error-handler'
import { ErrorType } from '@/lib/error-logger'

/**
 * 全局设置API
 * GET /api/settings - 获取所有设置
 * POST /api/settings - 更新设置
 * DELETE /api/settings - 重置设置
 */

/**
 * 获取所有设置
 */
async function handleGetSettings() {
  console.log('[设置API] 获取所有设置')
  
  const settings = await globalSettings.getAllSettings()
  
  return createSuccessResponse(settings)
}

export const GET = withApiErrorHandler(handleGetSettings, {
  module: 'settings-api',
  errorType: ErrorType.SYSTEM_ERROR
})

/**
 * 更新设置
 */
async function handlePostSettings(request: NextRequest) {
  const body = await parseRequestBody(request)
  const { settings: newSettings } = body
  
  if (!newSettings || typeof newSettings !== 'object') {
    throw new Error('无效的设置数据')
  }
  
  console.log('[设置API] 更新设置:', Object.keys(newSettings))
  
  await globalSettings.updateSettings(newSettings)
  
  // 返回更新后的所有设置
  const updatedSettings = await globalSettings.getAllSettings()
  
  return createSuccessResponse(updatedSettings, `成功更新 ${Object.keys(newSettings).length} 个设置`)
}

export const POST = withApiErrorHandler(handlePostSettings, {
  module: 'settings-api',
  errorType: ErrorType.SYSTEM_ERROR
})

/**
 * 重置设置为默认值
 */
async function handleDeleteSettings() {
  console.log('[设置API] 重置设置为默认值')
  
  await globalSettings.resetToDefaults()
  
  // 返回重置后的设置
  const defaultSettings = await globalSettings.getAllSettings()
  
  return createSuccessResponse(defaultSettings, '设置已重置为默认值')
}

export const DELETE = withApiErrorHandler(handleDeleteSettings, {
  module: 'settings-api',
  errorType: ErrorType.SYSTEM_ERROR
})