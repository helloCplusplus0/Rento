# Phase11-05 文档一致性与部署演练收口 Spec

## Why
`phase11-01 ~ phase11-04` 已分别收口正式部署主线、预构建产物链、环境模板、健康检查、发布门禁与 legacy 回滚基线，但最终验收仍缺少一次面向顶层真相源和阶段文档的整体一致性复核。若不把最小验证要求、部署演练记录要求与后续 `/spec` 输入统一冻结，`phase11` 很容易再次出现“根级文档、阶段文档、部署说明、spec 状态不同步”的漂移。

## What Changes
- 复核并收口顶层真相源、`DEPLOYMENT.md` 与 `docs/phase11_*` 的阶段状态和互链关系
- 冻结 `phase11` 当前轮仅文档变更时的最小验证要求
- 冻结后续实施阶段必须执行的最低工程验证命令与部署演练记录要求
- 形成“正式部署主线 + legacy 回滚基线 + 验证链 + 后续输入”单一闭环说明
- 不新增部署实现代码，不在本任务直接执行正式 cutover

## Impact
- Affected specs: `phase11-deployment-cutover-and-cutline-closure`
- Affected code: `AGENTS.md`, `plan.md`, `architecture_map.md`, `project_rules.md`, `README.md`, `DEPLOYMENT.md`, `docs/phase11_deployment_cutover_and_cutline_closure_*`, `docs/phase10_*`

## ADDED Requirements
### Requirement: 顶层真相源一致性闭环
系统 SHALL 保证 `phase11` 根级真相源、部署说明与阶段文档在阶段状态、正式/legacy 边界和当前下一步上保持单一解释。

#### Scenario: 复核根级真相源
- **WHEN** 文档复核 `AGENTS.md`、`plan.md`、`architecture_map.md`、`project_rules.md`、`README.md` 与 `DEPLOYMENT.md`
- **THEN** 各文件对 `phase11` 当前状态的表述必须一致
- **AND** 各文件对正式部署主线与 legacy 回滚基线的边界表述必须一致
- **AND** 不得再出现“待审核”和“已批准 spec 顺序实现中”混写

### Requirement: Phase11 阶段文档互链闭环
系统 SHALL 保证三份 `docs/phase11_*` 文档齐备、互链正确，且与 `phase11-01 ~ phase11-04` 的已批准 spec 实现状态一致。

#### Scenario: 复核 phase11 文档
- **WHEN** 复核 `docs/phase11_*`
- **THEN** `architecture_plan`、`dev_plan` 与 `shared_baseline` 必须互相引用正确
- **AND** 必须明确 `phase11-01 ~ phase11-04` 已完成当前轮收口
- **AND** 必须明确 `phase11-05` 负责最终文档一致性、最低验证要求与部署演练记录要求冻结

### Requirement: 文档最小验证要求
系统 SHALL 冻结 `phase11` 当前轮若仅涉及文档时的最小验证要求，避免后续文档更新再次脱离真实文件路径与状态。

#### Scenario: 仅文档变更验证
- **WHEN** `phase11` 某轮变更只涉及文档
- **THEN** 至少完成 `docs/phase11_*` 互链复核
- **AND** 至少完成被引用路径存在性复核
- **AND** 至少确认根级真相源与 `DEPLOYMENT.md` 当前状态一致

### Requirement: 后续实施最低工程验证命令
系统 SHALL 冻结后续部署相关实施或发布验证前必须执行的最低工程验证命令。

#### Scenario: 进入后续实施或发布验证
- **WHEN** 后续 `phase11` 任务涉及实现、演练或正式切线验证
- **THEN** 至少执行 `npm run lint`
- **AND** 至少执行 `npm run type-check`
- **AND** 至少执行 `npm run build:minix`
- **AND** 至少执行 `npm run audit:phase09:legacy-routes`
- **AND** 条件允许时执行 `npm run smoke:phase09:all`

### Requirement: 部署演练记录要求
系统 SHALL 冻结部署演练与回滚演练的最小记录要求，确保后续 cutover 审核有可追溯依据。

#### Scenario: 记录部署演练
- **WHEN** 后续阶段执行正式部署演练或回滚演练
- **THEN** 记录必须至少包含演练时间、目标环境、执行命令、健康检查结果、主链 smoke 结果、回滚触发条件与最终结论
- **AND** 记录必须明确演练针对的是正式主线验证还是 legacy 回滚验证
- **AND** 记录必须可被根级真相源或阶段文档引用

## MODIFIED Requirements
### Requirement: Phase11 当前结论
`phase11` 当前结论必须从“分散在多份文档中的实现状态”升级为“根级真相源、阶段文档、验证命令与演练记录要求已形成闭环”的状态。

## REMOVED Requirements
### Requirement: Phase11 后续验证要求只分散在单个 spec 或单个文档中
**Reason**: 这会让部署演练、工程验证和最终 cutover 审核缺少统一入口，增加文档漂移风险。
**Migration**: 将最小文档验证要求、最低工程验证命令与部署演练记录要求统一冻结到根级真相源、`DEPLOYMENT.md` 与 `docs/phase11_*` 的闭环说明中。
