import { Hono } from 'hono'

import type { AuthAppEnv } from '../lib/auth-context'
import type { MinixServerEnv } from '../lib/env'

import { createBillRoutes } from './bills'
import { createBuildingRoutes } from './buildings'
import { createCheckoutRoutes } from './checkout'
import { createContractRoutes } from './contracts'
import { createDashboardRoutes } from './dashboard'
import { createMeterRoutes } from './meters'
import { createMeterReadingRoutes } from './meter-readings'
import { createRenterRoutes } from './renters'
import { createRoomRoutes } from './rooms'
import { createUtilityReadingRoutes } from './utility-readings'

export function createDomainRoutes(env: MinixServerEnv) {
  const domainRoutes = new Hono<AuthAppEnv>()

  // 先在子应用内部挂完整领域骨架，再由 server/app.ts 一次性挂到 /api。
  // Hono 路由树要求“先组装子路由，再挂父应用”，避免父应用过早挂接导致缺失子路径。
  // 更窄的 checkout 子路径需要先于 /contracts 挂接，避免被更宽泛的 contracts 路由骨架提前吞掉。
  // dashboard 查询在 phase13 仍是 retained-legacy bridge，但首页已经切到
  // 统一 /api 宿主，所以需要在 Hono 树内保留最小承接位，避免落入 501 兜底。
  domainRoutes.route('/dashboard', createDashboardRoutes(env))
  domainRoutes.route('/contracts/:contractId/checkout', createCheckoutRoutes(env))
  domainRoutes.route('/contracts', createContractRoutes(env))
  domainRoutes.route('/bills', createBillRoutes(env))
  domainRoutes.route('/buildings', createBuildingRoutes(env))
  domainRoutes.route('/meters', createMeterRoutes(env))
  domainRoutes.route('/meter-readings', createMeterReadingRoutes(env))
  domainRoutes.route('/renters', createRenterRoutes(env))
  domainRoutes.route('/rooms', createRoomRoutes(env))
  domainRoutes.route('/utility-readings', createUtilityReadingRoutes(env))

  return domainRoutes
}
