# Phase16 Source Alignment And Cutover Packet 规格

## Why
当前开发环境不具备合规 HTTPS 条件，无法在本地对 `phase16-03` 完成正式 Android/Chrome 安装、更新、离线与部署演练验收。如果继续强行要求本轮补齐人工验收，会把阶段推进绑定到当前环境限制，而不是先完成可由源代码与文档直接证明的功能对齐、cutover 审核包结构冻结与云端复验前置准备。

## What Changes
- 把 `phase16-03` 的当前轮重点从“立即执行人工浏览器验收与部署/回滚演练”调整为“完成源码层对齐复核、cutover 审核包字段冻结、待真实云端复验的记录占位与引用入口收口”。
- 明确区分“当前轮可在本地完成的源码/脚本/文档对齐验证”与“必须延后到真实云服务器 + 合规 HTTPS 环境执行的人工验收”。
- 规定 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md` 中 `phase16-03` 回写内容必须包含已完成部分、待云端执行部分、阻塞原因、触发条件与引用入口。
- 规定 cutover 审核包当前轮至少要具备验证命令、健康检查、主链 smoke、PWA 结果、部署/回滚演练记录模板、回滚触发条件与最终结论占位。
- 规定本轮不伪造人工验收结果、不伪造正式部署演练记录、不伪造 legacy 回滚演练记录。

## Impact
- Affected specs: `phase16-parity-verification-cutover-and-legacy-exit`、`run-phase16-02-automated-verification-and-gap-triage`、`phase15-minix-pwa-and-runtime-parity`、`phase11-deployment-cutover-and-cutline-closure`
- Affected code: `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`、`docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`、`docs/phase16_parity_verification_cutover_and_legacy_exit_architecture_plan.md`、`README.md`、`AGENTS.md`、`plan.md`、`architecture_map.md`、`DEPLOYMENT.md`

## ADDED Requirements
### Requirement: Phase16 Source-Level Acceptance Boundary
系统 SHALL 允许 `phase16-03` 在当前轮以源码层对齐和 cutover 审核包冻结为主，而不是强制要求在不具备合规 HTTPS 的开发环境中完成正式人工验收。

#### Scenario: 本地环境不具备合规 HTTPS
- **WHEN** 当前开发环境无法提供真实云服务器、公认 HTTPS 证书与真实移动端安装条件
- **THEN** `phase16-03` 可以跳过正式人工 HTTPS 验收执行，只保留待云端复验的占位、触发条件与引用入口

#### Scenario: 人工验收不被伪造
- **WHEN** `phase16-03` 记录当前轮结论
- **THEN** 文档只会写入已完成的源码/脚本/文档对齐与待执行事项，不会伪造“已完成人工 HTTPS 验收”或“已完成正式部署/回滚演练”

### Requirement: Phase16 Cutover Packet Placeholder
系统 SHALL 为 `phase16-03` 提供可直接承接云端复验的 cutover 审核包结构。

#### Scenario: cutover 审核包字段完整
- **WHEN** 团队查看 `phase16-03` 的 cutover 审核包
- **THEN** 能看到验证命令、健康检查、主链 smoke、PWA 结果、部署演练、回滚演练、回滚触发条件与最终结论的固定字段或占位

#### Scenario: 云端复验入口明确
- **WHEN** 后续进入真实云服务器验证
- **THEN** 团队能直接沿用 `phase16-03` 中冻结的记录模板与引用入口补齐正式人工验收结果

### Requirement: Phase16 Source Alignment Review
系统 SHALL 为 `phase16-03` 提供源码层对齐复核，确认页面主链、PWA 能力、部署/回滚入口与健康检查链路在代码和文档层面没有新的已知缺口。

#### Scenario: 源码层对齐可追溯
- **WHEN** 团队执行 `phase16-03`
- **THEN** 能基于 `phase16-01` 的 matrix、`phase16-02` 的自动化验证结果、`DEPLOYMENT.md`、PWA/runtime 代码和 legacy 回滚资产清单，给出当前源码层对齐结论

#### Scenario: 新缺口需要被升级
- **WHEN** 在源码复核中发现新缺口
- **THEN** 该缺口会被映射到具体页面/API/PWA/部署路径与真实文件，并作为 blocker 记录到 `phase16` 文档

## MODIFIED Requirements
### Requirement: Phase16 Manual Acceptance And Cutover Packet
`phase16-03` 当前轮 SHALL 修改为：
- 当前轮优先完成源码层对齐复核、cutover 审核包字段冻结与云端复验前置准备
- 本地开发验收与正式 HTTPS 部署验收必须继续区分，但正式 HTTPS 验收允许延后到真实云服务器执行
- 正式部署演练记录与 legacy 回滚演练记录当前轮允许只冻结模板、引用入口、触发条件与待补字段，不强制伪造执行结果

#### Scenario: dev_plan 口径单值化
- **WHEN** 团队读取 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`
- **THEN** 能清楚区分“本轮已完成源码对齐项”和“待云端复验执行项”，而不是把它们混写成已经全部完成

## REMOVED Requirements
### Requirement: Current-round mandatory local manual HTTPS acceptance
**Reason**: 当前开发环境暂时无法满足合规 HTTPS 和真实云服务器条件，强制本轮执行会制造伪结论。
**Migration**: 把正式 Android/Chrome + HTTPS 验收、正式部署演练与 legacy 回滚演练延后到真实云服务器阶段，并在 `phase16-03` 文档中冻结占位、触发条件与引用入口。
