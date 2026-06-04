# AGENTS.md

## 1. 项目定位
- 项目名称：`Rento-miniX`
- 目标：在保留当前 `Rento` 业务主链、UI 展示效果与治理结论的前提下，重构为面向房东/运营者的私有化、轻量化租赁管理后台。
- 当前定位：基于现有 `Rento` 仓库原地切换出的新主线规划与后续实现仓，优先服务“自用 + 私有部署 + 低配服务器可落地”的真实经营场景。
- 差异化能力：继续支持“一个房间绑定多个仪表，且仪表历史数据必须长期保留”的业务模型。
- 非目标：不做公开匿名可用产品、不做开放注册 SaaS、不恢复 SQLite 双轨路线、不为未来假设提前引入复杂基础设施。

## 2. 核心业务模型
- 核心实体主链继续保持为：`Building -> Room -> Meter` 与 `Renter -> Contract -> Bill/BillDetail -> MeterReading`。
- `Contract` 仍是租务事实主锚点，账单、续租、退租、抄表、房态变化应优先围绕合同表达。
- `Meter` 仍是独立资产，解绑或停用不等于删除历史。
- `BillDetail` 与 `MeterReading` 仍是多仪表计费能力的关键，不得简化回通用产品的一房一表模型。
- 数据主真相源继续固定为 PostgreSQL；轻量化不构成回退到 SQLite 的理由。

## 3. 开发总原则
- 先冻结业务边界、参考基线与阶段共享语义，再进入代码重构。
- 优先保持低复杂度：单仓库、单主线、单一真相源，不让旧 `Rento` 运行线与新 `Rento-miniX` 主线长期争夺同层职责。
- 在满足业务真实、状态可解释、历史可追溯的前提下，优先保持轻量、高效、灵活、低耦合。
- 当前 `Rento` 前端 UI 展示效果已符合预期，默认视为承接资产；非必要不得擅自改变展示效果。
- 所有重构都必须明确标注“参考来源、复用内容、调整内容、舍弃内容与原因”。

