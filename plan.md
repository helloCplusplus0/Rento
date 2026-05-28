# plan.md

## 当前默认入口
- 当前默认工作流：`真实场景验证与 fix 闭环`
- 当前阶段目标：优先通过真实场景数据验证主链机制，按 `issue -> analysis -> /spec -> 修复 -> 验收 -> 提交` 的闭环方式处理新发现问题，而不是直接扩写新功能。
- 当前执行方式：新问题先进入 `docs/fix/fix_XXX_issue_<topic>.md`；完成根因与方案分析后，在 `docs/fix/` 下产出 `fix_XXX_analysis_<topic>.md`；未经 `analysis` 文档冻结与审核，不直接进入 `/spec`。
- 当前下一步：继续围绕 `docs/fix/` 中的真实问题推进 fix 闭环；`phase05-pwa-delivery-*` 已完成对 PWA 相关议题的承接与落地，后续不再将其视为待切换候选阶段。
- 当前阶段说明：`phase05-pwa-delivery-*` 已完成，当前默认重新回到 fix 工作流。

## 阶段顺序

### phase01-restart-foundation
- 目标：完成项目级治理文档、目录归档、文档去漂移、PostgreSQL-only 口径统一。
- 关键交付：
  - `AGENTS.md`
  - `project_rules.md`
  - `architecture_map.md`
  - `plan.md`
  - 历史任务文档归档
  - README / QUICK_START / DEPLOYMENT / ENVIRONMENT_GUIDE / `.env.example` 同步
- 验收条件：
  - 顶层文档不再引用其他项目内容
  - 主文档不再把 SQLite 当作当前支持方案传播
  - `docs/task_*.md` 不再占据主文档路径
  - 当前仓库结构和说明一致
- 当前结论：
  - 已完成
  - 已具备恢复开发条件，但尚未满足公网发布条件

### phase02-auth-gate
- 目标：补齐最小认证门禁，阻断公网裸奔风险。
- 关键交付：
  - 登录页与登录/登出 API
  - 页面与 API 的统一认证策略
  - 基于 `httpOnly cookie` 的最小 Session 方案
  - 最小角色模型（至少 `ADMIN`）
  - 鉴权相关环境变量和文档
- 验收条件：
  - 未登录用户无法访问核心业务页与写 API
  - 已登录管理员可正常访问核心业务页面和 API
  - 页面门禁与 API 门禁口径一致
  - 公网部署具备最小可接受安全边界
- 当前结论：
  - 已完成
  - 页面和核心业务 API 均已接入最小认证闭环

### phase03-consistency-hardening
- 目标：修复核心业务链的一致性问题与历史语义漂移。
- 关键交付：
  - 房间/合同/账单/仪表的删除与状态门禁清单
  - 多仪表历史保留策略收口
  - 关键查询和金额语义复核
  - 迁移锁与数据库口径治理方案
- 推荐子任务顺序：
  - `phase03-consistency-hardening-01-boundary-and-shared-baseline-freeze`
  - `phase03-consistency-hardening-02-delete-guard-and-history-preservation`
  - `phase03-consistency-hardening-03-billing-query-and-dashboard-semantic-closure`
  - `phase03-consistency-hardening-04-migration-compatibility-exit-plan`
- 验收条件：
  - 关键状态流转有明确规则
  - 不再存在“文档正确、代码行为相反”的主链路问题
- 当前结论：
  - 已完成
  - 已为 `phase04` 的性能治理、观测治理与辅助入口治理提供稳定上游前提

### phase04-performance-and-ops
- 目标：在安全与一致性稳定后，再处理查询性能、运维可观测性与调试辅助入口治理。
- 关键交付：
  - 列表接口数据库侧优化
  - 健康检查与日志补强
  - dev-only 页面分类和门禁
- 推荐子任务顺序：
  - `phase04-performance-and-ops-01-baseline-and-scope-freeze`
  - `phase04-performance-and-ops-02-query-performance-closure`
  - `phase04-performance-and-ops-03-observability-and-health-hardening`
  - `phase04-performance-and-ops-04-dev-only-entry-classification-and-gating`
- 验收条件：
  - 关键接口性能达标
  - 运行辅助页面不再污染正式业务入口
- 当前结论：
  - 已按顺序完成 `phase04-performance-and-ops-01-baseline-and-scope-freeze`、`phase04-performance-and-ops-02-query-performance-closure`、`phase04-performance-and-ops-03-observability-and-health-hardening`、`phase04-performance-and-ops-04-dev-only-entry-classification-and-gating`
  - 当前阶段交付已收口；若需继续推进，必须先进入新一轮 `/plan`，再决定新的阶段目标与工作流

