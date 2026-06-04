# Phase06 Minix Replatform Shared Baseline

## 一、文档目的
本文档用于冻结 `phase06-minix-replatform` 全部子任务共享的边界、允许路线、禁止路线与统一判断标准，避免后续文档切换与原地重构各自扩写出不同解释。

## 二、共享前提
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- 当前 GitHub 已存在 `Rento-legacy` 备份仓，原主仓已更名为 `Rento-miniX`
- 当前本地仓库的 `origin` 已指向 `https://github.com/helloCplusplus0/Rento-miniX.git`
- 当前 `Rento` 主要功能与 UI 展示效果已阶段性符合预期
- 当前仓库中的旧实现代码仍是后续原地重构的直接参考基线

## 三、共享判断标准
- 默认优先单仓库、单主线、单一真相源，不让旧 `Rento` 叙事与新主线叙事长期并存
- 默认优先业务真实、状态可解释、历史可追溯，而不是先追求形式上的极简
- 默认优先 UI 承接，不为轻量化重做一套前端展示体系
- 默认优先低复杂度，不把多类高风险变量混入单一阶段
- 默认优先先冻结根级真相源，再进入任何正式实现

## 四、允许路线
- 允许同步根级文档，使当前仓库正式切换为 `Rento-miniX` 主线叙事
- 允许明确旧 `Rento` 存量运行线、`Rento-legacy` 备份仓与当前仓库之间的关系
- 允许冻结未来目标栈口径：`React + Vite + Hono + PostgreSQL + Caddy + systemd`
- 允许把 ORM 保持为候选层，不在本阶段提前永久写死
- 允许盘点并抽取内嵌 `Rento-miniX/` 目录中的有效规划内容
- 允许补充 Git remote、回滚基线与当前仓库状态说明
- 允许明确旧容器化运行线只承担当前存量运行与回滚参考职责

## 五、禁止路线
- 禁止在 `phase06` 中直接迁移页面、API、ORM 或部署脚本
- 禁止在 `phase06` 中大改当前 UI 视觉风格、布局体系与设计语言
- 禁止因为仓库已经改名就假装技术栈已经完成切换
- 禁止把旧容器化运行线误写成未来 `Rento-miniX` 的正式部署主线
- 禁止把 `Rento-legacy` 重新引入为当前仓库默认 push remote、默认上游或并行第二真相源
- 禁止让内嵌 `Rento-miniX/` 目录继续长期争夺根级真相源

## 六、统一方案语义
- 当前仓库逻辑主线已切换为 `Rento-miniX`
- 旧 `Rento` 的现有实现代码仍是后续原地重构的直接参考基线
- `Rento-legacy` 负责保留旧主线的可追溯备份
- 当前主动开发 remote 固定收口为 `origin -> Rento-miniX`
- 当前无需额外新增冻结 tag
- 仓库切换说明继续由根级 `README.md`、`AGENTS.md`、`architecture_map.md` 与 `plan.md` 承接，不单独新增切换说明文档
- 当前本地目录仍保留 `/home/dell/Projects/Rento`；在未出现明确实施收益前，不建议立即改名为 `Rento-miniX`
- 当前 `Rento` 前端 UI 展示效果默认冻结，非必要不擅自改变
- PostgreSQL 继续固定为数据库主线
- 未来目标栈固定口径为：`React + Vite + Hono + PostgreSQL + Caddy + systemd`
- ORM 当前只冻结为候选层，后续在正式数据访问层阶段再统一决策
- 旧容器化运行线只保留“当前存量运行线参考 + 回滚基线”职责
- 当前已冻结首个正式实现阶段名称为 `phase07-app-shell-and-runtime-foundation`，但这不等同于当前可直接进入其 `/plan`
- 在进入 `phase07` `/plan` 前，仍需先冻结完整 `Hono` 版路线图、模块迁移分类与 `Rento-miniX/` 文件级吸收映射
- 当前推荐后续阶段顺序口径为：

```text
phase07-app-shell-and-runtime-foundation
    ->
phase08-api-and-auth-foundation
    ->
phase09-domain-service-migration
    ->
phase10-data-access-and-migration-closure
    ->
phase11-deployment-cutover-and-cutline-closure
```
- 当前模块迁移分类口径固定为：`直接复用 / 包一层适配 / 必须重写 / 延后决策`

## 七、内嵌目录治理口径
- 原 `Rento-miniX/` 内嵌目录在 `phase06` 期间只承担前置规划输入材料职责，当前已完成实际删除
- 该目录中的有效治理结论已经由根级真相源与 `docs/phase06_*` 承接，不再保留任何并行独立真相源入口
- 其中 `Rento-miniX/README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`global_skills.md`、`project_skills.md`、`plan.md` 的有效治理结论，已由根级同名文件承接
- 其中 `Rento-miniX/docs/rento_minix_solution_overview.md`、`docs/rento_to_minix_transition_workflow.md` 与 `docs/phase01_*` 的有效阶段判断，已由根级 `plan.md`、`architecture_map.md` 与 `docs/phase06_*` 承接
- 上述文件当前只通过历史说明保留其治理轨迹，不再作为后续 `/spec`、实现或目录治理的直接真相源
- 该目录的清理顺序曾固定为：

```text
先抽取有效内容
    ->
再完成根级文档吸收
    ->
再复核是否仍有引用
    ->
最后再清理目录
```

## 八、内嵌目录抽取与删除门禁
- 允许抽取的内容包括：`Rento` 与 `Rento-miniX` 的关系冻结、UI 默认承接、PostgreSQL 固定主线、低复杂度重构原则、阶段职责拆分与审核停顿门禁
- 只保留为临时输入材料的内容包括：早期面向独立新仓库的目录预制设想、旧阶段命名与顺序说明，以及已被 `phase06` 更高优先级文档覆盖的历史规划表达
- 删除 `Rento-miniX/` 目录前，必须同时满足两类条件：
  - 有效内容已被根级真相源或 `docs/phase06_*` 明确吸收
  - 仓库内已完成引用复核，不再存在把该目录视为正式主线、正式实现目录或当前阶段有效依赖的引用
- 上述条件已在 `phase06` 内完成并通过复核，因此该目录已进入并完成实际清理步骤

## 九、统一验证要求
- `phase06` 重点验证文档结构、主线切换口径与仓库状态，而不是验证运行时代码
- 至少确认：
  - 根级文档已成组同步
  - `plan.md` 与 `phase06 dev_plan` 职责已分离
  - 当前仓库、`Rento-legacy` 与旧运行线关系已明确
  - 原内嵌 `Rento-miniX/` 目录的角色、退出条件与删除结果已明确
  - 后续首个正式实现阶段 `phase07-app-shell-and-runtime-foundation` 已具备清晰承接入口
  - `Hono` 版完整 Phase 路线图、模块分类与文件级吸收映射已可直接审核

## 十、阶段停顿门禁
- 当前阶段文档一旦产出完成，必须停止并等待审核
- 未经审核，不得直接进入 `phase07-app-shell-and-runtime-foundation` 的 `/plan`、`/spec` 或任何正式实现子任务
- 后续任何阶段都不得绕开本共享基线重新定义当前仓库、`Rento-legacy` 与旧实现代码之间的关系
