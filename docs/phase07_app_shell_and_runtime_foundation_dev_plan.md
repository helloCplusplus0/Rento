# Phase07 App Shell And Runtime Foundation 开发规划

## 一、文档定位
本文档用于把 `phase07-app-shell-and-runtime-foundation` 拆分为顺序执行的子任务，确保当前仓库先完成新应用壳与新运行时基础承接位，再进入 API、认证和领域服务迁移。

## 二、总体推进结论
`phase07` 的执行顺序固定为：

```text
先建立 Hono + Vite + React Router 的基础工作区
    ->
再承接前端应用壳与路由骨架
    ->
再建立运行时入口、基础中间件与健康检查
    ->
最后写清旧运行线映射与退出条件
```

原因如下：

- 若不先建立基础工作区，后续所有迁移都会继续绑定旧 `Next.js` 宿主
- 若不先承接应用壳与路由骨架，后续页面迁移就没有统一前端承载位
- 若不先建立 Hono 运行时入口与健康检查，后续 API/认证迁移会继续依赖旧 API 宿主
- 若不先写清旧运行线映射与退出条件，后续阶段容易反复摇摆于“并行多久”和“何时正式切换”

## 三、任务拆分建议
## phase07-01-runtime-workspace-foundation
### 目标
建立 `Hono + Vite + React Router` 的基础工作区、目录结构、依赖清单与运行脚本，为后续应用壳与运行时承接提供正式落点。

### 范围
- 新建前端壳目录：`src/minix/`
- 新建运行时目录：`server/`
- 新建 `vite.config.ts` 与 `index.html`
- 在 `package.json` 中补充 `dev:minix`、`build:minix`、`start:minix`
- 固定开发态双服务代理的运行方式
- 固定 `@/*` 路径别名与 TypeScript 基线

### 不在范围内
- 不迁移业务页面逻辑
- 不迁移正式业务 API
- 不切换最终部署主线

### DoD
- 新前端壳与新运行时已有正式目录落点
- 新脚本已可表达开发态与构建态入口
- 不再需要继续把后续新主线文件塞回 `src/app` 或 `src/app/api/*`

## phase07-02-frontend-app-shell-migration
### 目标
承接 `Rento-miniX` 的前端应用壳、路由骨架、导航壳与基础页面占位，使新主线具备统一前端宿主。

### 范围
- 迁移或适配 `AppLayout`
- 迁移或适配 `UnifiedNavigation`
- 建立 `React Router` 路由骨架
- 承接主导航五个正式业务路径的基础壳
- 补齐 `login`、`offline`、`404`、`error`、`loading` 的基础承接位
- 继续沿用现有 UI 样式、图标与信息架构

### 不在范围内
- 不迁移全量业务页面逻辑
- 不迁移完整查询和写操作
- 不重做 UI 设计语言

### DoD
- 新前端壳已有统一布局、导航和路由骨架
- 主要路径已在 `React Router` 中具备正式承接位
- 现有 UI 展示风格与信息架构未被重写

## phase07-03-runtime-entry-and-health-check-foundation
### 目标
建立 `Hono` 运行时入口、基础中间件、最小错误处理与 `/api/health` 承接位，使新主线具备正式服务端入口。

### 范围
- 建立 `server/index.ts` 与 `server/app.ts`
- 建立基础中间件链
- 承接 `/api/health`
- 建立最小错误处理骨架
- 建立最小环境变量读取层
- 明确静态资源或前端壳托管预留位

### 不在范围内
- 不迁移正式业务 API
- 不迁移完整认证 API
- 不切换部署主线

### DoD
- 新服务端运行时已有 Node 入口
- `/api/health` 已有 Hono 承接位
- 后续 API/认证阶段不再需要继续依附旧 `src/app/api/*` 才能启动

## phase07-04-legacy-runtime-mapping-and-exit-conditions
### 目标
明确旧 `Next.js` 宿主在 `phase07` 完成后的保留边界、映射关系与退出条件，避免后续阶段再次出现双宿主职责漂移。

### 范围
- 明确旧 `src/app` 在 `phase07` 结束后仍保留哪些职责
- 明确旧 `src/app/api/*` 在 `phase08` 前仍保留哪些职责
- 明确旧 `scripts/dev-entry.mjs` 与 `scripts/start-entry.mjs` 在 `phase07` 结束后仍保留哪些职责
- 明确新前端壳、新运行时与旧运行线的并行关系
- 明确何时允许切走旧前端壳、旧 API 宿主与旧启动脚本
- 明确后续 `phase08`、`phase09` 的直接输入清单

### 重点输出
- 旧 `src/app` 的保留边界、禁止扩写口径与未迁移页面兼容职责
- 旧 `src/app/api/*` 的保留边界、禁止扩写口径与 `phase08` 前兼容职责
- 旧 `scripts/dev-entry.mjs`、`scripts/start-entry.mjs` 的保留边界、回滚职责与退出前提
- 新旧运行线在开发态、验证态与存量运行线中的并行关系
- `phase08-api-and-auth-foundation` 的正式宿主输入、存量参考输入与禁止越界项
- `phase09-domain-service-migration` 的正式宿主输入、存量参考输入与禁止越界项

### 不在范围内
- 不直接执行正式切换
- 不直接删除旧宿主代码
- 不直接进入部署切线

### DoD
- 旧运行线的参考、兼容与退出条件清晰
- 后续阶段不会因“双宿主职责不清”而重新返工
- `phase08` 与 `phase09` 已有明确上游输入
- 旧启动脚本的保留边界、并行关系与退出条件已写成可验证清单

## 四、推荐实施顺序
建议严格按如下顺序推进：

```text
phase07-01-runtime-workspace-foundation
phase07-02-frontend-app-shell-migration
phase07-03-runtime-entry-and-health-check-foundation
phase07-04-legacy-runtime-mapping-and-exit-conditions
```

## 五、默认路线约束
`phase07` 的全部子任务都必须遵守：

- 默认优先建立正式承接位，而不是抢跑迁移正式业务逻辑
- 默认保持 `React Router`、双服务代理、先并行壳后切换的阶段决策不漂移
- 默认继续把 `Prisma + PostgreSQL` 作为数据真相源，不在本阶段切 ORM
- 默认不重做 UI 风格，不重定义合同、账单、仪表、抄表等主链语义
- 默认由用户审核 `phase07` 阶段文档后，再逐个进入 `/spec`

## 六、结语
`phase07` 的价值不在于“已经完成 Hono 版主链迁移”，而在于：

```text
先给 Rento-miniX 建立新的前端应用壳与服务端运行时承接位，
再让后续 API、认证、领域服务、数据访问层与部署主线有序挂接到新宿主上。
```
