# Tasks
- [x] Task 1: 全量审计 `phase14` 范围内旧 Next API、route inventory 与 formal host 映射，确认是否仍存在 retained-legacy 主职责或遗漏迁移。
  - [x] SubTask 1.1: 逐域核对 dashboard / rooms / contracts / checkout / bills / renters / meter-readings 的 `src/app/api/**/route.ts`、`server/routes/*` 与 `legacy-route-inventory.ts`
  - [x] SubTask 1.2: 标记每个仍保留的旧 Next API 的保留原因、退出条件与回滚条件
  - [x] SubTask 1.3: 若发现 formal host、compat proxy、inventory 或顶层真相源不一致，先在 `phase14-07` 内补齐收口

- [x] Task 2: 收口 `server/lib/legacy-route-inventory.ts` 的阶段完成态。
  - [x] SubTask 2.1: 清空仍承担正式业务主职责的 retained-legacy API 条目，仅保留 governance / compat-wrapper / rollback-only 等显式边界
  - [x] SubTask 2.2: 为每个仍保留的旧 Next API 补齐单一保留原因、退出条件与回滚条件
  - [x] SubTask 2.3: 确保 inventory 对 `phase15/16` 的输入边界表述不再承接正式业务 API 迁移职责

- [x] Task 3: 更新顶层真相源与 `phase14` 文档完成态。
  - [x] SubTask 3.1: 更新 `docs/phase14_*`，明确 `phase14-01~06` 是否已完成 `Rento -> Rento-miniX` API 层 `100%` 高保真迁移，以及仍保留的 compat/rollback-only 边界
  - [x] SubTask 3.2: 更新 `plan.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`，使顶层口径与 `phase14` 状态一致
  - [x] SubTask 3.3: 必要时更新 `README.md`，仅补充与 API 迁移完成态直接相关的说明

- [x] Task 4: 完成 `phase14` 收口验证与独立复审。
  - [x] SubTask 4.1: 运行覆盖 dashboard / rooms / contracts / checkout / bills / renters / meter-readings 的 route inventory 审计与主链 smoke
  - [x] SubTask 4.2: 运行必要的 lint / type-check / 定向验证，确认没有引入新的错误
  - [x] SubTask 4.3: 进行独立复审，确认 `phase14` 未把任何正式业务 API 迁移债务留给 `phase15` 或 `phase16`

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2
- Task 4 depends on Task 3
