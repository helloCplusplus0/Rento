# Hono 路线图与材料吸收冻结 Spec

## Why
当前 `phase06` 已完成主线切换、内嵌目录角色收口、仓库与 remote 状态收口，也已冻结首个正式实现阶段名称，但仍不足以支撑后续稳定推进。若不先补齐完整 `Hono` 版 Phase 路线图、模块迁移分类与 `Rento-miniX/` 文件级吸收映射，后续仍会退回“先做一点、后面再看”的不稳定推进方式。

## What Changes
- 冻结 `Rento -> Rento-miniX` 的完整 `Hono` 版推荐阶段顺序
- 明确每个后续阶段的粗粒度目标、上下游承接关系与排序理由
- 冻结模块迁移分类口径：`直接复用 / 包一层适配 / 必须重写 / 延后决策`
- 明确 `Rento-miniX/` 内嵌目录的文件级吸收映射与当前保留边界
- 收口当前下一步：在完整路线图与吸收映射审核通过前，不直接进入 `phase07` 的 `/plan`
- 不直接删除 `Rento-miniX/` 目录
- 不直接写 `phase07 ~ phase11` 的全部阶段文档

## Impact
- Affected specs: `phase06` 阶段冻结、完整实施顺序、材料治理、模块迁移分类、后续 `/plan` 入口条件
- Affected code: `AGENTS.md`、`plan.md`、`architecture_map.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`docs/phase06_*`

## ADDED Requirements
### Requirement: 完整 Hono 路线图冻结
系统 SHALL 在 `phase06` 内冻结 `Rento -> Rento-miniX` 的完整 `Hono` 版推荐阶段顺序，而不是只冻结首个正式实现阶段名称。

#### Scenario: 用户查看后续阶段顺序
- **WHEN** 用户阅读 `plan.md`、`docs/phase06_*` 或本 spec
- **THEN** 用户应能看到从 `phase07` 开始的完整推荐阶段顺序
- **AND** 用户应能理解每个阶段的粗粒度目标
- **AND** 用户不需要再通过口头讨论推测后续阶段如何衔接

### Requirement: 阶段承接关系可解释
系统 SHALL 说明每个后续阶段与上下游阶段的承接关系，以及为什么当前顺序优先于其他切法。

#### Scenario: 用户判断当前顺序是否合理
- **WHEN** 用户查看完整路线图
- **THEN** 用户应能理解为什么先做应用壳与运行时基础
- **AND** 用户应能理解为什么 API、领域服务、数据访问层和部署切换被后置
- **AND** 用户应能区分哪些阶段是承载层问题，哪些阶段是业务真相与部署切线问题

### Requirement: 模块迁移分类冻结
系统 SHALL 为当前旧实现模块提供统一迁移分类口径，至少包括 `直接复用`、`包一层适配`、`必须重写` 与 `延后决策` 四类。

#### Scenario: 用户查看旧实现模块处理方式
- **WHEN** 用户查看路线图或结构说明
- **THEN** 用户应能判断核心实体关系、业务语义、页面结构、API 宿主形态、部署入口等分别属于哪一类
- **AND** 用户不需要在正式实现阶段临时讨论某个模块到底该保留、包一层还是推倒重写

### Requirement: 文件级吸收映射冻结
系统 SHALL 给出 `Rento-miniX/` 内嵌目录的文件级吸收映射，明确每个文件当前由谁承接、为何仍保留以及何时允许清理。

#### Scenario: 用户查看内嵌目录治理状态
- **WHEN** 用户查看 `Rento-miniX/` 目录治理说明
- **THEN** 用户应能知道某个具体文件当前由根级真相源承接，还是由 `docs/phase06_*` 承接
- **AND** 用户应能区分哪些内容仅作为历史输入保留
- **AND** 用户应能理解删除该目录前仍需满足哪些前置条件

### Requirement: 后续入口收口
系统 SHALL 把 `phase06` 的当前下一步收口为“先审核完整路线图与吸收映射，再决定是否进入 `phase07` `/plan`”。

#### Scenario: 用户评估当前阶段下一步
- **WHEN** 用户查看 `AGENTS.md`、`plan.md`、`docs/phase06_*`
- **THEN** 用户应能看到当前下一步不是直接进入 `phase07`
- **AND** 用户应能看到必须先审核完整路线图、模块分类与文件级吸收映射

## MODIFIED Requirements
### Requirement: `phase06` 的完成条件
`phase06-minix-replatform` 的完成条件修改为：除完成根级真相源切换、内嵌目录角色收口、仓库与 remote 状态收口，以及首个正式实现阶段冻结外，还必须完成完整 `Hono` 版路线图、模块迁移分类与文件级吸收映射冻结。

#### Scenario: 用户判断 `phase06` 是否已具备后续规划条件
- **WHEN** 用户评估 `phase06` 子任务是否已形成完整上游
- **THEN** 用户应能确认 `phase06` 不只是冻结“边界”和“第一步”
- **AND** 用户应能确认 `phase06` 同时给出了完整后续顺序与材料吸收口径

## REMOVED Requirements
### Requirement: 首阶段名称冻结后即可直接进入 `phase07` `/plan`
**Reason**: 仅冻结首个正式实现阶段名称，仍不足以支撑完整 `Hono` 版原地重构推进，容易再次退回“走一步看一步”。
**Migration**: 先在 `phase06-minix-replatform-05-hono-roadmap-and-material-absorption-freeze` 中补齐完整路线图、模块分类与文件级吸收映射，再审核是否进入 `phase07` `/plan`。
