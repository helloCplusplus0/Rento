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
- 当前默认工作流：`phase13-frontend-page-parity-implementation`
- 当前主问题：在不反向干扰 `phase07~11` 已冻结的应用壳、统一 API 宿主、共享领域服务、数据访问层、部署主线与迁移兼容边界的前提下，把旧 `Rento` 的正式页面、旧宿主 API 与 PWA 能力完整迁入 `Rento-miniX`，并为最终 legacy 退出建立可验证的对齐路径。
- 当前默认顺序、阶段目标与验收结论，以 [plan.md](file:///home/dell/Projects/Rento/plan.md) 为唯一主真相源。
- 当前下一步：`phase12-05` 已完成路线图一致性收口，当前已进入 `phase13-frontend-page-parity-implementation` 的 `/plan` 文档审核阶段。当前应继续以 [phase13_frontend_page_parity_implementation_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_architecture_plan.md)、[phase13_frontend_page_parity_implementation_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_dev_plan.md)、[phase13_frontend_page_parity_implementation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_shared_baseline.md)、[phase12_frontend_parity_and_shell_cutover_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md) 与 [plan.md](file:///home/dell/Projects/Rento/plan.md) 作为当前阶段真相源，并保持本轮只做阶段文档产出与一致性收口，不进入 `/spec` 或页面/API/PWA/cutover 实现。
- 当前阶段重点：
  - 把 `phase10` 已冻结的长期数据访问层方案、查询分层、统一事务边界与迁移兼容项边界作为稳定上游输入，并继续固定 `Prisma + PostgreSQL` 为当前正式数据访问主线
  - 把 `phase11` 已冻结的正式部署主线、环境模板、健康检查、发布门禁与 legacy 回滚基线作为稳定上游输入
  - 把 `phase12` 已冻结的页面事实表、页面映射、五层复用矩阵、UI 保真边界与页面-API 联动作为 `phase13` 的直接上游输入
  - 冻结 `phase13` 的页面切片顺序、route module 组织方式、页面级加载/错态边界与人工浏览器验收基线
  - 明确 `phase13` 只承接正式页面真实迁移实施，不提前混写 `phase14` API/query parity、`phase15` PWA parity 或 `phase16` cutover/legacy-exit
  - 保持旧 `docker-compose + nginx + Next.js standalone` 运行线只承担历史运行线、故障回滚与差异对照职责，直到 `phase16` 审核通过

## 5. 当前明确冻结与禁止事项
- 不恢复 SQLite 本地缓存/离线同步路线。
- 不在当前阶段大改 UI 风格，不替换现有页面视觉表达。
- 不允许为了轻量化而破坏合同、账单、仪表、抄表主链的业务真实性。
- 不允许通过“删除仪表”直接清空该仪表产生的历史抄表与账单事实。
- 不允许在 `phase06` 审核前直接启动大规模重构实现。
- 不允许重新引入新的内嵌 `Rento-miniX/` 目录或任何同类第二套规划目录，与根级文档再次形成双重真相源。

## 6. 运行与质量基线
- 发布前最低门禁至少包括：`npm run lint`、`npm run type-check`、构建、健康检查与核心业务 smoke test。
- 若 `phase11` 某轮仅涉及文档，最低验证要求至少包括：`docs/phase11_*` 互链复核、被引用路径存在性复核，以及根级真相源与 `DEPLOYMENT.md` 状态一致性复核。
- 若当前轮仅涉及 `phase12-05` 文档收口，最低验证要求至少包括：`docs/phase12_*` 互链复核、被引用路径存在性复核，以及 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`plan.md` 与 `docs/phase12_*` 状态一致性复核。
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
- `phase06-minix-replatform` 已完成当前轮文档治理收口：完整 `Hono` 路线图、模块迁移分类与原内嵌目录清理结果已冻结到主真相源。
- `phase07-app-shell-and-runtime-foundation` 已完成：新前端应用壳、新运行时入口、旧运行线映射与退出条件已冻结为后续阶段上游输入。
- `phase08-api-and-auth-foundation` 已完成：统一 API 宿主、最小认证闭环、请求治理、统一错误出口、环境变量兼容口径与 `src/minix` 最小页面守卫已完成当前阶段收口。
- `phase09-domain-service-migration` 已完成当前轮阶段收口：共享领域服务落点、正式宿主边界、合同/账单/仪表/抄表/退租/删除门禁主链迁移、主链 smoke 路径、旧 `src/app/api/*` compat wrapper 清单与 `phase10` 上游输入已完成当前轮验证。
- `phase10-data-access-and-migration-closure` 已完成当前轮阶段文档与 `phase10-01 ~ phase10-05` `/spec` 收口：长期数据访问层方案、查询/写路径分层、事务边界、迁移兼容项、最低验证要求与 `phase11` 最小上游输入已形成单一闭环。
- `phase11-deployment-cutover-and-cutline-closure` 已完成 `phase11-01 ~ phase11-05` 当前轮已批准 spec 收口：正式部署主线、预构建产物链、环境变量、健康检查、发布门禁、legacy 回滚基线、文档最小验证要求与部署/回滚演练记录要求均已同步冻结到根级真相源、`DEPLOYMENT.md` 与 `docs/phase11_*`。
- `phase12-frontend-parity-and-shell-cutover` 已完成当前轮阶段文档与 `phase12-05` 路线图一致性收口：后续默认以前端页面 parity、旧 UI 承接、`Prisma + PostgreSQL` 保留、`phase12 ~ phase16` 完整路线图、前后依赖、DoD、退出条件与文档轮次最小验证要求为统一输入；其中新增 `phase13-frontend-page-parity-implementation` 专门承接真实页面迁移实施。
- `phase13-frontend-page-parity-implementation` 已进入当前轮 `/plan` 文档审核阶段：后续默认以正式页面真实迁移、页面壳与页面装配层落位、route-level 数据边界、宿主绑定拆分与页面级验收基线为统一输入；在用户批准前，当前仍不进入 `/spec` 或实现。

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
- [phase07_app_shell_and_runtime_foundation_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase07_app_shell_and_runtime_foundation_architecture_plan.md)：`phase07` 架构规划
- [phase07_app_shell_and_runtime_foundation_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase07_app_shell_and_runtime_foundation_dev_plan.md)：`phase07` 开发规划
- [phase07_app_shell_and_runtime_foundation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase07_app_shell_and_runtime_foundation_shared_baseline.md)：`phase07` 共享基线
- [phase08_api_and_auth_foundation_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase08_api_and_auth_foundation_architecture_plan.md)：`phase08` 架构规划
- [phase08_api_and_auth_foundation_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase08_api_and_auth_foundation_dev_plan.md)：`phase08` 开发规划
- [phase08_api_and_auth_foundation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase08_api_and_auth_foundation_shared_baseline.md)：`phase08` 共享基线
- [phase09_domain_service_migration_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase09_domain_service_migration_architecture_plan.md)：`phase09` 架构规划
- [phase09_domain_service_migration_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase09_domain_service_migration_dev_plan.md)：`phase09` 开发规划
- [phase09_domain_service_migration_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase09_domain_service_migration_shared_baseline.md)：`phase09` 共享基线
- [phase10_data_access_and_migration_closure_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase10_data_access_and_migration_closure_architecture_plan.md)：`phase10` 架构规划
- [phase10_data_access_and_migration_closure_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase10_data_access_and_migration_closure_dev_plan.md)：`phase10` 开发规划
- [phase10_data_access_and_migration_closure_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase10_data_access_and_migration_closure_shared_baseline.md)：`phase10` 共享基线
- [phase11_deployment_cutover_and_cutline_closure_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_architecture_plan.md)：`phase11` 架构规划
- [phase11_deployment_cutover_and_cutline_closure_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md)：`phase11` 开发规划
- [phase11_deployment_cutover_and_cutline_closure_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_shared_baseline.md)：`phase11` 共享基线
- [phase12_frontend_parity_and_shell_cutover_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_architecture_plan.md)：`phase12` 架构规划
- [phase12_frontend_parity_and_shell_cutover_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md)：`phase12` 开发规划
- [phase12_frontend_parity_and_shell_cutover_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase12_frontend_parity_and_shell_cutover_shared_baseline.md)：`phase12` 共享基线
- [phase13_frontend_page_parity_implementation_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_architecture_plan.md)：`phase13` 架构规划
- [phase13_frontend_page_parity_implementation_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_dev_plan.md)：`phase13` 开发规划
- [phase13_frontend_page_parity_implementation_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase13_frontend_page_parity_implementation_shared_baseline.md)：`phase13` 共享基线
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
9. `docs/phase07_*`
10. `docs/phase08_*`
11. `docs/phase09_*`
12. `docs/phase10_*`
13. `docs/phase11_*`
14. `docs/phase12_*`
15. `docs/phase13_*`

## 9. 文档同步规则
- 当默认工作流切换到新的 `phase*` 前，必须先同步 `AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md` 与 `architecture_map.md`。
- `plan.md` 只负责阶段总览；每个 `phase` 的子任务、范围、DoD 与顺序由对应 `docs/phaseX_*_dev_plan.md` 承接。
- 每个 `phase*` 默认先产出 `architecture_plan` 与 `dev_plan`；存在共享边界时再补 `shared_baseline`。
- 阶段级文档产出后必须停止并等待用户审核；未经批准，不得直接进入 `/spec` 或实现。
- 当运行入口、部署方式、数据库主线、安全边界或目录结构发生变化时，必须同步更新 `README.md`、`architecture_map.md`、`project_rules.md` 与 `DEPLOYMENT.md`。
- 在进入首个正式实现阶段 `/plan` 前，必须先冻结完整 `Hono` 版 Phase 路线图、原 `Rento-miniX/` 目录的文件级吸收映射与模块迁移分类，避免再次退回“走一步看一步”的推进方式；其中完整路线图的长期全局承接位固定为 `plan.md`。
- 进入 `phase07` 后，仍必须先完成该阶段的 `architecture_plan`、`dev_plan` 与 `shared_baseline` 审核，未经批准不得直接进入 `/spec` 或实现。
- 进入 `phase08` 后，仍必须先完成统一 API 宿主、最小公开 API 白名单、认证会话、错误处理、环境变量兼容口径与最小页面守卫方案冻结，再进入该阶段任一 `/spec`。
- 进入 `phase09` 后，仍必须先完成共享领域服务落点、正式宿主边界、主链验证路径、历史数据保留约束与旧兼容宿主保留边界冻结，再进入该阶段任一 `/spec`。
- 进入 `phase10` 后，仍必须先完成长期数据访问层方案、正式/兼容/治理查询分层、事务边界、迁移兼容项说明与退出条件冻结，再进入该阶段任一 `/spec`。
- 进入 `phase11` 后，仍必须先完成正式部署主线、回滚基线、旧运行线退出条件、环境变量模板、健康检查、发布门禁与 legacy cutline 说明冻结，再进入该阶段任一 `/spec`。
- 进入 `phase12` 后，仍必须先完成旧页面到 `src/minix` 的映射表、UI 保真边界、页面装配复用策略、`Prisma + PostgreSQL` 保留口径以及 `phase12 ~ phase16` 的完整路线图冻结，再进入该阶段任一 `/spec`。
- 进入 `phase13` 后，仍必须先完成页面切片顺序、route module 组织方式、页面装配/数据加载边界、宿主绑定拆分策略、浏览器验收基线与 `phase14` 页面-API 依赖交接冻结，再进入该阶段任一 `/spec`。
- 进入 `phase11-*` 已批准 spec 顺序实现后，仍必须持续同步 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`DEPLOYMENT.md` 与 `docs/phase11_*`，避免重新出现正式主线与 legacy 基线混写；`phase11-05` 之后，文档最小验证要求与部署/回滚演练记录要求也必须继续保持一致。
- 进入 `phase12-*` 审核通过后，仍必须持续同步 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`plan.md` 与 `docs/phase12_*`，避免重新出现“旧宿主页面仍是默认落点”或“迁移过程顺带重做 UI”的漂移。
- 进入任一已批准 `spec` 的子任务实施后，每个子任务在标记完成前都必须额外指定独立子代理执行审核验收；只有在子代理明确判定“通过”后，才允许把该子任务视为正式完成，并继续提交与推送远程仓库。

## 10. 其他关键治理约束
- 根目录只保留当前有效入口文档、配置文件和运行资产；历史任务记录应迁入 `docs/archive/`。
- 所有“临时兼容逻辑”都要写明存在原因和退出条件，避免长期遗留。
- 对外可见行为优先稳定，对内治理优先清理双重真相；宁可少做，也不带着错误入口继续迭代。
- `phase06` 的职责是冻结原地重构边界与实施顺序，该阶段结论继续作为 `phase07` 的上游输入，不再重新争夺当前默认入口。
- `phase07` 的职责是建立应用壳与运行时基础承接位；该阶段现已完成，其结论继续作为 `phase08` 的上游输入。
- `phase08` 的职责是冻结统一 API 宿主、认证门禁、错误处理与最小安全边界；该阶段现已完成，其结论继续作为 `phase09` 的上游输入。
- `phase09` 的职责是冻结共享领域服务落点、迁移合同/账单/支付周期/仪表/抄表/删除门禁等主链领域服务，并收口主链查询与写路径一致性，而不是在当前回合直接切 ORM 最终主线或改写最终部署主线。
- `phase10` 的职责是冻结长期数据访问层方案、查询分层、统一事务边界、迁移兼容项与 `phase11` 最小上游输入；该阶段现已完成当前轮收口。
- `phase11` 的职责是冻结正式部署主线、回滚基线、旧运行线退出条件、环境模板、发布门禁、文档最小验证要求与部署演练记录要求；当前轮 `phase11-05` 已完成上述文档闭环，但在正式 cutover 审核通过前，仍不得删除 legacy 回滚资产。
- `phase12` 的职责是冻结前端页面 parity、`src/minix` 页面装配承接边界、旧 UI 复用规则与后续 `phase12 ~ phase16` 的多阶段路线图；当前轮 `phase12-05` 已完成路线图一致性收口，真实前端页面迁移实施已提升为新增 `phase13-frontend-page-parity-implementation`。
- `phase13` 的职责是把首页、房源、合同、账单、租客、抄表、设置等正式页面真实迁入 `src/minix`，并收口页面壳、页面装配层、route-level 数据边界、宿主绑定拆分与页面级验收基线；当前轮处于阶段文档审核阶段，未经用户批准不直接进入 `/spec` 或实现。
- `phase11-04` 已进一步冻结 legacy 回滚资产清单、保留条件、退出条件与 `Rento-legacy` 的只读边界；后续阶段不得把 `Rento-legacy` 重新引入为默认 remote、部署入口、回滚入口或第二真相源。
- `phase08` 当前轮规划已明确：只冻结最小 API/Auth 骨架，不提前迁移治理接口、正式领域服务或部署切线。
- `Rento-legacy` 只承担旧主线历史备份与只读参考职责，不作为当前仓库的默认 push remote、默认上游或第二真相源。
- 旧容器化运行线只保留“当前存量运行线参考 + 回滚基线 + 差异对照”职责；在新部署主线冻结前，不继续扩写为 `Rento-miniX` 的未来正式交付真相源。
- legacy 资产只有在正式部署主线、发布门禁、部署演练与回滚验证全部通过审核，且替代真相源与回滚记录冻结后，才允许进入后续退出决策；本阶段不直接删除这些资产。
- 任何涉及合同、账单、支付周期、仪表、抄表主链的重构，都必须在后续 `analysis`/阶段文档中明确：
  - 是否影响历史数据
  - 是否影响其他入口或生成路径
  - 是否需要数据修复
  - 验收标准与回滚条件
