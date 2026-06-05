# Tasks

- [x] 任务 1：建立 `phase10-01` 的数据访问入口盘点范围
  - [x] 子任务 1.1：复核 `dev_plan`、`architecture_plan` 与 `shared_baseline` 中对 `phase10-01` 的边界定义
  - [x] 子任务 1.2：确认 `src/lib/prisma.ts`、`src/lib/transaction-manager.ts`、`src/lib/queries.ts`、`src/lib/optimized-queries.ts`、`src/lib/dashboard-queries.ts`、`src/lib/search-queries.ts`、`src/lib/global-settings.ts`、`src/lib/health-checker.ts` 都被纳入盘点范围
  - [x] 子任务 1.3：确认本子任务不越界到 query helper 重写、领域迁移或部署切线

- [x] 任务 2：输出单一数据访问入口清单并标注角色
  - [x] 子任务 2.1：为每个入口标记“正式主链写路径 / 正式主链查询 / legacy compat 查询 / 治理与脚本查询”角色
  - [x] 子任务 2.2：为每个入口补充服务对象、保留原因与后续去向
  - [x] 子任务 2.3：明确哪些文件处于过渡期混合职责状态，并记录退出条件或后续承接位

- [x] 任务 3：建立 `phase09-06` route inventory 到查询依赖的映射
  - [x] 子任务 3.1：读取 `server/lib/legacy-route-inventory.ts` 的 `exit-evaluation`、`keep-compat`、`defer-unmigrated` 三类 bucket
  - [x] 子任务 3.2：将每类 bucket 回溯到对应的数据访问入口或查询依赖
  - [x] 子任务 3.3：补齐无法直接解释的依赖关系，直到不存在“某条旧路由依赖哪类查询入口”不清晰的情况

- [x] 任务 4：补充验证并收口 `phase10-01` 输出
  - [x] 子任务 4.1：对照 `scripts/phase09-06-legacy-route-inventory.ts` 的脚本输出，确认分桶与入口映射一致
  - [x] 子任务 4.2：复核所有被引用的数据访问或查询文件路径真实存在
  - [x] 子任务 4.3：确认 `phase10-01` 的结果可直接作为 `phase10-02` 与 `phase10-03` 的上游输入

- [x] 任务 5：修正 dashboard 组查询依赖映射并补强验收链
  - [x] 子任务 5.1：修正 `inventory.md` 中 dashboard 路由到 `dashboard-queries.ts`、`global-settings.ts`、直接 `prisma` 路径的映射错误
  - [x] 子任务 5.2：同步修正 `server/lib/legacy-route-inventory.ts` 中相关 dashboard 路由的 `domainServicePaths`
  - [x] 子任务 5.3：增强 `scripts/phase09-06-legacy-route-inventory.ts` 的一致性校验，或收窄 `checklist.md` 的验收表述，避免“路径存在但映射错误”仍被判定通过
  - [x] 子任务 5.4：重新运行子代理验收，确认 bucket 到查询依赖的映射与真实代码一致

# Task Dependencies
- 任务 2 依赖任务 1
- 任务 3 依赖任务 1、任务 2
- 任务 4 依赖任务 2、任务 3
- 任务 5 依赖任务 2、任务 3、任务 4
