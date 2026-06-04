# Phase06 Minix Replatform 开发规划

## 一、文档定位
本文档用于把 `phase06-minix-replatform` 拆分为顺序执行的子任务，确保当前仓库先完成主线切换与治理收口，再进入正式原地重构实现。

## 二、总体推进结论
`phase06` 的执行顺序固定为：

```text
先同步根级真相源
    ->
再冻结内嵌 Rento-miniX 目录的处理策略
    ->
再收口 Git / 仓库 / 文档状态
    ->
再冻结首个正式实现阶段
    ->
最后补齐完整 Hono 路线图与文件级吸收映射
```

原因如下：

- 若不先同步根级真相源，后续任何实现都会继续建立在旧 `Rento` 主叙事上
- 若不先明确内嵌 `Rento-miniX/` 目录的角色，后续文档与实现极易双线并存
- 若不先收口 Git remote、仓库状态与参考说明，后续推送、回滚与阶段审核都会失真
- 若只冻结首个正式实现阶段、却不先补齐完整路线图，后续仍可能回到“走一步看一步”的高风险大改

## 三、任务拆分建议
## phase06-minix-replatform-01-root-truth-source-switch
### 目标
完成根级真相源切换，使当前仓库在文档层明确升级为 `Rento-miniX` 主线仓。

### 范围
- 同步根级 `README.md`
- 同步根级 `AGENTS.md`
- 同步根级 `project_rules.md`
- 同步根级 `architecture_map.md`
- 同步根级 `global_skills.md`
- 同步根级 `project_skills.md`
- 同步根级 `plan.md`
- 必要时补充 `DEPLOYMENT.md` 的状态声明

### 不在范围内
- 不进入任何业务实现代码改动
- 不直接删除旧实现资产
- 不在本子任务中启动 `phase07` 实现

### DoD
- 根级真相源不再继续把当前仓库描述为旧 `Rento` fix 主线
- `plan.md` 与 `docs/phase06_*` 的职责关系明确
- UI 默认承接、PostgreSQL 固定主线、云端不构建等底线已冻结

## phase06-minix-replatform-02-nested-planning-material-closure
### 目标
明确仓库内 `Rento-miniX/` 内嵌目录的角色、可抽取内容、保留边界与清理策略，并完成后续清理前提冻结。

### 范围
- 盘点 `Rento-miniX/` 目录下的顶层文档与 `phase01` 文档
- 明确哪些内容应抽取到根级真相源
- 明确哪些内容只保留为临时输入材料
- 明确何时允许删除该目录
- 明确治理类材料由根级同名文件承接，阶段判断类材料由 `plan.md`、`architecture_map.md` 与 `docs/phase06_*` 承接
- 明确删除前必须先完成“有效内容已吸收 + 引用已复核完成”两类前置条件

### 不在范围内
- 不直接删除目录
- 不把该目录长期升级为根级第二套主线
- 不在本子任务中直接创建归档目录结构

### DoD
- 内嵌 `Rento-miniX/` 目录不再继续争夺真相源
- 后续可按明确顺序执行“抽取 -> 复核 -> 清理”
- 用户能够清楚理解该目录当前的角色
- 用户能够区分“已被根级 / phase06 吸收的有效内容”与“仅临时保留的历史规划材料”
- 用户能够直接理解该目录何时允许删除，以及删除前仍承担什么参考职责
- 上述删除前提已为后续实际删除提供直接门禁依据

## phase06-minix-replatform-03-repository-and-remote-readiness
### 目标
收口原地重构所需的仓库状态，包括 Git remote、仓库说明与回滚基线。

### 范围
- 确认当前 GitHub 侧的 `Rento-miniX` 与 `Rento-legacy` 状态
- 以当前实际状态为准，确认本地 `origin` 已指向 `Rento-miniX`，并冻结后续主动开发只围绕该 remote 展开
- 明确是否需要补冻结 tag、切换说明或本地目录改名建议
- 固定当前结论：不新增冻结 tag；仓库切换说明继续由根级 `README.md`、`AGENTS.md`、`architecture_map.md` 等主真相源承接，不另起独立说明文档；当前不建议立即把本地目录从 `/home/dell/Projects/Rento` 改名为 `Rento-miniX`
- 在文档中写明 `Rento-legacy` 仅承担只读备份参考职责，不作为默认 push remote 或并行第二真相源
- 在文档中写明旧容器化运行线的参考与回滚职责，并明确其不等同于未来 `Rento-miniX` 正式部署主线

### 不在范围内
- 不直接开始发布或推送
- 不在本子任务中切换部署主线
- 不在无审核前提下执行大规模 Git 操作

### DoD
- 本地与远端仓库关系清晰
- 后续实现不会因 remote 边界不清而误推送到旧仓，或重新引入 `Rento-legacy` 并行开发工作流
- `Rento-legacy` 的角色已在文档层被准确表述
- 旧容器化运行线已被明确限定为“当前存量运行线参考 + 回滚基线”
- `phase06-03 task5` 的结论已冻结为：当前无需新增冻结 tag、无需独立切换说明文档、暂无立即改本地目录名的建议

## phase06-minix-replatform-04-first-implementation-phase-freeze
### 目标
冻结 `phase06` 之后的首个正式实现阶段为 `phase07-app-shell-and-runtime-foundation`，确保后续实现先完成应用壳与运行时基础承接，再进入更深层的业务迁移。

### 范围
- 明确后续首个正式实现阶段名称：`phase07-app-shell-and-runtime-foundation`
- 明确该阶段的核心目标：
  - 在不改写合同、账单、仪表、抄表等主链业务语义的前提下，先建立 `Rento-miniX` 的前端应用壳、服务端运行时入口与最小基础运行骨架
  - 为后续领域逻辑迁移、数据访问层收口与部署主线切换提供单一承接位，而不是继续叠加在旧运行时之上
