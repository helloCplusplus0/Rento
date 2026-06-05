# Tasks

- [x] Task 1: 同步根级项目总览与入口摘要，使当前仓库在文档层明确升级为 `Rento-miniX` 主线仓。
  - [x] SubTask 1.1: 更新 `README.md`，明确当前仓库状态、`Rento-legacy` 关系与当前默认阶段
  - [x] SubTask 1.2: 更新 `AGENTS.md`，切换项目名称、当前默认入口、当前阶段重点与文档导航

- [x] Task 2: 同步根级规则与结构文档，冻结原地重构边界。
  - [x] SubTask 2.1: 更新 `project_rules.md`，明确当前默认工作流已切换到 `phase06-minix-replatform`
  - [x] SubTask 2.2: 更新 `architecture_map.md`，明确当前仓库的“旧实现层 + 新主线规划层”双层说明
  - [x] SubTask 2.3: 更新 `global_skills.md` 与 `project_skills.md`，补齐原地重构、UI 承接、旧运行线参考与单一真相源要求

- [x] Task 3: 同步阶段总览与阶段职责分层。
  - [x] SubTask 3.1: 更新 `plan.md`，将默认工作流切换为 `phase06-minix-replatform`
  - [x] SubTask 3.2: 确保 `plan.md` 仅保留阶段总览，不承接子任务细节
  - [x] SubTask 3.3: 确保 `plan.md` 与 `docs/phase06_*` 的职责关系在文档中可直接理解

- [x] Task 4: 视需要补部署文档状态声明。
  - [x] SubTask 4.1: 评估 `DEPLOYMENT.md` 是否仍会被误读为未来 `Rento-miniX` 的正式部署真相源
  - [x] SubTask 4.2: 若存在误读风险，补充“旧存量运行线部署参考”状态说明

- [x] Task 5: 完成文档级验收。
  - [x] SubTask 5.1: 逐项核对根级文档不再把当前仓库描述为旧 `Rento` fix 主线
  - [x] SubTask 5.2: 核对 UI 默认承接、PostgreSQL 固定主线、云端不构建等底线是否在根级文档中统一冻结
  - [x] SubTask 5.3: 核对 `plan.md` 与 `docs/phase06_*` 的职责分层是否清晰

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1, Task 2
- Task 4 depends on Task 1
- Task 5 depends on Task 1, Task 2, Task 3, Task 4
