import { NextResponse } from 'next/server'

import { globalSettings } from '@/lib/global-settings'

/**
 * 设置初始化API
 * POST /api/settings/init - 初始化默认设置
 */

export async function POST() {
  try {
    console.log('[设置初始化] 开始初始化默认设置')

    await globalSettings.initializeDefaultSettings()

    // 返回初始化后的设置
    const settings = await globalSettings.getAllSettings()

    return NextResponse.json({
      success: true,
      data: settings,
      message: '默认设置初始化完成',
    })
  } catch (error) {
    console.error('[设置初始化] 初始化失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
