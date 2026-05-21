# plan.md

## 当前默认入口
- 当前默认工作流：`phase04-performance-and-ops-*`
- 当前阶段目标：在主链一致性稳定后，继续收口关键查询性能、运行可观测性与 dev-only 入口治理。
- 当前执行方式：进入新 `phase*` 前，先通过 `/plan` 同步顶层规范并产出阶段级 `architecture_plan` / `dev_plan`，待用户审核后再逐个子任务进入 `/spec`。
- 当前下一步：完成 `phase04-performance-and-ops-01-baseline-and-scope-freeze` 的文档级验收，冻结共享边界、页面初始分类口径与顶层真相源；待用户明确批准后，再按顺序进入 `phase04-performance-and-ops-02-query-performance-closure`。

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
  - `phase04-performance-and-ops-01-baseline-and-scope-freeze` 负责先冻结共享边界、页面初始分类口径与固定子任务顺序
  - 在 `01` 完成文档级验收并得到用户批准前，不进入 `02`、`03`、`04` 的实现子任务

## 当前阶段结论
- 当前项目具备继续演进的业务骨架，不建议重写。
- 当前最优策略是“治理性重启”，而不是立刻叠加新功能。
- 当前默认推进方向：`phase04-performance-and-ops-*`

## 阶段执行工作流
- 当推进方向不明确时，先执行 `/plan`，在 `.trae/documents/` 下生成阶段推进计划文档，作为本轮阶段判断的临时承接位。
- `/plan` 完成前，必须先同步 `AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md` 与 `architecture_map.md`，确保顶层真相源一致。
- 每个 `phase*` 默认先产出 `docs/phaseX_<workflow>_architecture_plan.md` 与 `docs/phaseX_<workflow>_dev_plan.md`；存在共享边界时，再补 `docs/phaseX_<workflow>_shared_baseline.md`。
- 阶段级文档产出后即停止工作流，等待用户审核；未经用户明确批准，禁止直接进入 `/spec` 或实现。
- 用户审核后，按 `dev_plan` 的子任务顺序逐个进入 `/spec`、开发、验收、提交并推送；每个子任务通过验收后再进入下一个子任务。
- 整个 `phase*` 的 `dev_plan` 执行完毕后，若方向仍不明确，再回到下一轮 `/plan`。

## 历史说明
- 早期阶段围绕 MVP 功能、UI 落地和 SQLite 本地开发展开。
- 后续阶段转向 PostgreSQL 与容器化部署，但顶层文档和部分历史资产未同步收口。
- 当前重启阶段以“去历史漂移、补安全门禁、保持 UI 稳定”为核心原则。
