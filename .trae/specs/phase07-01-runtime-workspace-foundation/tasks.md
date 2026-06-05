# Tasks

- [x] Task 1: 盘点并冻结 `phase07-01` 的实际工作区基线。
  - [x] SubTask 1.1: 核对当前 `package.json`、`tsconfig.json`、`scripts/*` 与 `src/app` / `src/app/api/*` 的现状入口
  - [x] SubTask 1.2: 明确本子任务只建立新承接位，不迁移正式业务页面、正式业务 API、完整认证链与最终部署主线
  - [x] SubTask 1.3: 明确新工作区应落到 `src/minix/`、`server/`、`vite.config.ts`、`index.html` 与新增脚本

- [x] Task 2: 建立 `Rento-miniX` 新主线的目录与入口骨架。
  - [x] SubTask 2.1: 创建 `src/minix/` 及其最小 React 入口结构
  - [x] SubTask 2.2: 创建 `server/` 及其最小 `Hono + @hono/node-server` 入口结构
  - [x] SubTask 2.3: 为前端壳与运行时预留后续 `phase07-02`、`phase07-03` 的承接目录

- [x] Task 3: 固定新主线的开发与构建配置。
  - [x] SubTask 3.1: 新建 `vite.config.ts` 与 `index.html`
  - [x] SubTask 3.2: 在 `package.json` 中补充 `dev:minix`、`build:minix`、`start:minix`
  - [x] SubTask 3.3: 固定开发态 `Vite` 到 `Hono` 的双服务代理方式
  - [x] SubTask 3.4: 补齐新壳所需的 `vite/client` 与路径别名基线

- [x] Task 4: 验证新工作区已具备最小可运行表达。
  - [x] SubTask 4.1: 核对旧 `Next.js` 脚本仍保留，新主线脚本已可独立表达
  - [x] SubTask 4.2: 核对后续新主线文件不再需要默认写回 `src/app` 或 `src/app/api/*`
  - [x] SubTask 4.3: 运行本阶段需要的最小校验，如 `npm run type-check`、必要的构建或脚本验证

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2, Task 3
