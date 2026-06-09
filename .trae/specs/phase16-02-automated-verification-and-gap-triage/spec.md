# Phase16 Automated Verification And Gap Triage 规格

## Why
`phase16-02` 需要把 `phase16-01` 已冻结的四类 parity matrix 转换成可执行的自动化验证组合，并把失败项统一分级为环境问题、合理适配或真实迁移遗漏。否则后续 `phase16-03 ~ phase16-04` 会在缺少工程证据的情况下提前讨论 cutover、rollback 与 legacy 退出。

## What Changes
- 冻结 `phase16-02` 的固定自动化验证命令集合与执行顺序。
- 规定每条验证命令的结果记录格式、失败分级规则与 blocker 判定方式。
- 规定自动化验证结果必须回写到 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`，不得散落到临时记录。
- 规定发现真实缺口时，必须映射到具体页面/API/PWA/部署路径与真实文件。
- 规定无法执行的命令必须记录阻塞原因、是否构成 blocker 与临时替代验证路径。

## Impact
- Affected specs: `phase16-parity-verification-cutover-and-legacy-exit`、`phase16-01-freeze-evidence-inventory-and-parity-matrix`、`phase15-minix-pwa-and-runtime-parity`、`phase14-api-query-parity-and-legacy-route-drain`、`phase11-deployment-cutover-and-cutline-closure`
- Affected code: `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`、`docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`、`README.md`、`AGENTS.md`、`plan.md`、`architecture_map.md`、`DEPLOYMENT.md`、`package.json`、`scripts/pwa-smoke-check.sh`、`scripts/health-check.sh`、`scripts/phase09-05-main-flow-smoke.ts`、`scripts/phase14-06-query-cutover-smoke.ts`

## ADDED Requirements
### Requirement: Phase16 Fixed Automated Verification Set
系统 SHALL 为 `phase16-02` 提供固定的自动化验证组合，并以 `phase16-01` 的四类 parity matrix 作为统一输入。

#### Scenario: 固定命令集可复用
- **WHEN** 团队执行 `phase16-02`
- **THEN** 会按同一套命令集合依次验证 lint、type-check、build、legacy route 审计、主链 smoke、query cutover smoke、PWA build、PWA smoke 与 health-check

#### Scenario: phase16-01 结果直接继承
- **WHEN** 团队解释某条自动化验证结果
- **THEN** 能直接映射到 `phase16-01` 已冻结的页面/API/query/PWA/deploy matrix，而不需要重新定义验证对象

### Requirement: Phase16 Verification Result Recording
系统 SHALL 为 `phase16-02` 提供统一的自动化验证结果回写格式，保证每条命令都有单独结论。

#### Scenario: 成功命令可审计
- **WHEN** 某条验证命令执行成功
- **THEN** `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md` 会记录命令、结果摘要、关联 matrix 与结论

#### Scenario: 失败命令不会丢失上下文
- **WHEN** 某条验证命令失败或无法执行
- **THEN** 文档会记录失败原因、影响范围、是否构成 blocker 与临时替代验证路径

### Requirement: Phase16 Gap Triage Classification
系统 SHALL 为 `phase16-02` 提供统一的 gap triage 规则，把失败项分为环境问题、合理适配或真实迁移遗漏。

#### Scenario: 环境问题被单独隔离
- **WHEN** 失败由本地运行环境、依赖缺失、证书条件、服务未启动或外部前置条件未满足导致
- **THEN** 该失败会被归类为环境问题，并写出是否阻断后续阶段

#### Scenario: 合理适配不被误判为缺口
- **WHEN** 失败源于已知技术适配差异，且不影响正式业务交付、PWA 最小能力与部署主线
- **THEN** 该失败会被归类为合理适配，而不会被上调为迁移遗漏

#### Scenario: 真实迁移遗漏必须可追溯
- **WHEN** 某条验证暴露出真实产品缺口
- **THEN** 该失败会被映射到具体页面/API/PWA/部署路径与真实文件，并被标记为 `parity-blocker`

### Requirement: Phase16 Verification Boundary
系统 SHALL 限定 `phase16-02` 只负责自动化验证与 gap triage，不提前给出人工验收、cutover 最终结论或 legacy 退出判断。

#### Scenario: 不越界到 phase16-03
- **WHEN** 团队执行 `phase16-02`
- **THEN** 不会提前写入正式 HTTPS 人工验收、部署演练或回滚演练结果

#### Scenario: 不越界到 phase16-04
- **WHEN** 团队总结 `phase16-02`
- **THEN** 不会提前给出 legacy 资产保留/退出最终结论，只会提供自动化验证事实与 triage 结果

## MODIFIED Requirements
### Requirement: Phase16 Dev Plan Result Sections
`docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md` 在 `phase16-02` 中 SHALL 从“预留回写位”升级为“实际自动化验证记录入口”，并明确：
- 每条验证命令的执行结果
- 失败项的 triage 分类
- blocker / non-blocker 说明
- 临时替代验证路径

#### Scenario: dev_plan 成为自动化验证真相源
- **WHEN** 团队查看 `phase16-02` 的工程结果
- **THEN** 不需要再去终端历史或临时笔记寻找命令结果，而是直接在 `dev_plan` 中看到完整记录

## REMOVED Requirements
### Requirement: None
**Reason**: 本子任务只新增 `phase16-02` 的验证与 triage 规则，不移除既有阶段能力。
**Migration**: 无。
