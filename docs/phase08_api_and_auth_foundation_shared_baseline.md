# Phase08 Api And Auth Foundation Shared Baseline

## 一、文档目的
本文档用于冻结 `phase08-api-and-auth-foundation` 全部子任务共享的边界、允许路线、禁止路线与统一判断标准，避免后续 `phase08` 子任务各自扩写出不同解释。

## 二、共享前提
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- `phase06-minix-replatform` 已完成当前轮文档治理收口
- `phase07-app-shell-and-runtime-foundation` 已完成新应用壳、新运行时入口、旧运行线映射与退出条件冻结
- 当前完整 `Hono` 版 Phase 路线图已冻结到根级 `plan.md`
- 当前仓库逻辑主线已切换为 `Rento-miniX`
- 当前旧实现代码仍是后续原地重构的直接参考基线

## 三、共享判断标准
- 默认优先冻结新的 API/Auth 宿主与最小安全边界，而不是先迁移高风险领域服务
- 默认优先保持页面门禁与 API 门禁一致，而不是先做前端体验扩写
- 默认优先继续承接当前自定义 Cookie Session 语义，而不是重做身份体系
- 默认优先低复杂度、单仓库、单主线、单一真相源
- 默认优先把 `server/` 作为统一 API/Auth 宿主固定下来，再进入后续领域接口迁移
- 默认继续把 `Prisma + PostgreSQL` 主线保住，不在本阶段引入 ORM 再决策

## 四、允许路线
- 允许继续在 `server/` 中冻结统一 `/api` 宿主
- 允许承接并适配 `src/lib/auth/session.ts`、`src/lib/auth/password.ts`、`src/lib/auth/guard.ts`
- 允许承接并适配 `src/lib/api-error-handler.ts` 中的请求治理策略
- 允许承接并适配 `src/middleware.ts` 中的公开页面/API 白名单与最小门禁矩阵
- 允许迁入最小认证接口：
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/session`
- 允许继续用 `GET /api/health` 作为唯一主健康入口
- 允许在 `src/minix/` 中建立最小登录守卫与登录回跳边界
- 允许在文档中写清旧 `Next.js` 宿主的并行保留边界与退出条件

## 五、禁止路线
- 禁止在 `phase08` 中直接迁移合同、账单、房源、租客、仪表、抄表等正式业务 API
- 禁止在 `phase08` 中直接迁移治理/辅助接口，例如 `validation`、`data-consistency`、细分健康检查等
- 禁止在 `phase08` 中切换最终部署主线
- 禁止在 `phase08` 中切换 ORM 或重写数据模型
- 禁止以“认证迁移”为由引入用户表、刷新令牌、完整 RBAC 或审计体系
- 禁止让 `src/minix` 在本阶段扩写为完整领域页面迁移承载层
- 禁止让 `server/` 与旧 `src/app/api/*` 同时继续争夺新增 API/Auth 默认宿主职责

## 六、统一方案语义
- 新统一 API/Auth 宿主固定为：`server/`
- 新服务端运行时固定为：`Hono + @hono/node-server`
- 当前认证模型固定为：单管理员 + 签名 Cookie Session
- 当前最小公开 API 白名单固定为：
  - `/api/health`
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/session`
- 当前页面公开路径固定为：
  - `/login`
  - `/offline`
- 当前环境变量口径固定为：
  - `AUTH_SESSION_SECRET` 是正式主变量
  - `NEXTAUTH_SECRET` 仅为历史兼容回退
- 当前前端门禁切入方式固定为：`src/minix` 最小登录守卫
- 当前数据访问主线继续固定为：`Prisma + PostgreSQL`

## 七、服务端承接口径
- `phase08` 服务端只承接：
  - 统一 `/api` 宿主
  - 最小认证路由
  - 会话提取与认证守卫
  - 请求约束与统一错误处理骨架
  - `GET /api/health`
  - 最小环境变量读取层
- `phase08` 服务端不承接：
  - 正式业务 API
  - 治理/辅助接口迁移
  - 最终生产部署切线
  - 数据访问层定案

## 八、前端承接口径
- `phase08` 前端只承接：
  - 登录页真实提交流程
  - 最小登录态探测
  - 未登录跳转 `/login?next=...`
  - 已登录访问 `/login` 自动回跳
- `phase08` 前端不承接：
  - 正式业务页面逻辑迁移
  - 完整页面数据加载迁移
  - 角色扩展框架
  - 领域页面权限细分

## 九、旧运行线映射口径
- `src/app` 与 `src/app/api/*` 在 `phase08` 期间仍是参考基线和存量运行线
- `src/middleware.ts` 在 `phase08` 期间仍是旧页面和旧 API 的实际门禁入口
- `scripts/dev-entry.mjs` 与 `scripts/start-entry.mjs` 在 `phase08` 期间仍服务于旧宿主
- 新 API/Auth 宿主只负责建立正式承接位，不在本阶段强制替换全部旧接口和旧页面入口

### 9.1 旧 `src/app/api/*` 保留边界
- 旧 `src/app/api/*` 在 `phase08` 期间继续承担：
  - 存量业务 API
  - 治理/辅助接口
  - 未迁移接口的兼容宿主职责
- 旧 `src/app/api/*` 在 `phase08` 期间不再默认承担：
  - 新 API/Auth 骨架
  - 新认证中间件骨架
  - 新请求治理与统一错误出口的长期承接位

### 9.2 旧 `src/middleware.ts` 保留边界
- `src/middleware.ts` 继续服务于旧页面与旧 API 的门禁
- `src/middleware.ts` 继续承担新前端守卫与新 Hono 门禁矩阵的参考输入职责
- 在新前端壳与新 API/Auth 宿主通过一致性验证前，不允许直接停用旧中间件

### 9.3 并行关系
- 开发态并行：`src/minix/ + server/` 验证新前端壳与新 API/Auth 骨架；旧 `Next.js` 运行线保留为现状行为对照
- 验证态并行：新宿主验证最小登录闭环、请求治理与 `/api/health`；旧宿主验证未迁移业务 API 与回滚可行性
- 存量运行线并行：在正式业务 API 与部署主线切换前，旧宿主继续承担当前可运行宿主职责；新宿主只冻结正式承接方向

### 9.4 退出条件
- 旧 API/Auth 宿主退出前，必须至少满足：
  - 新 Hono 宿主已稳定承接最小认证骨架
  - 新旧公开路由矩阵与门禁语义一致
  - 未迁移业务接口仍有明确兼容去向
- 旧页面门禁退出前，必须至少满足：
  - `src/minix` 已稳定承接最小登录守卫
  - 登录回跳与 API 会话探测路径稳定
  - 回滚路径明确

## 十、统一验证要求
- 至少确认：
  - 根级文档已切换到 `phase08` 规划口径
  - `phase08` 三份阶段文档已完整产出
  - 统一 API 宿主、最小公开 API 白名单、认证会话、错误处理与环境变量兼容口径已统一冻结
  - `src/minix` 最小页面守卫边界已明确
  - 旧宿主、新宿主与后续阶段的关系已明确
  - 旧 API/Auth 宿主与旧页面门禁的退出条件已可执行

## 十一、阶段停顿门禁
- `phase08` 阶段文档一旦产出完成，必须停止并等待审核
- 未经审核，不得直接进入 `phase08` 的 `/spec` 或实现
- 后续任何 `phase08` 子任务都不得绕开本共享基线重新定义 API/Auth 宿主边界、公开 API 白名单或页面门禁范围
