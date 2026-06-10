# plan.md

> 职责：项目阶段路线图、规划方式与当前状态真相源。
> 本文件承载“阶段顺序、阶段结论、何时开新 `phase`、何时进入 `fix`”，不重复承载硬规则、代码结构说明与项目专属业务规则。

## 当前默认入口
- 当前默认工作模式：`post-phase16` 独立迭代期
- 当前状态：`phase16` 已通过，所有既定 phase 规划已完成，当前没有新的 `phase` 在推进
- 当前正式主线：`Rento-miniX`
- 当前 legacy 定位：旧 `Rento` 与相关 legacy 资产继续保留为只读参考 / 差异对照资产
- 当前下一步：围绕 fix、小步增强与专项治理继续推进；若后续需要启动新阶段，再先同步根级文档并进入 `/plan`
- 当前阶段状态、后续是否开新 `phase`、历史阶段结论，统一以本文件为准

## 本文件如何使用
- `plan.md` 不是只列 `phase` 标题的索引页，而是项目整体推进路线图的单一真相源。
- 当目标很明确但跨度较大时，可以一次规划多个连续 `phase`；例如 `Rento -> Rento-miniX` 原地重构，就一次性规划了 `phase12 ~ phase16` 以保证目标能被完整拆解和最终收口。
- 当目标较小或边界集中时，也可以只规划一个独立 `phase`。
- `phase` 的标题只负责命名阶段，不负责承载全部细节；每个已进入执行的 `phase`，都必须继续下沉到对应的 `docs/phase*_architecture_plan.md`、`docs/phase*_dev_plan.md`、`docs/phase*_shared_baseline.md`。

## `phase` 工作流
1. 在 `plan.md` 先完成整体规划，明确是单 `phase` 还是多 `phase` 推进。
2. 选定当前执行的 `phase` 后，先执行该 `phase` 的 `/plan`，并同步 `AGENTS.md`、`architecture_map.md`、`global_skills.md`、`project_rules.md`、`project_skills.md` 与本文件。
3. 在 `docs/` 下产出该 `phase` 的三份文档：`architecture_plan`、`dev_plan`、`shared_baseline`。
4. 经审核通过后，按 `phase*_dev_plan.md` 中的子任务顺序逐一执行 `/spec`、开发、验收和收口。
5. 若某个目标已不适合继续作为 `fix` 处理，而是影响结构边界、长链路迁移或多模块协同，则应回到本文件重新规划新的 `phase`。

## `fix` 工作流
1. 当前没有新的 `phase` 规划时，默认进入 `fix` 工作模式。
2. 先在 `docs/fix/` 下基于 `fix_issue_template.md` 填写 issue 文档，记录问题摘要、复现前提、实际结果与影响面。
3. 再基于该 issue 文档，按 `fix_analysis_template.md` 产出 analysis 文档，完成根因结论、证据链、候选方案、推荐方案、验收标准与回滚条件。
4. analysis 文档确认后，再按该 fix 的 `/spec`、开发与验收顺序推进。
5. 若某个 fix 已暴露为系统性迁移缺口、结构性治理问题或新的长期目标，则应停止把它继续按普通 fix 推进，并回到本文件评估是否需要新开 `phase`。

