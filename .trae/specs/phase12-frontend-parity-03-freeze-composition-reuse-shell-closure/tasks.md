# Tasks
- [x] Task 1: 冻结 `phase12-03` 的复用层次与宿主绑定边界。
  - [x] SubTask 1.1: 复核 `src/components/pages/*`、`src/components/business/*`、`src/components/layout/*`、`src/components/ui/*` 的真实承接现状。
  - [x] SubTask 1.2: 复核 `src/minix/router/*`、`src/minix/layout/*`、`src/minix/routes/*` 的当前宿主绑定职责。
  - [x] SubTask 1.3: 明确旧 `src/app` 中哪些 Next 宿主绑定逻辑需要拆出，避免继续混入可复用表达层。

- [x] Task 2: 补齐页面壳、页面装配层、数据加载边界、导航壳与布局壳的复用矩阵。
  - [x] SubTask 2.1: 在 `docs/phase12_*` 中写出“复用什么、适配什么、舍弃什么及原因”。
  - [x] SubTask 2.2: 形成目录级策略表，至少列出可直接复用的组件层目录、需要迁移或改造的页面装配层目录、暂不处理的治理/辅助层目录。
  - [x] SubTask 2.3: 保持范围只到复用策略冻结，不提前进入页面重写或 API / query parity。

- [x] Task 3: 对齐共享基线与 UI 承接约束。
  - [x] SubTask 3.1: 确保复用策略与当前 UI 承接硬约束一致，不借迁移重做设计。
  - [x] SubTask 3.2: 确保 `dev_plan`、`architecture_plan`、`shared_baseline` 对 `phase12-03` 的口径一致。
  - [x] SubTask 3.3: 明确哪些治理/辅助层目录延后到后续阶段，不在本轮扩写。

- [x] Task 4: 完成 `phase12-03` 的验证与验收闭环。
  - [x] SubTask 4.1: 复核引用的组件目录与页面装配文件真实存在。
  - [x] SubTask 4.2: 复核宿主绑定层与业务组件层边界单一可解释。
  - [x] SubTask 4.3: 指定独立子代理执行审核验收，并在通过后才标记本子任务完成。
  - 说明：已获得独立子代理“验收通过”结论，`Task 4` 现视为完成闭环。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 2 and Task 3
