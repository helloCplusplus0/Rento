import { globalSettings } from '@/lib/global-settings'
import { revalidateMutationPaths } from '@/lib/mutation-revalidation'

import type { AuthAppEnv } from '../lib/auth-context'
import { readJsonBody, jsonSuccess } from '../lib/api-responses'
import { validationError } from '../lib/api-errors'
import type { MinixServerEnv } from '../lib/env'
import { requireAuth } from '../middleware/require-auth'
import { Hono } from 'hono'

interface UpdateSettingsRequestBody {
  settings?: Record<string, unknown>
}

/**
 * phase13-02 当前页面首屏仍依赖旧 settings 读模型；
 * 在正式 settings 领域宿主完成前，先以最小读写兼容承接设置页首屏与基础治理动作。
 */
export function createSettingsRoutes(env: MinixServerEnv) {
  const routeApp = new Hono<AuthAppEnv>()

  routeApp.use('*', requireAuth())

  routeApp.get('/', async (c) => {
    const settings = await globalSettings.getAllSettings()

    return jsonSuccess(c, {
      data: settings,
      env,
    })
  })

  routeApp.post('/', async (c) => {
    const body = await readJsonBody<UpdateSettingsRequestBody>(c, {
      maxBytes: env.requestGovernance.maxRequestSize,
    })
    const settings = body?.settings

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      throw validationError('无效的设置数据')
    }

    await globalSettings.updateSettings(settings)
    await revalidateMutationPaths({
      scopes: ['dashboard', 'settings', 'contracts', 'bills', 'meters'],
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    return jsonSuccess(c, {
      data: await globalSettings.getAllSettings(),
      message: `成功更新 ${Object.keys(settings).length} 个设置`,
      env,
    })
  })

  routeApp.delete('/', async (c) => {
    await globalSettings.resetToDefaults()
    await revalidateMutationPaths({
      scopes: ['dashboard', 'settings', 'contracts', 'bills', 'meters'],
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    return jsonSuccess(c, {
      data: await globalSettings.getAllSettings(),
      message: '设置已重置为默认值',
      env,
    })
  })

  routeApp.post('/init', async (c) => {
    await globalSettings.initializeDefaultSettings()
    await revalidateMutationPaths({
      scopes: ['dashboard', 'settings', 'contracts', 'bills', 'meters'],
      executionRuntime: 'hono-runtime',
      runtimeName: env.runtimeName,
    })

    return jsonSuccess(c, {
      data: await globalSettings.getAllSettings(),
      message: '默认设置初始化完成',
      env,
    })
  })

  return routeApp
}