## 阶段总览
| 阶段 | 为什么要单独成 phase | 主要交付焦点 | 细节入口 | 当前结论 |
| --- | --- | --- | --- | --- |
| `phase01-restart-foundation` | 先恢复仓库治理、文档和数据库口径，否则后续推进没有统一起点 | 根级文档、目录治理、PostgreSQL-only 基线 | 无独立三件套存量，历史结论以 [plan.md](file:///home/dell/Projects/Rento/plan.md) 与根级真相源为准 | 已完成，具备恢复开发条件 |
| `phase02-auth-gate` | 在继续演进前先补最小安全门禁，避免后台裸奔 | 登录、会话、最小认证闭环与关键页面/API 守卫 | 无独立三件套存量，历史结论以 [plan.md](file:///home/dell/Projects/Rento/plan.md) 与根级真相源为准 | 已完成 |
| `phase03-consistency-hardening` | 先收口主链语义和删除门禁，避免带着错误业务语义继续开发 | 删除门禁、账务语义、主链一致性、迁移兼容项 | [architecture](file:///home/dell/Projects/Rento/docs/phase03_consistency_hardening_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase03_consistency_hardening_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase03_consistency_hardening_shared_baseline.md) | 已完成 |
| `phase04-performance-and-ops` | 需要把性能、健康检查和最小运维能力补齐，支撑后续持续开发与部署 | 查询优化、健康检查、dev-only 入口治理、轻量观测 | [architecture](file:///home/dell/Projects/Rento/docs/phase04_performance_and_ops_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase04_performance_and_ops_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase04_performance_and_ops_shared_baseline.md) | 已完成 |
| `phase05-pwa-delivery` | 旧主线仍需先把 PWA 交付闭环收口，形成后续 parity 参考基线 | 安装、更新、离线兜底、移动端可用性 | [architecture](file:///home/dell/Projects/Rento/docs/phase05_pwa_delivery_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase05_pwa_delivery_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase05_pwa_delivery_shared_baseline.md) | 已完成 |
| `phase06-minix-replatform` | 原地重构正式启动前，必须先冻结路线图、模块分类和真相源切换方式 | 根级真相源切换、内嵌目录吸收、完整路线图冻结 | [architecture](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_shared_baseline.md) | 已完成 |
| `phase07-app-shell-and-runtime-foundation` | 先建立新前端宿主与新服务端运行时承接位，避免大爆炸迁移 | `src/minix/`、`server/`、新运行时入口、最小健康检查 | [architecture](file:///home/dell/Projects/Rento/docs/phase07_app_shell_and_runtime_foundation_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase07_app_shell_and_runtime_foundation_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase07_app_shell_and_runtime_foundation_shared_baseline.md) | 已完成 |
| `phase08-api-and-auth-foundation` | 新宿主落位后，需要先补统一 API/Auth 骨架，再迁主链领域服务 | 统一 `/api` 宿主、认证门禁、错误处理、页面守卫 | [architecture](file:///home/dell/Projects/Rento/docs/phase08_api_and_auth_foundation_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase08_api_and_auth_foundation_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase08_api_and_auth_foundation_shared_baseline.md) | 已完成 |
| `phase09-domain-service-migration` | 业务核心必须先从旧宿主抽到共享服务层，才能继续后续数据层和 API 收口 | 合同、账单、仪表、抄表、退租、删除门禁主链迁移 | [architecture](file:///home/dell/Projects/Rento/docs/phase09_domain_service_migration_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase09_domain_service_migration_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase09_domain_service_migration_shared_baseline.md) | 已完成 |
| `phase10-data-access-and-migration-closure` | 共享领域服务形成后，需要收口正式数据访问层与迁移兼容边界 | 长期数据访问层、查询分层、事务边界、迁移兼容项 | [architecture](file:///home/dell/Projects/Rento/docs/phase10_data_access_and_migration_closure_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase10_data_access_and_migration_closure_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase10_data_access_and_migration_closure_shared_baseline.md) | 已完成 |
| `phase11-deployment-cutover-and-cutline-closure` | 新主线可运行后，需要冻结正式部署主线、回滚口径和发布门禁 | `Caddy + systemd + Hono + PostgreSQL` 正式部署链与发布要求 | [architecture](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_shared_baseline.md) | 已完成 |
| `phase12-frontend-parity-and-shell-cutover` | 页面迁移前必须先冻结页面范围、页面映射和 UI 保真规则 | 页面事实表、页面映射、复用矩阵、后续多阶段路线图 | [architecture](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md) | 已完成 |
| `phase13-frontend-page-parity-implementation` | 需要把冻结的页面蓝图真实迁到 `src/minix`，完成页面层 parity | 正式业务页面迁移、页面装配层、加载/错态边界 | [architecture](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_shared_baseline.md) | 已完成 |
| `phase14-api-query-parity-and-legacy-route-drain` | 页面落位后，必须清掉旧 API/query 中仍承担正式职责的主链入口 | 正式业务 API/query 切入 Hono 宿主、legacy route drain | [architecture](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md) | 已完成 |
| `phase15-minix-pwa-and-runtime-parity` | 页面与 API parity 完成后，再把 PWA/runtime 完整迁到纯新主线 | manifest、service worker、安装/更新、离线与交付链路 | [architecture](file:///home/dell/Projects/Rento/docs/phase15_minix_pwa_and_runtime_parity_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase15_minix_pwa_and_runtime_parity_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md) | 已完成 |
| `phase16-parity-verification-cutover-and-legacy-exit` | 最终需要把页面/API/PWA/部署四类 parity 审核与 legacy 边界收口成单一结论 | parity matrix、自动化验证、cutover 审核包、legacy-exit 决策 | [architecture](file:///home/dell/Projects/Rento/docs/phase16_parity_verification_cutover_and_legacy_exit_architecture_plan.md) / [dev](file:///home/dell/Projects/Rento/docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md) / [baseline](file:///home/dell/Projects/Rento/docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md) | 已完成并通过 |

## 当前结论
- 当前仓库已完成既定 `phase01 ~ phase16` 路线图，不建议重新打开历史阶段职责。
- `Rento-miniX` 已成为唯一正式主线，可以独立继续推进后续开发。
- 当前正式数据访问主线继续固定为 `Prisma + PostgreSQL`；Prisma 替换不属于当前默认路线。
- 旧 `Rento` 页面、旧 API 宿主与旧部署资产默认只作为参考输入、差异对照与后续归档候选，不再承担正式主职责。

## 维护规则
- 若只是 fix、小型增强或治理收口，不新开 `phase`，直接在当前工作模式下推进。
- 若要新开 `phase`，必须先同步 `AGENTS.md`、`project_rules.md`、`architecture_map.md`、`global_skills.md`、`project_skills.md` 与本文件，再进入 `/plan`。
- 各阶段的详细实现、DoD、共享基线与历史证据，统一下沉到对应 `docs/phaseX_*` 文档。
- fix 阶段的现象记录与方案分析，统一下沉到 `docs/fix/fix_*_issue_*.md` 与 `docs/fix/fix_*_analysis_*.md`。
