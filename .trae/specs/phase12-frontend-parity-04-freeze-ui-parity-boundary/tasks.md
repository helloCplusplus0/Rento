# Tasks
- [x] Task 1: 冻结 `phase12-04` 的 UI 保真边界与默认原型参考。
  - [x] SubTask 1.1: 复核 `project_rules.md`、`project_skills.md`、`docs/phase12_*` 当前对 UI 承接的表述。
  - [x] SubTask 1.2: 结合旧 `src/app/*` 与现有 `src/components/*`、`src/minix/layout/*` 的真实现状，明确默认沿用的页面信息结构、导航节奏、表单交互、组件表达和整体视觉风格。
  - [x] SubTask 1.3: 形成后续 `/spec` 可直接复用的 UI 原型边界说明。

- [x] Task 2: 冻结允许的最小技术适配范围。
  - [x] SubTask 2.1: 明确哪些调整属于宿主适配、明显 bug 修复、移动端可用性改善、最小信息架构优化。
  - [x] SubTask 2.2: 要求每类允许改动都具备最小技术适配或明确收益解释。
  - [x] SubTask 2.3: 保持范围只到边界冻结，不提前进入页面重做或设计改版。

- [x] Task 3: 冻结禁止路线并同步共享基线。
  - [x] SubTask 3.1: 明确禁止重做设计系统、引入新视觉语言、以“用户体验优化”为名扩大改动范围。
  - [x] SubTask 3.2: 确保 `architecture_plan`、`shared_baseline`、`dev_plan` 对 UI 保真边界的口径一致。
  - [x] SubTask 3.3: 确保新宿主承接不会顺带演变成 UI 重设计。

- [x] Task 4: 完成 `phase12-04` 的验证与独立子代理验收。
  - [x] SubTask 4.1: 复核文档与顶层真相源关于 UI 承接的表述一致。
  - [x] SubTask 4.2: 复核所有允许改动都属于最小技术适配或明确收益项。
  - [x] SubTask 4.3: 已指定独立子代理执行审核验收，待终审通过后再标记完成。
  - 说明：独立子代理终审通过后，再将 Task 4 与 SubTask 4.3 标记为完成。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 2 and Task 3
