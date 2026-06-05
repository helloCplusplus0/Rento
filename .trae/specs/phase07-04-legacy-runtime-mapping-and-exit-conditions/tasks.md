# Tasks

- [x] Task 1: 盘点 `phase07` 结束时的新旧宿主现状。
  - [x] SubTask 1.1: 核对 `src/minix/`、`server/`、`src/app`、`src/app/api/*`、`scripts/dev-entry.mjs`、`scripts/start-entry.mjs` 的当前职责
  - [x] SubTask 1.2: 区分哪些是新主线正式承接位，哪些仍是旧运行线参考基线或兼容宿主
  - [x] SubTask 1.3: 明确本子任务只冻结映射关系与退出条件，不直接执行正式切换或删除旧宿主代码

- [x] Task 2: 冻结旧 `src/app` 与旧 `src/app/api/*` 的保留边界。
  - [x] SubTask 2.1: 明确旧 `src/app` 在 `phase07` 结束后仍保留的页面壳、参考与兼容职责
  - [x] SubTask 2.2: 明确旧 `src/app/api/*` 在 `phase08` 前仍保留的存量 API、认证 API 与兼容职责
  - [x] SubTask 2.3: 明确新增前端宿主逻辑与新增 API 宿主逻辑不再默认落回旧宿主

- [x] Task 3: 冻结新旧运行线的并行关系与退出条件。
  - [x] SubTask 3.1: 明确 `src/minix/`、`server/` 与旧 `Next.js` 运行线在开发态、验证态与存量运行线中的关系
  - [x] SubTask 3.2: 明确旧前端壳、旧 API 宿主与旧启动脚本的退出前提
  - [x] SubTask 3.3: 明确未满足退出条件前的回滚、参考与兼容口径

- [x] Task 4: 输出 `phase08` 与 `phase09` 的直接输入清单。
  - [x] SubTask 4.1: 为 `phase08-api-and-auth-foundation` 列出正式宿主输入、存量参考输入与禁止越界项
  - [x] SubTask 4.2: 为 `phase09-domain-service-migration` 列出领域服务迁移输入、存量参考输入与禁止越界项
  - [x] SubTask 4.3: 明确后续阶段不再因“双宿主职责不清”而重新返工

- [x] Task 5: 验证旧运行线映射与退出条件已可作为后续阶段上游输入。
  - [x] SubTask 5.1: 复核旧运行线的参考、兼容与退出条件是否清晰
  - [x] SubTask 5.2: 复核 `phase08` 与 `phase09` 是否已有明确上游输入
  - [x] SubTask 5.3: 确认本次子任务未越界到正式切换、删除旧宿主代码或部署切线

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1, Task 2
- Task 4 depends on Task 1, Task 2, Task 3
- Task 5 depends on Task 2, Task 3, Task 4