### phase05-pwa-delivery
- 目标：在保持单一 Next.js Web 主线、单 UI 与低复杂度前提下，把 Rento 收口为受控安卓优先、可安装、可解释、可维护的私有管理 Web App。
- 关键交付：
  - 正式支持矩阵、环境分层与退化策略
  - 安装壳、manifest、图标与启动体验收口
  - 最小 service worker、更新策略与最小离线兜底
  - 关键业务页移动端可用性收口
  - 私有部署、安装流程与发布前验收说明
- 推荐子任务顺序：
  - `phase05-pwa-delivery-01-baseline-and-support-matrix-freeze`
  - `phase05-pwa-delivery-02-install-shell-and-manifest-hardening`
  - `phase05-pwa-delivery-03-service-worker-and-update-strategy`
  - `phase05-pwa-delivery-04-mobile-layout-and-key-page-usability-closure`
  - `phase05-pwa-delivery-05-private-deployment-and-installation-readiness`
- 验收条件：
  - 移动端主线已经明确冻结为单一 Web 主线，不回退到 Flutter / 原生双线
  - 正式支持浏览器中可完成安装、启动、更新与失败退化闭环
  - 关键业务页面在主流手机尺寸下具备可接受可用性
  - 安装与缓存增强不破坏正常 Web 访问主线与既有安全边界
- 当前结论：
  - 已完成
  - 已完成阶段级文档与对应实现落地：
    - `docs/phase05_pwa_delivery_architecture_plan.md`
    - `docs/phase05_pwa_delivery_dev_plan.md`
    - `docs/phase05_pwa_delivery_shared_baseline.md`
  - 当前默认工作流已重新回到“真实场景验证与 fix 闭环”

## 当前阶段结论
- 当前项目具备继续演进的业务骨架，不建议重写。
- 当前最优策略是“真实场景验证与 fix 闭环”，而不是立刻叠加新功能。
- 当前默认推进方向：先用真实问题验证主链稳定性与数据语义；数据统计分析等扩展功能默认后置，待真实数据与使用反馈进一步明确后再评估。
- `phase05-pwa-delivery-*` 已完成对移动端/PWA 交付议题的统一承接与落地；`fix_008` 不再继续进入 `/spec` 或实现，当前默认重新回到 fix 闭环。

## 阶段执行工作流
- 当推进方向不明确时，先执行 `/plan`，在 `.trae/documents/` 下生成阶段推进计划文档，作为本轮阶段判断的临时承接位。
- `/plan` 完成前，必须先同步 `AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md` 与 `architecture_map.md`，确保顶层真相源一致。
- 每个 `phase*` 默认先产出 `docs/phaseX_<workflow>_architecture_plan.md` 与 `docs/phaseX_<workflow>_dev_plan.md`；存在共享边界时，再补 `docs/phaseX_<workflow>_shared_baseline.md`。
- 阶段级文档产出后即停止工作流，等待用户审核；未经用户明确批准，禁止直接进入 `/spec` 或实现。
- 用户审核后，按 `dev_plan` 的子任务顺序逐个进入 `/spec`、开发、验收、提交并推送；每个子任务通过验收后再进入下一个子任务。
- 整个 `phase*` 的 `dev_plan` 执行完毕后，若方向仍不明确，再回到下一轮 `/plan`。
- `phase04` 完成后，当前默认进入真实场景验证与 fix 闭环：
  - 先写 `docs/fix/fix_XXX_issue_<topic>.md`
  - 再写 `docs/fix/fix_XXX_analysis_<topic>.md`
  - 经审核后再进入 `/spec`
  - 最后按修复、验收、提交并推送的顺序闭环
- fix 闭环期间，若问题已经超出局部修补边界，必须重新回到 `/plan`，而不是在单个 fix 中顺手扩写成新阶段。
- `fix_008` 已作为一次已完成的升级判断示例：当议题从“局部移动端适配”升级为“PWA 交付形态与阶段级支持矩阵”时，应终止 fix 实施路径，转由 `phase05-pwa-delivery-*` 承接。

## 历史说明
- 早期阶段围绕 MVP 功能、UI 落地和 SQLite 本地开发展开。
- 后续阶段转向 PostgreSQL 与容器化部署，但顶层文档和部分历史资产未同步收口。
- 当前重启阶段以“去历史漂移、补安全门禁、保持 UI 稳定”为核心原则。
