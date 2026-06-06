# Tasks
- [x] Task 1: 盘点旧页面入口并冻结页面总数。
  - [x] SubTask 1.1: 读取 `src/app/**/page.tsx`，生成当前真实页面入口清单。
  - [x] SubTask 1.2: 复核页面入口总数为 37 个，并与 `docs/phase12_*` 当前描述对齐。
  - [x] SubTask 1.3: 标出页面路径、对应文件与基础用途，形成可复核盘点底稿。

- [x] Task 2: 冻结页面分类规则与三张事实表。
  - [x] SubTask 2.1: 按单一规则将页面划分为正式业务页面、状态/支持页面、运维治理页面、dev-only / 待归档候选。
  - [x] SubTask 2.2: 产出页面分类表。
  - [x] SubTask 2.3: 产出正式页面范围表。
  - [x] SubTask 2.4: 产出延后/不进入 parity 范围表，并写明延后或排除原因。

- [x] Task 3: 将 `phase12-01` 的页面范围冻结为后续阶段可复用输入。
  - [x] SubTask 3.1: 对齐 `architecture_plan` 与 `shared_baseline` 已冻结的正式页面范围口径。
  - [x] SubTask 3.2: 明确哪些页面进入 `phase12 ~ phase15` 默认 parity 路线图。
  - [x] SubTask 3.3: 明确哪些页面不在 `phase12-01` 范围内，例如 retained-legacy API 切流顺序与页面实现迁移。

- [x] Task 4: 完成 `phase12-01` 验证与文档一致性复核。
  - [x] SubTask 4.1: 复核所有被列入清单的页面路径真实存在。
  - [x] SubTask 4.2: 复核正式页面与 dev-only / 辅助页边界不混写。
  - [x] SubTask 4.3: 复核结果与 `plan.md`、`docs/phase12_*`、`page-governance.ts` 当前口径一致。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 2 and Task 3
