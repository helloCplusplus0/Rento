# Tasks

- [x] Task 1: 盘点当前仓库与 GitHub 侧的仓库关系，冻结角色与现状说明。
  - [x] SubTask 1.1: 确认 GitHub 侧 `Rento-miniX` 与 `Rento-legacy` 的存在状态与职责分工
  - [x] SubTask 1.2: 盘点本地仓库当前 `origin` 指向，判断是否仍保留旧 `Rento` 地址
  - [x] SubTask 1.3: 输出当前仓库、本地 remote、`Rento-miniX` 与 `Rento-legacy` 的统一关系说明

- [x] Task 2: 收口本地 remote 与仓库切换判断。
  - [x] SubTask 2.1: 将本地 `origin` 收口到新的 `Rento-miniX` 仓库地址
  - [x] SubTask 2.2: 评估是否需要补冻结 tag、仓库切换说明或本地目录改名建议
  - [x] SubTask 2.3: 明确哪些动作在本子任务内可完成，哪些只需要形成文档结论

- [x] Task 3: 同步文档中的仓库与回滚基线说明。
  - [x] SubTask 3.1: 在根级或 `phase06` 文档中明确 `Rento-legacy` 的备份职责
  - [x] SubTask 3.2: 在相关文档中明确旧容器化运行线只承担存量可运行基线与回滚参考职责
  - [x] SubTask 3.3: 确保文档不会把旧部署链误写为未来 `Rento-miniX` 的正式部署主线

- [x] Task 4: 完成文档与仓库状态验收。
  - [x] SubTask 4.1: 核对本地与远端仓库关系已可直接理解
  - [x] SubTask 4.2: 核对后续实现不会因 `origin` 仍指向旧仓导致误推送
  - [x] SubTask 4.3: 核对 `Rento-legacy` 的角色已在文档层被准确表述

- [x] Task 5: 补齐仓库切换辅助项的显式结论。
  - [x] SubTask 5.1: 在相关文档中明确当前不需要新增冻结 tag 的结论及理由
  - [x] SubTask 5.2: 在相关文档中明确现有根级文档已承接仓库切换说明，无需新增独立切换说明文档
  - [x] SubTask 5.3: 在相关文档中明确当前不建议立即把本地目录从 `Rento` 改名为 `Rento-miniX`

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1, Task 2, Task 3
- Task 5 depends on Task 1, Task 2, Task 3
