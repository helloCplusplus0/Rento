# Legacy Runtime Mapping And Exit Conditions Spec

## Why
`phase07-01` 到 `phase07-03` 已建立 `src/minix/` 新前端壳与 `server/` 新运行时承接位，但当前仓库仍同时保留旧 `Next.js` 宿主、旧 `src/app/api/*` 与旧启动脚本。如果不在 `phase07` 结束前明确旧宿主的参考边界、并行关系和退出条件，后续 `phase08` 与 `phase09` 很容易再次出现“双宿主职责漂移”，导致迁移顺序反复回摆。

## What Changes
- 明确旧 `src/app` 在 `phase07` 结束后仍保留的职责边界
- 明确旧 `src/app/api/*` 在 `phase08` 前仍保留的职责边界
- 明确新前端壳 `src/minix/`、新运行时 `server/` 与旧运行线的并行关系
- 明确旧前端壳、旧 API 宿主与旧启动脚本的退出条件
- 明确 `phase08` 与 `phase09` 的直接输入清单
- 不直接执行正式切换、删除旧宿主代码或进入部署切线

## Impact
- Affected specs: `phase07` 新旧宿主职责映射、退出条件冻结、`phase08` API/认证阶段输入、`phase09` 领域服务迁移阶段输入
- Affected code: 根级治理文档、`docs/phase07_*`、`architecture_map.md`、`plan.md`、`AGENTS.md`、旧宿主相关目录 `src/app`、`src/app/api/*`、旧启动脚本 `scripts/dev-entry.mjs` 与 `scripts/start-entry.mjs`

## ADDED Requirements
### Requirement: 旧 `src/app` 必须有明确保留边界
系统 SHALL 明确旧 `src/app` 在 `phase07` 完成后只承担参考基线、存量运行线和未迁移页面壳的兼容职责，而不再作为新前端壳的默认长期主宿主。

#### Scenario: 用户判断旧前端壳是否仍应继续扩写
- **WHEN** 用户查看 `src/app` 与 `src/minix/` 的职责说明
- **THEN** 用户应能明确 `src/minix/` 是新前端壳的正式承接位
- **AND** 用户应能明确旧 `src/app` 在 `phase07` 之后主要保留参考、兼容和未迁移页面的存量职责
- **AND** 用户不应再把新增前端宿主逻辑默认写回旧 `src/app`

### Requirement: 旧 `src/app/api/*` 必须有明确保留边界
系统 SHALL 明确旧 `src/app/api/*` 在 `phase08` 前仍承担存量业务 API、存量认证 API 和存量运行线兼容职责，但其角色应被限定为参考基线与过渡宿主，而不是新 API 的默认落点。

#### Scenario: 用户准备承接新 API 或认证能力
- **WHEN** 用户进入 `phase08-api-and-auth-foundation`
- **THEN** 用户应能明确新增 API、认证会话、中间件与错误处理优先挂载到 `server/`
- **AND** 用户应能明确旧 `src/app/api/*` 仅继续承载未迁移的存量接口
- **AND** 用户不应再把“先能跑起来”理解成必须继续向旧 `src/app/api/*` 扩写新宿主能力

### Requirement: 新旧运行线并行关系必须被明确冻结
系统 SHALL 明确 `src/minix/`、`server/` 与旧 `Next.js` 运行线在 `phase07` 结束后的并行关系，包括开发态、构建态、验证态与存量运行线的职责划分。

#### Scenario: 用户判断当前双宿主如何并行存在
- **WHEN** 用户查看新旧宿主映射说明
- **THEN** 用户应能区分：
- **AND** `src/minix/` 负责新前端壳正式承接位
- **AND** `server/` 负责新服务端运行时正式承接位
- **AND** 旧 `Next.js` 宿主继续承担存量运行线与未迁移能力的参考基线
- **AND** 当前并行并不等于长期双主线并存

### Requirement: 旧宿主退出条件必须可执行
系统 SHALL 明确何时允许切走旧前端壳、旧 API 宿主与旧启动脚本，并将退出条件写成可验证的前置清单，而不是抽象原则。

#### Scenario: 用户判断是否可以退出旧宿主
- **WHEN** 用户检查旧前端壳、旧 API 宿主或旧启动脚本的退出条件
- **THEN** 用户应能看到至少包括承接完成、验证通过、上游依赖迁移完成和回滚条件明确等前置要求
- **AND** 在这些条件未满足前，系统不应鼓励直接删除旧宿主代码或停用旧脚本

### Requirement: `phase08` 与 `phase09` 必须有明确直接输入清单
系统 SHALL 为 `phase08-api-and-auth-foundation` 与 `phase09-domain-service-migration` 输出明确的上游输入清单，避免后续阶段重新搜索“新旧宿主边界应该以谁为准”。

#### Scenario: 用户准备启动后续阶段
- **WHEN** 用户准备进入 `phase08` 或 `phase09`
- **THEN** 用户应能直接获得后续阶段的参考文件、优先迁移入口、存量兼容边界和禁止事项清单
- **AND** 用户应能明确哪些来自 `src/minix/`、哪些来自 `server/`、哪些仍来自旧 `src/app` 与 `src/app/api/*`

## MODIFIED Requirements
### Requirement: `phase07` 对旧 `Next.js` 宿主的理解
`phase07` 对旧 `Next.js` 宿主的理解修改为：旧宿主继续保留为参考基线、存量运行线和回滚基线，但其保留边界、并行关系和退出条件必须在 `phase07-04` 中被正式冻结，而不能仅靠共享基线中的原则描述。

#### Scenario: 用户复核 `phase07` 是否已完成新旧宿主关系冻结
- **WHEN** 用户检查 `phase07` 子任务完成情况
- **THEN** 用户应能确认旧前端壳、旧 API 宿主、旧启动脚本与新宿主之间的关系已明确
- **AND** 用户不应再因“旧宿主还在，所以边界未定义”而反复返工

### Requirement: 后续阶段输入来源
后续阶段输入来源修改为：`phase08` 与 `phase09` 的直接输入不仅来自根级 `plan.md` 与 `docs/phase07_*`，还必须明确列出 `src/minix/`、`server/`、旧 `src/app`、旧 `src/app/api/*`、旧脚本和旧运行线文档各自承担的输入职责。

#### Scenario: 用户启动后续阶段 `/spec`
- **WHEN** 用户启动 `phase08` 或 `phase09` 的 `/spec`
- **THEN** 用户应能直接识别本阶段的“正式宿主输入”“存量参考输入”“暂不迁移输入”
- **AND** 用户不需要再次从仓库中重新推断哪些旧入口仍有效、哪些已经降级为参考

## REMOVED Requirements
### Requirement: 旧宿主是否继续保留可在后续阶段临时判断
**Reason**: 把旧宿主边界和退出条件留到后续阶段临时判断，会让 `phase08`、`phase09` 重新陷入“双宿主职责不清”的反复讨论。
**Migration**: 在 `phase07-04-legacy-runtime-mapping-and-exit-conditions` 中提前冻结旧 `src/app`、旧 `src/app/api/*`、旧启动脚本的保留边界、映射关系、退出条件与后续阶段输入清单。