## 4. 当前默认入口
- 当前默认工作流：`phase06-minix-replatform`
- 当前主问题：完成从旧 `Rento` 存量运行线到 `Rento-miniX` 原地重构主线的顶层真相源切换，并冻结阶段边界，避免后续重构继续建立在旧主叙事上。
- 当前默认顺序、阶段目标与验收结论，以 [plan.md](file:///home/dell/Projects/Rento/plan.md) 为唯一主真相源。
- 当前下一步：先审核已提升到 [plan.md](file:///home/dell/Projects/Rento/plan.md) 的完整 `Hono` 版 Phase 路线图，以及 `phase06` 文档中已完成的目录吸收、引用复核与删除收口结果；未经审核，不直接进入 `phase07` 的 `/plan`、`/spec` 或实现。
- 当前阶段重点：
  - 冻结 `Rento-legacy`、当前仓库与未来 `Rento-miniX` 主线的关系
  - 冻结 remote 收口边界：主动开发默认只保留 `origin -> Rento-miniX`
  - 冻结 UI 继续默认承接、PostgreSQL 继续固定主线、云端不构建等底线
  - 冻结 `plan.md` 与 `docs/phase06_*` 的职责分层
  - 冻结原内嵌 `Rento-miniX/` 目录的抽取、复核与清理结论
  - 冻结 `Hono` 版完整重构路线图，以及“复用 / 适配 / 重写 / 延后”的模块分类口径

## 5. 当前明确冻结与禁止事项
- 不恢复 SQLite 本地缓存/离线同步路线。
- 不在当前阶段大改 UI 风格，不替换现有页面视觉表达。
- 不允许为了轻量化而破坏合同、账单、仪表、抄表主链的业务真实性。
- 不允许通过“删除仪表”直接清空该仪表产生的历史抄表与账单事实。
- 不允许在 `phase06` 审核前直接启动大规模重构实现。
- 不允许重新引入新的内嵌 `Rento-miniX/` 目录或任何同类第二套规划目录，与根级文档再次形成双重真相源。

## 6. 运行与质量基线
- 发布前最低门禁至少包括：`npm run lint`、`npm run type-check`、构建、健康检查与核心业务 smoke test。
- 数据质量底线：合同、账单、抄表、仪表关联必须可追溯；历史账务记录优先保留。
- 安全底线：对外部署前必须具备登录、会话保护、来源控制与最小审计线索。
- 部署底线：未来主线默认云端不做源码构建，优先运行预构建产物。

## 6.1 当前阶段结论
- `phase01-restart-foundation-*` 已完成，结论为：已具备恢复开发条件。
- `phase02-auth-gate-*` 已完成，结论为：页面与核心 API 已具备最小认证闭环。
- `phase03-consistency-hardening-*` 已完成，结论为：主链一致性、删除门禁、账务语义与迁移兼容项已完成当前阶段收口。
- `phase04-performance-and-ops-*` 已完成，结论为：关键查询性能、运行可观测性与 dev-only 入口治理已完成当前阶段收口。
- `phase05-pwa-delivery-*` 已完成，结论为：PWA 安装闭环、更新策略、关键页面移动端可用性与私有部署验收已完成当前阶段收口。
- `Rento-legacy` 已在 GitHub 侧完成保留备份；当前仓库已切换为 `Rento-miniX` 主线仓。
- 当前正式进入 `phase06-minix-replatform` 规划阶段：先完成顶层真相源切换，再进入后续实现阶段判断。

## 7. 全局文档导航
- [README.md](file:///home/dell/Projects/Rento/README.md)：项目总览与当前状态说明
- [AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md)：项目入口摘要与执行总约束
- [project_rules.md](file:///home/dell/Projects/Rento/project_rules.md)：刚性规则、门禁与禁止事项
- [architecture_map.md](file:///home/dell/Projects/Rento/architecture_map.md)：仓库结构、现状与重构承接位
- [plan.md](file:///home/dell/Projects/Rento/plan.md)：当前默认阶段、阶段顺序与验收结论
- [global_skills.md](file:///home/dell/Projects/Rento/global_skills.md)：跨阶段通用方法论与重构 workflow 规则
- [project_skills.md](file:///home/dell/Projects/Rento/project_skills.md)：合同、账单、仪表、删除门禁与 UI 承接等专属技能
- [phase06_minix_replatform_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_architecture_plan.md)：`phase06` 架构规划
- [phase06_minix_replatform_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_dev_plan.md)：`phase06` 开发规划
- [phase06_minix_replatform_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase06_minix_replatform_shared_baseline.md)：`phase06` 共享基线
- [docs/archive/README.md](file:///home/dell/Projects/Rento/docs/archive/README.md)：历史任务文档与遗留材料归档说明

## 8. 推荐阅读顺序
1. `AGENTS.md`
2. `project_rules.md`
3. `plan.md`
4. `architecture_map.md`
5. `global_skills.md`
6. `project_skills.md`
7. `README.md`
8. `docs/phase06_*`

## 9. 文档同步规则
- 当默认工作流切换到新的 `phase*` 前，必须先同步 `AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md` 与 `architecture_map.md`。
- `plan.md` 只负责阶段总览；每个 `phase` 的子任务、范围、DoD 与顺序由对应 `docs/phaseX_*_dev_plan.md` 承接。
- 每个 `phase*` 默认先产出 `architecture_plan` 与 `dev_plan`；存在共享边界时再补 `shared_baseline`。
- 阶段级文档产出后必须停止并等待用户审核；未经批准，不得直接进入 `/spec` 或实现。
- 当运行入口、部署方式、数据库主线、安全边界或目录结构发生变化时，必须同步更新 `README.md`、`architecture_map.md`、`project_rules.md` 与 `DEPLOYMENT.md`。
- 在进入首个正式实现阶段 `/plan` 前，必须先冻结完整 `Hono` 版 Phase 路线图、原 `Rento-miniX/` 目录的文件级吸收映射与模块迁移分类，避免再次退回“走一步看一步”的推进方式；其中完整路线图的长期全局承接位固定为 `plan.md`。

## 10. 其他关键治理约束
- 根目录只保留当前有效入口文档、配置文件和运行资产；历史任务记录应迁入 `docs/archive/`。
- 所有“临时兼容逻辑”都要写明存在原因和退出条件，避免长期遗留。
- 对外可见行为优先稳定，对内治理优先清理双重真相；宁可少做，也不带着错误入口继续迭代。
- `phase06` 的职责是冻结原地重构边界与实施顺序，不是在当前回合直接改写业务实现。
- `phase06` 审核通过前，不把“已冻结首个实现阶段名称”误读为“可以跳过完整路线图规划并直接进入 `phase07` `/plan`”；若完整 `Hono` 版路线图与目录吸收映射未冻结，应优先补齐这些规划文档。
- `Rento-legacy` 只承担旧主线历史备份与只读参考职责，不作为当前仓库的默认 push remote、默认上游或第二真相源。
- 旧容器化运行线只保留“当前存量运行线参考 + 回滚基线”职责；在新部署主线冻结前，不继续扩写为 `Rento-miniX` 的未来正式交付真相源。
- 任何涉及合同、账单、支付周期、仪表、抄表主链的重构，都必须在后续 `analysis`/阶段文档中明确：
  - 是否影响历史数据
  - 是否影响其他入口或生成路径
  - 是否需要数据修复
  - 验收标准与回滚条件
