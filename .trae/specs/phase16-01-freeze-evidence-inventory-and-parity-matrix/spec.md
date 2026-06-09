# Phase16 Evidence Inventory And Parity Matrix Spec

## Why
`phase16-01` 需要把 `phase11`、`phase13`、`phase14`、`phase15` 已完成的结果收口为单一证据入口，并生成页面、API/query、PWA/runtime、deploy/cutover/rollback 四类 parity matrix。否则后续 `phase16-02 ~ phase16-04` 会继续各自引用不同文档、脚本与 legacy 资产，重新形成多套解释。

## What Changes
- 冻结 `phase16-01` 的输入边界、证据来源、matrix 字段结构与差异分类规则。
- 规定页面 parity matrix、API/query parity matrix、PWA/runtime parity matrix、deploy/cutover/rollback matrix 的统一记录粒度。
- 规定 `parity-blocker`、`acceptable-adaptation`、`non-blocking-legacy-reference` 三类差异的统一判定口径。
- 规定四类 parity matrix、自动化验证结果、人工验收记录、cutover 审核包与 legacy 退出判断的固定落位。
- 规定根级真相源在 `phase16-01` 中只允许同步阶段状态、证据入口与单一解释，不允许顺带打开正式业务 API 迁移、页面重设计或 PWA 新方案。

## Impact
- Affected specs: `phase16-parity-verification-cutover-and-legacy-exit`、`phase15-minix-pwa-and-runtime-parity`、`phase14-api-query-parity-and-legacy-route-drain`、`phase13-frontend-page-parity-implementation`、`phase11-deployment-cutover-and-cutline-closure`
- Affected code: `docs/phase16_parity_verification_cutover_and_legacy_exit_architecture_plan.md`、`docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`、`docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`、`README.md`、`AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md`、`architecture_map.md`、`DEPLOYMENT.md`、`server/lib/legacy-route-inventory.ts`、`src/minix/routes/*`、`src/app/**/page.tsx`、`src/app/api/**/route.ts`

## ADDED Requirements
### Requirement: Phase16 Unified Evidence Inventory
系统 SHALL 为 `phase16-01` 提供单一的证据盘点入口，把 `phase11`、`phase13`、`phase14`、`phase15` 的完成结果收口为当前阶段可直接复用的输入集合。

#### Scenario: 上游阶段结果可直接复用
- **WHEN** 团队执行 `phase16-01`
- **THEN** 能从同一套证据清单中看到页面、API/query、PWA/runtime、deploy/cutover/rollback 的直接输入，而不需要重新定义来源

#### Scenario: 盘点边界不越界
- **WHEN** 团队建立 `phase16-01` 的证据范围
- **THEN** 只会冻结输入与解释，不会顺带进入正式业务 API 迁移、页面重设计、PWA 新方案重做或 legacy 资产删除

### Requirement: Phase16 Four Parity Matrices
系统 SHALL 为 `phase16-01` 提供四类 parity matrix 的统一字段结构、证据来源与差异分类规则。

#### Scenario: 页面 parity matrix 可审计
- **WHEN** 团队查看任一正式业务页面
- **THEN** 能看到旧页面路径、新页面路径、页面类型、当前结论、证据来源与差异说明

#### Scenario: API/query parity matrix 可追溯
- **WHEN** 团队查看任一旧 API route
- **THEN** 能看到 route path + method、inventory category、formal host、compat/bridge host、依赖面、退出条件与最终判定

#### Scenario: PWA 与部署 matrix 不再散落
- **WHEN** 团队查看 PWA/runtime 或 deploy/cutover/rollback 结论
- **THEN** 能在固定 matrix 中看到能力项、环境结果、差异分类、验证证据与最终状态

### Requirement: Phase16 Difference Classification Rule
系统 SHALL 为 `phase16-01` 提供 `parity-blocker`、`acceptable-adaptation`、`non-blocking-legacy-reference` 三类差异的单一判定规则。

#### Scenario: blocker 判定单值化
- **WHEN** 某个旧入口仍承担正式业务主职责，或阻断纯新主线正式交付
- **THEN** 该差异会被归类为 `parity-blocker`

#### Scenario: 宿主适配差异不被误判
- **WHEN** 某个差异仅由 `Vite + React Router + Hono + systemd/Caddy` 新路线带来，且不影响主链语义、历史保留、PWA 最小能力与正式部署
- **THEN** 该差异会被归类为 `acceptable-adaptation`

#### Scenario: legacy 参考项保持边界
- **WHEN** 旧页面、旧 API、旧 PWA 入口或旧容器化资产只承担原型参考、compat 包装、回滚基线或对照职责
- **THEN** 该差异会被归类为 `non-blocking-legacy-reference`

### Requirement: Phase16 Evidence Output Location
系统 SHALL 为 `phase16-01` 固定证据产物落位，避免后续实施阶段重新形成第二套审计真相源。

#### Scenario: 四类 matrix 有固定落位
- **WHEN** 团队完成 `phase16-01`
- **THEN** 四类 parity matrix 统一落位到 `docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`

#### Scenario: 过程记录有固定落位
- **WHEN** 团队继续执行 `phase16-02 ~ phase16-04`
- **THEN** 自动化验证结果、人工验收、cutover 审核包、回滚演练与 legacy 退出判断统一回写到 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`，并由根级真相源与 `DEPLOYMENT.md` 引用摘要

## MODIFIED Requirements
### Requirement: Phase16 Root Truth Source Synchronization
`phase16` 的根级真相源同步要求在 `phase16-01` 中被进一步明确为：
- 统一写明 `phase16` 已完成 `/plan` 与阶段文档冻结，当前进入 `phase16-01 ~ phase16-04` 实施
- 统一写明 `phase16-01` 只负责证据盘点、matrix 冻结与差异分类，不承担正式业务 API 迁移职责
- 统一写明四类 parity matrix、cutover 审核包与 legacy 退出判断的固定入口

#### Scenario: 根级状态不再分裂
- **WHEN** 团队读取 `README.md`、`AGENTS.md`、`plan.md`、`architecture_map.md`、`DEPLOYMENT.md`
- **THEN** 不会再看到“准备进入 `phase16 /plan`”或“阶段文档仍在起草”的旧表述

## REMOVED Requirements
### Requirement: None
**Reason**: 本子任务只冻结 `phase16-01` 的证据盘点与 matrix 规则，不移除既有阶段能力。
**Migration**: 无。
