# Tasks

- [x] Task 1: 冻结辅助页面的最终分类矩阵
  - [x] SubTask 1.1: 盘点 `performance-*`、`layout-demo`、`components`、`business-flow-validation`、`system-health`、`data-consistency` 的当前用途、访问方式和现有暴露面
  - [x] SubTask 1.2: 为每个页面明确分类结果，区分 `dev-only`、`运维治理`、`正式业务入口`
  - [x] SubTask 1.3: 为每类页面明确最小门禁策略，包括是否必须认证、是否仅限开发环境、是否允许保留直达路由

- [x] Task 2: 收口导航与入口暴露面
  - [x] SubTask 2.1: 审视 `src/lib/route-config.ts`、`src/lib/navigation-config.ts`、`src/components/layout/UnifiedNavigation.tsx` 中对辅助页面的暴露方式
  - [x] SubTask 2.2: 让 `dev-only` 页面退出正式主导航与默认业务入口
  - [x] SubTask 2.3: 明确运维治理页的导航归属，避免与正式业务入口等价暴露

- [x] Task 3: 收口页面门禁与用途说明
  - [x] SubTask 3.1: 为 `dev-only` 页面补最小门禁实现或统一门禁接入点
  - [x] SubTask 3.2: 为保留的辅助页面补最小用途说明或保留理由
  - [x] SubTask 3.3: 确保页面分类、门禁行为和用途说明之间不存在冲突

- [x] Task 4: 同步结构文档与验证
  - [x] SubTask 4.1: 必要时更新 `architecture_map.md` 中关于辅助页面、运维治理页和正式入口的描述
  - [x] SubTask 4.2: 执行 `npm run lint`
  - [x] SubTask 4.3: 执行 `npm run type-check`
  - [x] SubTask 4.4: 补至少一条验证路径，证明正式业务入口不再被辅助页面污染，且页面分类、门禁和文档说明相互一致

- [x] Task 5: 同步顶层真相源并完成最终验收
  - [x] SubTask 5.1: 更新 `plan.md` 中当前下一步说明，使其与 `phase04-04` 的实际推进状态一致
  - [x] SubTask 5.2: 更新 `AGENTS.md` 中当前下一步说明，使其与 `plan.md` 和当前实现状态一致
  - [x] SubTask 5.3: 重新复核顶层文档、阶段文档与 `phase04-04` 实现是否满足单一真相源要求

- [x] Task 6: 修正结构文档残留旧阶段口径并完成最终复核
  - [x] SubTask 6.1: 更新 `architecture_map.md` 中仍指向旧阶段的描述，使其与当前 `plan.md`、`AGENTS.md` 一致
  - [x] SubTask 6.2: 重新复核顶层文档、结构文档与 `phase04-04` 实现是否满足最终验收要求

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2, Task 3
- Task 5 depends on Task 4
- Task 6 depends on Task 5
