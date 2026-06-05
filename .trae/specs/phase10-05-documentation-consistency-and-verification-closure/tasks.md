# Tasks

- [x] 任务 1：确认 `phase10-05` 的收口范围与真实输入
  - [x] 子任务 1.1：复核 `dev_plan`、`phase10` plan file 与三份 `docs/phase10_*` 中的阶段状态、验证口径和 `phase11` 输入要求
  - [x] 子任务 1.2：核对 `AGENTS.md`、`plan.md`、`architecture_map.md`、`project_rules.md` 当前是否已同步到 `phase10` 最新状态
  - [x] 子任务 1.3：核对当前已使用的验证命令和脚本是否仍与文档一致

- [x] 任务 2：收口顶层真相源与 `phase10` 阶段文档状态
  - [x] 子任务 2.1：按需更新 `AGENTS.md`
  - [x] 子任务 2.2：按需更新 `plan.md`
  - [x] 子任务 2.3：按需更新 `architecture_map.md`
  - [x] 子任务 2.4：按需更新 `project_rules.md`
  - [x] 子任务 2.5：确认三份 `docs/phase10_*` 的阶段状态、互链与当前结论一致

- [x] 任务 3：冻结验证命令与最小验证要求
  - [x] 子任务 3.1：确认 `npm run audit:phase09:legacy-routes`、`npm run lint`、`npm run type-check` 仍是 `phase10` 最低验证要求
  - [x] 子任务 3.2：补充仅文档变更时的最小验证要求
  - [x] 子任务 3.3：确保验证命令与脚本名称、路径、用途没有漂移

- [x] 任务 4：冻结 `phase11` 直接继承的最小上游输入
  - [x] 子任务 4.1：整理 `phase10` 已冻结的长期数据访问层、查询分层、事务边界与迁移兼容项结论
  - [x] 子任务 4.2：整理与 `phase09-06` route inventory 对齐后的退出 / 保留判断
  - [x] 子任务 4.3：把 `phase11` handoff 收口成最小且单一的输入清单

- [x] 任务 5：补充验证并收口 `phase10-05` 输出
  - [x] 子任务 5.1：运行并记录 `npm run audit:phase09:legacy-routes`
  - [x] 子任务 5.2：运行并记录 `npm run lint`
  - [x] 子任务 5.3：运行并记录 `npm run type-check`
  - [x] 子任务 5.4：复核文档互链与路径存在性
  - [x] 子任务 5.5：确认本子任务未越界到新增实现代码或切换默认工作流到 `phase11`

- [x] 任务 6：补齐 `docs/phase10_*` 的互链闭环并重新验收
  - [x] 子任务 6.1：为 `phase10_data_access_and_migration_closure_dev_plan.md` 补充到 `architecture_plan` 与 `shared_baseline` 的可点击链接
  - [x] 子任务 6.2：重新复核三份 `docs/phase10_*` 是否都能从任一文档跳转到另外两份文档
  - [x] 子任务 6.3：重新执行独立子代理验收，确认文档互链闭环问题已消除

# Task Dependencies
- 任务 2 依赖任务 1
- 任务 3 依赖任务 1、任务 2
- 任务 4 依赖任务 1、任务 2
- 任务 5 依赖任务 2、任务 3、任务 4
- 任务 6 依赖任务 5
