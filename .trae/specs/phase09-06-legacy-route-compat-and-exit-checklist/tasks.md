# Tasks
- [x] Task 1: 盘点旧 `src/app/api/*` 路由，建立统一分类清单。
  - [x] SubTask 1.1: 扫描旧 `src/app/api/*` 全部入口，并按主链接口、治理/辅助接口、认证/健康检查等维度分组。
  - [x] SubTask 1.2: 明确每个旧入口当前属于“已迁移正式承接”“compat wrapper”“未迁移存量接口”的哪一类。
  - [x] SubTask 1.3: 为每个旧入口补充对应正式宿主、共享领域服务或继续保留原因。

- [x] Task 2: 建立旧接口去向、退出条件与回滚条件清单。
  - [x] SubTask 2.1: 对照 `server/routes/*` 与 `src/lib/domain/*`，补齐已迁移旧接口的正式承接位与 compat 边界。
  - [x] SubTask 2.2: 为 compat wrapper 与未迁移存量接口写清退出条件、回滚条件与后续阶段去向。
  - [x] SubTask 2.3: 明确哪些旧接口在 `phase09` 结束时禁止删除，只能继续保留为 compat 或存量接口。

- [x] Task 3: 形成 `phase10` 上游输入清单，收口 legacy route 治理结论。
  - [x] SubTask 3.1: 输出可继续退出评估的旧接口集合。
  - [x] SubTask 3.2: 输出必须继续保留 compat 的旧接口集合。
  - [x] SubTask 3.3: 输出仍未迁移且留待后续阶段处理的旧接口集合。
  - [x] SubTask 3.4: 保证 `phase10` 上游输入与现有 `server/routes/*`、共享领域服务与 `phase09` 基线文档口径一致。

- [x] Task 4: 将旧兼容宿主清单落到真实实现或清单载体，而不是停留在口头说明。
  - [x] SubTask 4.1: 选择一个真实承接位保存旧接口分类与退出清单。
  - [x] SubTask 4.2: 让该清单可被后续阶段直接读取、复核或扩展。
  - [x] SubTask 4.3: 不执行旧接口实际删除，不迁移治理/辅助接口，不切部署主线。

- [x] Task 5: 完成实现校验，确认旧接口清单、退出条件与 `phase10` 输入均可解释。
  - [x] SubTask 5.1: 运行 `npm run lint`。
  - [x] SubTask 5.2: 运行 `npm run type-check`。
  - [x] SubTask 5.3: 复核旧兼容宿主清单、退出条件、回滚条件与未迁移接口去向均已可解释。
  - [x] SubTask 5.4: 确认本子任务未执行旧接口实际删除、未迁移治理/辅助接口、未切部署主线。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1, Task 2
- Task 4 depends on Task 2, Task 3
- Task 5 depends on Task 4