- 明确其与 `phase06` 的承接关系：
  - `phase06` 负责冻结真相源、边界、参考基线与实施顺序
  - `phase07` 才是首个正式实现阶段，但必须建立在 `phase06` 审核通过后的单一真相源之上
- 明确该阶段为何优先：
  - 若没有统一应用壳与运行时骨架，后续页面、API、认证、数据访问与部署切换会再次混成大爆炸式重构
  - 先收口应用壳和运行时，可以最大限度复用既有 UI 与业务主链语义，同时为后续阶段提供稳定迁移接口
- 粗粒度冻结该阶段的推荐顺序：
  - 前端应用壳与路由承接
  - 服务端运行时入口、基础中间件与健康检查承接
  - 最小认证与环境变量口径承接
  - 旧运行线到新应用壳/运行时的映射与退出条件冻结
  - 评估并输出后续领域迁移阶段的直接输入清单
- 明确进入 `phase07` `/plan` 的入口条件：
  - `phase06` 文档已审核通过
  - 根级真相源与 `docs/phase06_*` 口径保持一致
  - 内嵌 `Rento-miniX/` 目录不再被视为并行正式真相源
  - 已确认 `phase07` 只承接应用壳与运行时基础，不扩张为整仓一次性重写

### 不在范围内
- 不直接写该阶段的全部 `spec`
- 不直接进入实现
- 不把所有后续阶段细节一次性写死
- 不在 `phase07` 中一次性完成全部业务页面、全部 API、全部领域逻辑或部署主线切换
- 不借 `phase07` 之名重构 UI 风格、重定义账务语义或恢复 SQLite / 双轨路线

### DoD
- `phase06` 审核通过后，用户可以明确知道下一步进入哪个实现阶段
- 首个实现阶段已明确冻结为 `phase07-app-shell-and-runtime-foundation`
- 首个实现阶段的目标、与 `phase06` 的承接关系、边界、非目标与粗粒度顺序已具备 `/plan` 入口条件

## phase06-minix-replatform-05-hono-roadmap-and-material-absorption-freeze
### 目标
在不直接进入 `phase07` `/plan` 的前提下，补齐 `Hono` 版完整 Phase 路线图、模块迁移分类与 `Rento-miniX/` 内嵌目录文件级吸收映射。

### 范围
- 冻结 `Rento -> Rento-miniX` 的完整推荐阶段顺序，例如：
  - `phase07-app-shell-and-runtime-foundation`
  - `phase08-api-and-auth-foundation`
  - `phase09-domain-service-migration`
  - `phase10-data-access-and-migration-closure`
  - `phase11-deployment-cutover-and-cutline-closure`
- 明确每个阶段的粗粒度目标、与上下游阶段的承接关系，以及为什么当前顺序优先于其他切法
- 冻结模块级迁移分类口径：`直接复用 / 包一层适配 / 必须重写 / 延后决策`
- 对 `Rento-miniX/` 内嵌目录给出文件级吸收映射，明确：
  - 哪些文件已被根级真相源承接
  - 哪些文件已被 `docs/phase06_*` 承接
  - 哪些内容只保留为历史输入，不再继续作为当前阶段真相源
- 收口当前结论：在完整路线图与文件级映射审核通过前，不直接进入 `phase07` 的 `/plan`

### 不在范围内
- 不直接删除 `Rento-miniX/` 目录
- 不直接写 `phase07 ~ phase11` 的全部阶段文档
- 不直接进入任一后续阶段的 `/spec` 或实现
- 不在当前回合永久写死 ORM 细节、迁移链退出细节或最终部署操作手册

### DoD
- 用户能够完整解释 `Rento -> Rento-miniX` 的 `Hono` 版阶段推进顺序，而不是只知道首个正式实现阶段名称
- 用户能够直接理解当前旧实现模块哪些是 `直接复用 / 包一层适配 / 必须重写 / 延后决策`
- 用户能够直接理解 `Rento-miniX/` 目录每个文件当前由谁承接、为何仍保留、何时允许清理
- `phase06` 的当前下一步已收口为：先审核完整路线图与吸收映射，再决定是否进入 `phase07` `/plan`
- `phase06` 审核通过后，能够直接进入原目录删除结果复核，而不是再次回到目录角色讨论

## 四、推荐实施顺序
建议严格按如下顺序推进：

```text
phase06-minix-replatform-01-root-truth-source-switch
phase06-minix-replatform-02-nested-planning-material-closure
phase06-minix-replatform-03-repository-and-remote-readiness
phase06-minix-replatform-04-first-implementation-phase-freeze
phase06-minix-replatform-05-hono-roadmap-and-material-absorption-freeze
```

## 五、默认路线约束
`phase06` 的全部子任务都必须遵守：

- 默认优先冻结真相源，而不是抢跑实现
- 默认保持单仓库、单主线、单一真相源
- 默认不把 UI 承接、API 骨架、ORM 选择与部署主线切换一次性绑定
- 默认在进入 `phase07` `/plan` 前，先补齐完整 `Hono` 版路线图、模块分类与文件级吸收映射
- 默认由用户审核阶段文档后，再决定是否进入后续实现阶段
- 默认把当前旧实现代码视为直接参考基线
- 默认把原内嵌 `Rento-miniX/` 目录视为已完成清理的历史输入材料来源，而不是长期正式主线

## 六、结语
`phase06` 的价值不在于“已经把 `Rento-miniX` 重构出来”，而在于：

```text
先把当前仓库的主线切换、参考边界、真相源关系与实施顺序冻结好，
再让后续原地重构建立在清晰、可回滚、可审核的上游之上。
```
