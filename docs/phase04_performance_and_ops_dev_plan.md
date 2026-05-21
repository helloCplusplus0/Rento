# Phase04 Performance And Ops 开发规划

## 一、文档定位

本文档用于把 `phase04-performance-and-ops-*` 拆分为顺序执行的子任务，确保后续开发继续遵循：

- 真实业务主链优先稳定
- 性能优化优先数据库侧收口
- 运维能力优先轻量、可解释、低耦合
- 正式入口与 dev-only 入口显式分层
- 问题定位优先
- 低复杂度优先

本文档不替代：

- [phase04_performance_and_ops_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase04_performance_and_ops_architecture_plan.md) 的阶段定位职责
- [phase04_performance_and_ops_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase04_performance_and_ops_shared_baseline.md) 的共享边界职责
- 具体 `.trae/specs/phase04-performance-and-ops-*` 的任务冻结与验收职责

## 二、总体推进结论

`phase04-performance-and-ops-*` 的执行顺序固定为：

```text
先冻结共享边界与页面分类原则
    ->
再收口关键查询性能路径
    ->
再收口健康检查、日志与基础观测能力
    ->
最后治理 dev-only 页面分类、门禁与正式入口污染
```

原因如下：

- 若不先冻结共享边界，后续很容易把“性能优化”“运维增强”“新功能扩写”“页面治理”混成一次大改动
- 若不先修查询路径，后续健康检查和性能指标很难对准真正的瓶颈
- 若不先补基础观测能力，后续性能与页面治理的效果缺乏稳定验证依据
- 若不最后单独处理 dev-only 入口治理，极易在功能未分层前误删辅助能力或污染正式导航

## 三、任务拆分建议

## phase04-performance-and-ops-01-baseline-and-scope-freeze

### 目标

冻结 `phase04` 的共享边界、允许/禁止路线、页面分类标准、性能目标与子任务顺序。

### 范围

- 同步顶层文档中的 `phase04` 当前下一步说明
- 生成并收口 `shared_baseline`
- 明确 `phase04` 的四个子任务顺序
- 明确哪些页面优先视为 dev-only 候选，哪些更接近运维治理入口
- 允许同步冻结“性能优化优先数据库侧、运维能力优先轻量、dev-only 页面显式分层、低复杂度优先”的共享判断标准

### 不在范围内

- 不直接修改查询实现
- 不直接改动健康检查逻辑
- 不直接调整页面门禁或导航入口

### DoD

- `phase04` 的共享边界已冻结
- 后续 `/spec` 可以直接引用 `shared_baseline`
- `phase04` 不再需要重复讨论“哪些辅助页属于 dev-only 候选”
- 后续子任务对性能、运维与页面治理的判断口径不再分叉

## phase04-performance-and-ops-02-query-performance-closure

### 目标

收口关键列表接口与统计接口的数据库侧过滤、分页和聚合路径，消除明显的全量查询后内存加工问题。

### 范围

- 审视关键列表页和统计 API 的查询路径
- 优先修复数据库侧可收口的过滤、分页、排序、聚合问题
- 明确需要保留的性能监测或基准验证方式
- 补最少量验证，证明关键接口性能改善或至少避免继续退化

### 重点文件

- `src/lib/queries.ts`
- `src/lib/optimized-queries.ts`
- 必要时 `src/lib/dashboard-queries.ts`
- 必要时关键列表/统计 API 路由
- 必要时相关基准脚本

### 不在范围内

- 不引入新的外部缓存系统
- 不重写主数据模型
- 不扩展新的统计页面或功能面

### DoD

- 关键查询不再依赖明显的全量查询后内存过滤
- 数据库侧分页、过滤与聚合路径更清晰
- 至少一条性能验证路径可执行

## phase04-performance-and-ops-03-observability-and-health-hardening

### 目标

统一健康检查、错误日志与基础性能指标的口径，使现有运行治理能力更适合定位问题。

### 范围

- 审视健康检查、日志与性能监测现状
- 明确哪些信号是当前阶段的最小可观察能力
- 必要时补充最小脚本说明、最小注释或最小字段收口
- 统一文档中的运行治理口径

### 重点文件

- `src/app/api/health/route.ts`
- `src/lib/health-checker.ts`
- `src/lib/error-tracker.ts`
- `src/lib/performance-monitor.ts`
- 必要时 `README.md`
- 必要时 `DEPLOYMENT.md`

### 不在范围内

- 不引入外部 APM、Tracing 平台或复杂告警编排
- 不把日志治理扩写成完整日志平台建设
- 不处理与当前问题定位无关的基础设施升级

### DoD

- 健康检查、错误日志、基础性能指标的口径一致
- 当前阶段最小可观察能力更清晰
- 问题定位入口不再依赖隐性知识

## phase04-performance-and-ops-04-dev-only-entry-classification-and-gating

### 目标

完成开发辅助页、性能页、演示页和验证页的分类、门禁与正式入口边界治理，避免污染业务导航和发布边界。

### 范围

- 盘点 `src/app` 中的 dev-only / 运维治理 / 正式业务入口候选页
- 明确页面是否应受认证保护、是否仅限开发环境、是否应从正式导航隐藏
- 允许做最小导航与入口收口
- 必要时在文档中标注用途与保留理由

### 重点文件

- `src/app/performance-test/page.tsx`
- `src/app/performance-benchmark/page.tsx`
- `src/app/performance-analysis/page.tsx`
- `src/app/layout-demo/page.tsx`
- `src/app/components/page.tsx`
- `src/app/business-flow-validation/page.tsx`
- 必要时导航与布局相关文件
- 必要时 `architecture_map.md`

### 不在范围内

- 不删除仍有实际开发价值的辅助能力
- 不顺手做 UI 视觉重构
- 不把开发辅助页包装成正式产品功能

### DoD

- dev-only 页面与正式业务入口边界更清晰
- 运行辅助页面不再污染正式业务入口
- 页面分类、门禁和文档说明相互一致

## 四、推荐实施顺序

建议严格按如下顺序推进：

```text
phase04-performance-and-ops-01-baseline-and-scope-freeze
phase04-performance-and-ops-02-query-performance-closure
phase04-performance-and-ops-03-observability-and-health-hardening
phase04-performance-and-ops-04-dev-only-entry-classification-and-gating
```

## 五、默认路线约束

`phase04-performance-and-ops-*` 的全部子任务都必须遵守：

- 默认优先保持 `phase03` 已收口的主链语义稳定
- 默认优先数据库侧优化，而不是先加缓存或额外基础设施
- 默认优先用轻量观测能力解决定位问题，不堆叠重型平台
- 默认优先把 dev-only 页面与正式入口显式分层
- 默认不扩展 UI 视觉范围
- 默认由用户手动启动本地 dev server，AI 不主动后台运行 `npm run dev`

## 六、结语

`phase04` 的价值不在于“把系统做得更重”，而在于：

```text
在 phase03 已稳定业务真相源的前提下，
把查询更快、运行更稳、问题更容易定位，
并把辅助能力与正式入口的边界真正收口清楚。
```
