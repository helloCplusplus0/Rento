# Tasks
- [x] Task 1: 盘点当前脚本与运行时职责，冻结开发态与生产态边界。
  - [x] SubTask 1.1: 审核 `package.json` 中 `build:minix`、`start:minix`、`dev:minix` 的当前定义与职责漂移
  - [x] SubTask 1.2: 审核 `scripts/start-minix.mjs`、`scripts/dev-minix.mjs` 与 `server/index.ts` 的正式/开发启动关系
  - [x] SubTask 1.3: 记录当前事实基线，明确哪些行为只允许留在开发态

- [x] Task 2: 定义服务端预构建产物链与正式生产启动入口。
  - [x] SubTask 2.1: 设计服务端产物输出策略，明确是否新增独立服务端 `tsconfig`
  - [x] SubTask 2.2: 定义 `build:minix` 的联合构建职责，确保覆盖前端与服务端产物
  - [x] SubTask 2.3: 定义 `start:minix` 的正式启动口径，确保不再依赖 `tsx` 直接跑源码

- [x] Task 3: 保持现有 Hono 承接位不变，限制本任务不越界到部署拓扑和业务语义。
  - [x] SubTask 3.1: 确认 `server/app.ts`、`server/lib/static.ts` 继续作为 `/api/*` 与 `dist/` 的正式承接位
  - [x] SubTask 3.2: 明确本任务不新增 `Caddy` / `systemd` 配置、不切换最终部署主线、不调整业务 API 或领域服务语义
  - [x] SubTask 3.3: 将不越界边界写入实现说明与后续验证要求

- [x] Task 4: 补齐验证与回归检查要求。
  - [x] SubTask 4.1: 冻结本任务最低验证要求：`npm run lint`、`npm run type-check`、`npm run build:minix`
  - [x] SubTask 4.2: 明确需要确认正式生产入口与“云端不构建”底线一致
  - [x] SubTask 4.3: 记录必要的风险点与回归检查项，避免把开发态脚本误用为生产入口

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2 and Task 3
