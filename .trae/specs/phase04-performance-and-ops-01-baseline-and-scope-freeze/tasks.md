# Tasks

- [x] Task 1: 冻结 `phase04` 的阶段边界与共享基线
  - [x] SubTask 1.1: 审核并收口 `phase04_performance_and_ops_architecture_plan.md` 的阶段定位、允许路线、禁止路线与子任务顺序
  - [x] SubTask 1.2: 审核并收口 `phase04_performance_and_ops_shared_baseline.md` 的共享判断标准、允许路线、禁止路线与统一验证要求
  - [x] SubTask 1.3: 确认 `phase04_performance_and_ops_dev_plan.md` 中 `01` 子任务的目标、范围、DoD 与后续子任务顺序一致

- [x] Task 2: 同步顶层真相源到 `phase04`
  - [x] SubTask 2.1: 审核 `AGENTS.md`、`plan.md`、`architecture_map.md` 中当前默认工作流、当前下一步和阶段重点是否已切换到 `phase04`
  - [x] SubTask 2.2: 审核 `global_skills.md`、`project_rules.md`、`project_skills.md` 中与 `phase04` 相关的方法、规则和项目技能是否已补齐
  - [x] SubTask 2.3: 确认顶层文档与 `phase04` 三份阶段文档之间不存在阶段入口或边界冲突

- [x] Task 3: 冻结辅助页面的初始分类口径
  - [x] SubTask 3.1: 明确 `performance-*`、`layout-demo`、`components`、`business-flow-validation` 作为 dev-only 或治理辅助候选入口的阶段口径
  - [x] SubTask 3.2: 明确 `system-health`、`data-consistency` 作为运维治理候选入口的阶段口径
  - [x] SubTask 3.3: 确认当前只冻结分类原则与门禁方向，不提前进入页面实现治理

- [x] Task 4: 完成文档级验收
  - [x] SubTask 4.1: 检查 `phase04` 三份阶段文档是否可直接作为后续 `/spec` 的上游输入
  - [x] SubTask 4.2: 检查顶层文档与阶段文档是否符合“单一真相源、低复杂度、先审核后实现”的工作流要求
  - [x] SubTask 4.3: 完成本子任务 `spec.md`、`tasks.md`、`checklist.md` 的收口

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1, Task 2, Task 3
