- [x] `performance-*`、`layout-demo`、`components`、`business-flow-validation`、`system-health`、`data-consistency` 已有明确分类结果
- [x] `dev-only` 页面已退出正式业务主导航或默认业务入口暴露面
- [x] 运维治理页与正式业务入口的边界已明确，且未被误当成正式产品功能
- [x] 页面分类结果与实际门禁策略一致
- [x] 保留页面已补最小用途说明或保留理由
- [x] `architecture_map.md` 中与页面分类相关的说明已按需要同步
- [x] `npm run lint` 与 `npm run type-check` 被纳入本子任务验证路径
- [x] 至少存在一条可执行或可复核的验证路径，用于证明正式业务入口不再被辅助页面污染
- [x] `plan.md` 与 `AGENTS.md` 中的当前推进状态已与 `phase04-04` 实际完成情况保持一致
- [x] `architecture_map.md` 中不再残留与当前阶段结论冲突的旧阶段表述

## 验证路径

1. 在开发环境登录后台，访问首页，确认 `FunctionGrid` 与默认快捷操作中不再出现 `performance-*`、`components`、`layout-demo`、`business-flow-validation`、`system-health`、`data-consistency`。
2. 进入设置页，确认仅在“运维治理”分组看到 `system-health` 与 `data-consistency`，且不再看到 `business-flow-validation`。
3. 直接访问任一 `dev-only` 页面，确认页面顶部展示统一用途说明；在非开发环境下，已登录用户访问该类页面应被 `src/middleware.ts` 重定向到 `/`。
4. 直接访问 `system-health` 或 `data-consistency`，确认页面顶部展示“运维治理”说明，且与 `src/lib/page-governance.ts` 的分类一致。
5. 执行 `npm run lint` 与 `npm run type-check`，确认当前实现与文档口径在静态校验层面通过。
