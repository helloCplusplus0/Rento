# Phase06 Minix Replatform 架构规划

## 一、文档定位
本文档用于承接 `phase05-pwa-delivery-*` 完成后的下一阶段工作流，回答以下问题：

- 为什么当前最合理的下一阶段是 `phase06-minix-replatform`
- 为什么当前重点不是直接开始代码重构，而是先完成根级真相源切换
- 为什么本阶段必须优先冻结 UI 承接、参考基线、技术栈边界与目录治理
- `phase06` 允许做什么、不允许做什么

本文档不替代：

- [AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md) 的入口摘要职责
- [plan.md](file:///home/dell/Projects/Rento/plan.md) 的阶段顺序与当前结论职责
- [phase06_minix_replatform_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_dev_plan.md) 的子任务拆分职责
- 后续 `.trae/specs/phase06-minix-replatform-*` 的单任务冻结与执行职责

## 二、当前阶段结论
### 2.1 已完成前提
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- 当前 `Rento` 主要功能与 UI 已阶段性完毕，已进入云端部署实测并形成明确部署教训
- GitHub 侧已存在 `Rento-legacy` 作为保留备份，原主仓已重命名为 `Rento-miniX`

### 2.2 当前真实阻塞面
当前阻塞面不在需求不清晰，而在以下几类：

- 根级文档仍保留大量旧 `Rento` 主线叙事，若不切换真相源，后续重构会持续建立在旧主叙事上
- 当前仓库在进入 `phase06` 时曾存在内嵌 `Rento-miniX/` 目录；若不明确其角色与退出路径，容易形成双重真相源
- 旧实现代码、旧部署链与新技术栈目标已同时存在于讨论中，但尚未冻结“什么继续保留、什么作为参考输入、什么进入新主线”
- 若直接开始改写前端壳、API 骨架、ORM 与部署方式，极易把多类高风险变量混成一次大爆炸式重构

### 2.3 为什么现在进入 phase06
当前最合理的下一阶段是：

```text
phase06-minix-replatform
```

原因如下：

- 旧 `phase01~phase05` 已完成各自阶段收口，当前真正需要的是“主线切换”，而不是继续沿用旧工作流
- 业务问题并不是“产品要推倒重来”，而是“承载层与低配私有部署目标不匹配”
- 当前仓库已经天然具备原地重构条件：完整代码、真实页面、真实部署经验都在一个 IDE 上下文内
- 若不先冻结原地重构边界，后续会不断在“保留旧线 / 迁入新线 / 临时兼容”之间反复摇摆

### 2.4 为什么现在不直接开始实现
- 当前还未正式冻结根级真相源与阶段边界，直接编码会导致“边写代码边重新定义项目”
- 当前最需要先定清的是：
  - 当前仓库逻辑主线已经切换为 `Rento-miniX`
  - 旧实现代码是直接参考基线
  - 当前 UI 默认继续冻结
  - PostgreSQL 继续固定主线
  - 原内嵌 `Rento-miniX/` 目录只作为前置输入材料
- 若这些边界不先写清，后续实现很容易出现真相源分叉与回滚困难

## 三、工作流定位
### 3.1 新增 `phase06-minix-replatform`
当前最合适的阶段工作流是：

```text
phase06-minix-replatform
```

它的职责不是立即把 `Next.js` 改成 `Vite + Hono`，而是：

- 完成从旧 `Rento` 存量运行线到 `Rento-miniX` 新主线的顶层切换
- 冻结 UI 承接边界、技术栈口径与部署方向
- 冻结原内嵌 `Rento-miniX/` 目录的抽取与清理策略
- 拆解后续正式重构的实施顺序，避免大爆炸式改写

### 3.2 核心原则
`phase06-minix-replatform` 必须坚持：

- 业务真实优先
- 状态可解释优先
- 历史可追溯优先
- UI 默认承接优先
- 低复杂度优先
- 先冻结真相源，再进入实现
- 先拆阶段，再改承载层

## 四、架构边界
### 4.1 本阶段允许做的事
- 同步根级 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`global_skills.md`、`project_skills.md`、`plan.md`
- 明确当前仓库已进入 `Rento-miniX` 主线规划阶段
- 明确旧 `Rento` 存量运行线、`Rento-legacy` 备份仓与当前仓库之间的关系
- 冻结后续目标栈口径：`React + Vite + Hono + PostgreSQL + Caddy + systemd`
- 明确 ORM 当前仍是候选层，不在本阶段写死
- 明确原内嵌 `Rento-miniX/` 目录只作为抽取输入，不继续作为长期主线目录
- 产出 `phase06` 的 `architecture_plan`、`dev_plan` 与 `shared_baseline`

### 4.2 本阶段暂不做的事
- 不直接迁移页面、API、ORM 或部署脚本
- 不修改当前核心业务代码语义
- 不在 `phase06` 前半段直接删除内嵌 `Rento-miniX/` 目录
- 不直接切换部署主线
- 不在本阶段承诺所有后续子任务的实现细节

### 4.3 旧实现与新主线边界
- 当前根级 `src/`、`prisma/`、`public/`、`scripts/` 是旧 `Rento` 的现状实现，也是后续原地重构的直接参考基线
- 当前 `docker-compose.yml`、`nginx/nginx.conf`、`scripts/cloud-deploy.sh` 等仍对应旧容器化运行线
- 未来 `Rento-miniX` 不自动继承旧容器化部署主线，但当前阶段仍保留其回滚与参考价值

### 4.4 UI 与业务边界
- 当前 `Rento` 前端 UI 展示效果已符合预期，默认冻结
- `Contract`、账单、支付周期、仪表、抄表、多仪表历史保留、删除门禁等主链语义必须继续视为硬边界
- 轻量化收益优先来自移除重运行时与重部署链，而不是改写业务真相

## 五、推荐输出
`phase06-minix-replatform` 首轮至少应产出：

- 一份阶段级架构规划文档
- 一份阶段级开发规划文档
- 一份共享基线文档
- 一组同步后的根级真相源文档
- 一个原内嵌 `Rento-miniX/` 目录的抽取/保留/清理策略

## 六、第二轮补充规划结论
在完成 `phase06-01 ~ phase06-04` 后，当前还需要补齐两类规划，才能避免后续再次退回“走一步看一步”：

### 6.1 完整 `Hono` 版 Phase 路线图
当前不仅要知道首个正式实现阶段叫什么，还应先明确 `Rento -> Rento-miniX` 的完整重构顺序。推荐冻结为：

> 说明：
> - 本节当前保留，是为了记录 `phase06` 为何需要推导并冻结这份路线图。
> - 该路线图的长期全局承接位已经提升到根级 [plan.md](file:///home/dell/Projects/Rento/plan.md)。
> - 因此，本节不再承担“全局唯一真相源”职责，而是作为 `phase06` 的阶段性推导与冻结说明保留。

```text
phase06-minix-replatform
    ->
phase07-app-shell-and-runtime-foundation
    ->
phase08-api-and-auth-foundation
    ->
phase09-domain-service-migration
    ->
phase10-data-access-and-migration-closure
    ->
phase11-deployment-cutover-and-cutline-closure
```

各阶段职责建议如下：

- `phase07-app-shell-and-runtime-foundation`
  - 目标：承接前端应用壳、运行时入口、路由骨架、基础中间件与最小健康检查。
  - 作用：先把新主线“跑起来”，而不是先改最重的业务语义。

- `phase08-api-and-auth-foundation`
  - 目标：承接 `Hono` API 骨架、认证会话、错误处理、最小安全边界与 API 基础契约。
  - 作用：把当前 `Next.js` API 形态迁出统一承载框架依赖。

- `phase09-domain-service-migration`
  - 目标：迁移合同、账单、支付周期、仪表、抄表、删除门禁等主链领域服务。
  - 作用：在应用壳与 API 骨架稳定后，再承接高风险业务真相。

- `phase10-data-access-and-migration-closure`
  - 目标：冻结长期数据访问层方案，收口 ORM、查询模式、事务边界、迁移链与兼容项退出条件。
  - 作用：避免在运行时骨架尚未稳定前就过早绑定数据访问层实现。

- `phase11-deployment-cutover-and-cutline-closure`
  - 目标：完成部署主线切换、回滚基线冻结、旧运行线退出条件与最终发布门禁。
  - 作用：把 `Caddy + systemd` 作为最后切换项，而不是前置高风险变量。

上述顺序的上下游承接关系可进一步冻结为：

| 阶段 | 上游输入 | 向下游输出 | 当前顺序理由 |
| --- | --- | --- | --- |
| `phase07-app-shell-and-runtime-foundation` | `phase06` 已冻结的真相源、UI 承接边界、技术栈口径与目录治理结论 | 单一应用壳、运行时入口、基础路由与最小健康检查承接位 | 先把新主线跑通，避免后续所有迁移继续挂靠旧宿主 |
| `phase08-api-and-auth-foundation` | `phase07` 已稳定的运行时骨架与环境变量口径 | 统一 API 宿主、认证会话、中间件与错误处理骨架 | API 与认证先于领域迁移，才能为高风险业务逻辑提供稳定承接面 |
| `phase09-domain-service-migration` | `phase08` 已稳定的 API 契约与认证边界 | 合同、账单、支付周期、仪表、抄表与删除门禁等主链领域服务 | 业务真相最重，必须后置到宿主与门禁稳定之后再迁移 |
| `phase10-data-access-and-migration-closure` | `phase09` 已冻结的领域服务边界与查询需求 | 长期数据访问层方案、事务边界、迁移链兼容项退出条件 | 数据访问层应服务于已确认的领域语义，而不是反过来倒逼上游设计 |
| `phase11-deployment-cutover-and-cutline-closure` | `phase07~10` 已稳定的新主线运行骨架、API、领域与数据访问层 | 正式部署主线、回滚基线、旧运行线退出条件与发布门禁 | 部署切线风险最高，必须最后处理，避免部署变量反向干扰前序阶段 |

### 6.2 为什么不能直接进入 `phase07` `/plan`
即便首个正式实现阶段已经命名为 `phase07-app-shell-and-runtime-foundation`，当前仍不应立即进入它的 `/plan`，原因如下：

- 当前若直接进入 `phase07`，会默认接受“先做第一阶段、后续再看”的推进方式，不符合用户已明确的“完整路线图先冻结”要求。
- 旧 `Rento-miniX/` 目录中其实已经存在一套较完整的 `Hono` 版阶段顺序，只是当时建立在“独立新仓库”前提之上；当前需要先把那套路线图吸收到“原地重构”语境里。
- 若不先补齐完整路线图，后续在 API、领域逻辑、数据访问层与部署切换之间仍可能出现阶段职责重叠或漏项。

### 6.3 模块迁移分类口径
在完整路线图冻结前，还应同步冻结模块级分类口径，至少分为：

- `直接复用`
  - 以业务语义、UI 结构、数据模型与部署经验为主。
  - 例如：核心实体关系、账务语义、删除门禁规则、既有页面信息架构、真实部署教训。

- `包一层适配`
  - 旧实现语义正确，但运行时绑定了 `Next.js` 或旧 API 形态，需要承接后再迁移。
  - 例如：认证守卫逻辑、错误处理策略、查询服务、页面级数据获取边界。

- `必须重写`
  - 与 `Next.js` / 旧容器化运行线深度绑定，无法直接复用为 `Hono` 主线。
  - 例如：`src/app/api/*` 的运行时承载方式、`middleware.ts` 的宿主形态、旧部署主线入口。

- `延后决策`
  - 当前不宜过早写死，应在后续专门阶段正式冻结。
  - 例如：长期 ORM 方案、迁移链兼容项退出方式、最终部署切线细节。

结合当前旧实现，核心模块的初始归类建议补充为：

| 分类 | 当前旧实现模块/资产 | 当前判断 |
| --- | --- | --- |
| `直接复用` | `src/app` 下已验证的业务页面信息架构、合同/账单/仪表/抄表主链语义、`prisma/schema.prisma` 所表达的核心实体关系、现有真实部署教训 | 这些内容的业务语义已被证明有效，后续应优先保留其真相，而不是重新发明一套模型 |
| `包一层适配` | 页面级数据获取边界、认证守卫策略、查询服务、错误处理口径、环境变量分层约束 | 语义本身可继续沿用，但需要从旧 `Next.js` 宿主形态中抽离并承接到新运行时 |
| `必须重写` | `src/app/api/*` 的宿主方式、`middleware.ts` 的运行时耦合、旧容器化部署入口如 `docker-compose.yml` / `nginx/nginx.conf` / `scripts/cloud-deploy.sh` | 这些资产深度绑定旧宿主或旧部署主线，不适合作为 `Hono` 新主线的长期实现载体 |
| `延后决策` | 长期 ORM 方案、迁移链历史兼容项退出方式、最终 `Caddy + systemd` 切线细节、正式发布与回滚编排 | 需要等待应用壳、API、领域与数据访问层边界更稳定后，再进入单独阶段冻结 |

### 6.4 内嵌 `Rento-miniX/` 文件级吸收映射
`phase06` 不只需要“原则上吸收”，还需要把文件级承接关系显式写清，并在完成引用复核后执行实际删除。当前映射如下：

| 内嵌目录文件 | 当前承接位 | 当前状态 |
| --- | --- | --- |
| `Rento-miniX/README.md` | 根级 [README.md](file:///home/dell/Projects/Rento/README.md) | 已吸收核心关系与目标方案 |
| `Rento-miniX/AGENTS.md` | 根级 [AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md) | 已吸收入口职责与执行约束 |
| `Rento-miniX/project_rules.md` | 根级 [project_rules.md](file:///home/dell/Projects/Rento/project_rules.md) | 已吸收规则与门禁 |
| `Rento-miniX/architecture_map.md` | 根级 [architecture_map.md](file:///home/dell/Projects/Rento/architecture_map.md) | 已吸收目录治理与结构关系 |
| `Rento-miniX/global_skills.md` | 根级 [global_skills.md](file:///home/dell/Projects/Rento/global_skills.md) | 已吸收 workflow 方法论 |
| `Rento-miniX/project_skills.md` | 根级 [project_skills.md](file:///home/dell/Projects/Rento/project_skills.md) | 已吸收项目专属迁移技能 |
| `Rento-miniX/plan.md` | 根级 [plan.md](file:///home/dell/Projects/Rento/plan.md) + `docs/phase06_*` | 已完成吸收；原文件已删除 |
| `Rento-miniX/docs/rento_minix_solution_overview.md` | [phase06_minix_replatform_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_architecture_plan.md) + [phase06_minix_replatform_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_shared_baseline.md) | 已完成吸收；原文件已删除 |
| `Rento-miniX/docs/rento_to_minix_transition_workflow.md` | 根级 `global_skills.md` + `docs/phase06_*` | 已完成吸收；原文件已删除 |
| `Rento-miniX/docs/phase01_*` | `docs/phase06_*` + `plan.md` | 已完成吸收；原文件已删除 |

上述映射已冻结到 `phase06` 文档中，并已支撑完成原目录删除。

对这些文件的保留原因与清理前置条件，当前还应统一理解为：

- 保留原因：它们曾承担历史规划输入、路线图比对与吸收复核职责，但已不再具备当前阶段直接真相源资格。
- 当前真相源资格：后续 `/spec`、实现与阶段判断默认只引用根级真相源与 `docs/phase06_*`，不再以内嵌目录作为并行正式入口。
- 清理前置条件：必须先完成有效内容吸收、引用复核完成，再决定是否进入实际目录清理步骤；该条件现已满足并完成删除。

## 七、结论
当前最合理、最稳妥的下一步，不是直接写 `Rento-miniX` 实现代码，而是：

```text
先补齐完整 Hono 路线图与文件级吸收映射
    ->
再等待审核
    ->
再决定是否进入 `phase07` 的 `/plan`
```

这能确保：

- 不会继续让旧 `Rento` 叙事与新主线叙事混写
- 不会让原内嵌 `Rento-miniX/` 目录长期争夺真相源
- 不会在完整路线图、模块分类与目录吸收映射未冻结前就大规模改代码
