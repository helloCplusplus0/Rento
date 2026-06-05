# Tasks

- [x] Task 1: 盘点 `phase07-03` 的运行时承接基线。
  - [x] SubTask 1.1: 核对当前 `server/index.ts`、`server/app.ts`、`server/routes/health.ts`、`server/lib/env.ts`、`server/lib/static.ts` 的现状
  - [x] SubTask 1.2: 区分哪些能力已在 `phase07-01` 先行落地，哪些能力仍需在 `phase07-03` 正式收口
  - [x] SubTask 1.3: 明确本子任务只收口运行时入口、健康检查、中间件和错误处理，不迁移正式业务 API、完整认证 API 与部署主线

- [x] Task 2: 正式收口 `Hono` 运行时入口与基础中间件链。
  - [x] SubTask 2.1: 收口 `server/index.ts` 与 `server/app.ts` 的正式 Node 入口职责
  - [x] SubTask 2.2: 建立或整理基础中间件链，明确运行时标识、日志与后续扩展挂载顺序
  - [x] SubTask 2.3: 明确新运行时与旧 `src/app/api/*` 的关系，避免后续 API 阶段重新依附旧宿主

- [x] Task 3: 收口健康检查、错误处理与环境变量读取层。
  - [x] SubTask 3.1: 正式承接 `/api/health`，确保其由 `Hono` 路由提供
  - [x] SubTask 3.2: 建立最小错误处理骨架，包括 `notFound` 与 `onError`
  - [x] SubTask 3.3: 收口最小环境变量读取层，统一主机、端口与 dist 目录口径

- [x] Task 4: 明确静态资源与前端壳托管预留位。
  - [x] SubTask 4.1: 说明开发态与构建态下前端壳托管差异
  - [x] SubTask 4.2: 明确静态资源与 SPA 回退的最小承接策略
  - [x] SubTask 4.3: 保持当前阶段仅为托管预留位，不切换正式部署主线

- [x] Task 5: 验证新服务端运行时已具备正式入口能力。
  - [x] SubTask 5.1: 校验 Node 入口、`/api/health` 与基础错误处理可以独立工作
  - [x] SubTask 5.2: 校验后续 API/认证阶段不再需要依附旧 `src/app/api/*` 才能启动
  - [x] SubTask 5.3: 运行本阶段所需最小校验，如 `npm run type-check`、`npm run lint`、`npm run build:minix`、`npm run start:minix` 与健康检查访问验证

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1, Task 2, Task 3
- Task 5 depends on Task 2, Task 3, Task 4
