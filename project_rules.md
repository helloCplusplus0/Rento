# project_rules.md

## 1. 范围与边界
- 当前项目定位为“私有租赁管理后台原地重构主线”，默认服务于自有房源经营，不以开放注册 SaaS 为目标。
- `phase07-app-shell-and-runtime-foundation`、`phase08-api-and-auth-foundation`、`phase09-domain-service-migration` 与 `phase10-data-access-and-migration-closure` 已完成当前轮阶段收口；`phase11-deployment-cutover-and-cutline-closure` 已完成 `phase11-01 ~ phase11-05` 当前轮已批准 spec 收口；`phase12-frontend-parity-and-shell-cutover` 已完成 `phase12-05` 文档收口并把页面 parity 冻结为单一上游输入。当前默认工作流已进入 `phase13-frontend-page-parity-implementation` 的实施尾段：`phase13-05` 已完成页面审计与验收基线收口，`phase13-06` 已完成首页 `/` 的高保真验收与状态收口，后续继续以 `plan.md`、`docs/phase12_*` 与 `docs/phase13_*` 承接 `phase13-07` 对 `/bills/stats` 的尾项收口。
- 所有设计必须围绕真实租务流程：房源、租客、合同、账单、仪表、抄表、退租、续租。
- `phase12 ~ phase16` 的当前轮重点必须建立在 `phase10` 已冻结的 `Prisma + PostgreSQL` 长期数据访问层方案、正式/兼容/治理查询分层、统一事务边界、迁移兼容项边界与 legacy route inventory 退出判断，以及 `phase11` 已冻结的正式部署主线、发布门禁与 legacy 回滚基线之上，不反向改写这些结论。

## 2. 安全与发布规则
- 在完整安全边界未收口前，禁止把应用作为公网匿名可访问后台部署。
- 生产环境必须使用私有 `.env`；`.env.example` 仅作为模板，不允许把真实主机地址、密码与密钥回写到共享文档。
- 任何涉及认证、会话、来源限制、CORS 的调整，都必须同时更新实现、环境模板和文档。
- 新增管理页、调试入口或迁移辅助入口时，必须先判断其门禁边界。

## 3. 数据与模型规则
- 数据库主线固定为 PostgreSQL，禁止以轻量化为由回退到 SQLite 主路径。
- `Meter` 必须被视为独立资产；移除房间绑定不等于删除历史数据。
- `MeterReading`、`Bill`、`BillDetail` 的历史记录优先保留，禁止用级联删除掩盖业务历史。
- 涉及账务的金额字段必须保持语义稳定；若有“月租金”“总租金”“首期应收”等概念，必须明确区分。
- 删除房间、删除合同、退租、续租等破坏性操作，必须经过服务端业务门禁校验，而不是只看页面状态。

## 4. UI 与交互规则
- 当前 `Rento` 前端 UI 展示效果已符合预期，`Rento-miniX` 默认承接该展示效果，不做无明确收益的重构。
- 允许的 UI 变更仅限：宿主适配、明显 bug 修复、移动端可用性改善、最小信息架构优化；且每类调整都必须附最小技术适配说明或明确收益说明。
- 新功能或新承载层优先复用既有页面模式和组件表达，避免出现另一套设计系统。
- 若需要调整交互，应优先把问题写进阶段文档和计划，再实施最小改动。
- 当进入 `phase12 ~ phase16` 时，必须把旧 `Rento` 页面信息结构、导航节奏、表单交互和组件表达继续视为默认原型参考；除非存在明确技术障碍，不得把新宿主迁移重写成另一套 UI 方案。
- 任何迁移操作都必须以旧 `Rento` 源代码为直接原型；除阶段文档中已显式批准的最小技术适配外，接近 `100%` 还原旧页面的信息结构、组件表达、导航节奏、表单交互、状态反馈与主链语义，必须作为验收通过条件之一。

## 5. 目录治理规则
- 根目录只保留当前有效入口：运行配置、环境模板、项目总览和顶层治理文档。
- 历史任务文档迁入 `docs/archive/`；历史性脚本迁入 `scripts/archive/`。
- `src/app` 中非正式业务入口的页面，应继续明确标注为“开发辅助”或“待归档候选”。
- 运行时产物目录如 `logs/`、`backups/`、`nginx/ssl/`、本地数据库文件，不应继续作为版本控制主路径的一部分。
- 仓库内原有的 `Rento-miniX/` 内嵌目录已按“抽取 -> 复核 -> 清理”完成删除，不再作为前置规划材料输入或第二套真相源存在。
- 根级真相源与 `docs/phase06_*` 已吸收该目录中的有效治理结论、阶段边界与关系冻结内容；后续 `/spec` 与实现不得再恢复任何同类内嵌规划目录作为当前阶段真相源。
- 若未来再次出现类似“仓库内第二套规划目录”，默认按双重真相源风险处理，需先完成全量吸收与引用复核，再决定是否允许短期保留。

## 6. 文档规则
- `README.md` 负责对外总览与当前状态说明，不承载过细的历史任务细节。
- `AGENTS.md` 负责入口摘要与执行总约束。
- `project_rules.md` 负责刚性规则与门禁。
- `architecture_map.md` 负责代码向结构映射、当前实现层与新主线规划层说明。
- `plan.md` 负责当前阶段顺序、目标、验收与近期行动计划，不承载子任务细节。
- 阶段级设计文档模板固定为 `docs/phaseX_<workflow>_architecture_plan.md`、`docs/phaseX_<workflow>_dev_plan.md`，必要时补充 `docs/phaseX_<workflow>_shared_baseline.md`。
- 子任务 `spec` 目录模板固定为 `.trae/specs/phaseX-<workflow>-<nn>-<task-name>/`。
- 当用户发起 `/plan` 后，必须先同步顶层规范文档，再产出阶段级设计文档；文档产出后必须停下，等待用户审核后才能进入 `/spec`。
- 在进入首个正式实现阶段 `/plan` 前，必须先冻结完整 `Hono` 版 Phase 路线图、模块迁移分类与原 `Rento-miniX/` 目录的文件级吸收映射；禁止只凭“首阶段名称已冻结”就直接进入后续实现规划。
- 进入 `phase07-app-shell-and-runtime-foundation` 后，必须先冻结 `React Router`、双服务代理、先并行壳后切换、实现目录方案与最小环境变量口径，再进入该阶段任一 `/spec`。
- 进入 `phase08-api-and-auth-foundation` 后，必须先冻结统一 API 宿主、最小公开 API 白名单、认证会话、错误处理、环境变量“新主旧兼”口径与 `src/minix` 最小页面守卫方案，再进入该阶段任一 `/spec`。
- 进入 `phase09-domain-service-migration` 后，必须先冻结共享领域服务落点、正式宿主边界、主链验证路径、历史数据保留约束与旧兼容宿主保留边界，再进入该阶段任一 `/spec`。
- 进入 `phase10-data-access-and-migration-closure` 后，必须先冻结长期数据访问层方案、正式/兼容/治理查询分层、事务边界、迁移兼容项说明与退出条件，再进入该阶段任一 `/spec`。
- 进入 `phase11-deployment-cutover-and-cutline-closure` 后，必须先冻结正式部署主线、服务端预构建产物链、环境模板、健康检查、发布门禁、legacy 回滚基线与 cutline 退出条件，再进入该阶段任一 `/spec`。
- 进入 `phase12-frontend-parity-and-shell-cutover` 后，必须先冻结旧 `src/app` 页面到 `src/minix` 的映射表、页面装配复用策略、UI 保真边界、`Prisma + PostgreSQL` 保留口径与 `phase12 ~ phase16` 的完整路线图，再进入该阶段任一 `/spec`。
- 进入 `phase13-frontend-page-parity-implementation` 后，必须先冻结 P0/P1 页面切片顺序、route module 组织方式、页面装配/数据加载边界、宿主绑定拆分策略、页面级加载/错态边界与人工浏览器验收基线，再进入该阶段任一 `/spec`。
- 进入 `phase13-frontend-page-parity-implementation` 后，任一页面子任务在标记“验收通过”前，必须额外完成“旧 `Rento` 原型 vs `Rento-miniX` 当前实现”的逐项对照；若仍存在说明性文案、开发态卡片、占位交互、重复入口或首页/列表/详情/表单信息结构漂移，则不得视为通过。
- 任一已批准 `spec` 的子任务在实施完成后，必须额外指定独立子代理执行审核验收；只有在子代理审核明确通过后，才允许把该子任务标记完成，并继续提交与推送远程仓库。
- `docs/fix/` 与已完成的 `docs/phase01~phase05_*` 默认保留为上游参考与历史结论，不再自动等同于当前默认工作流。
- 归档文档默认只读，不再作为当前实现依据。

## 7. 原地重构规则
- 当前仓库中的现有实现代码是原地重构的直接参考基线，不另行复制第二份嵌入式源码区。
- 当前默认工作流已推进到 `phase13-frontend-page-parity-implementation` 的实施尾段；后续实施必须继续建立在 `docs/phase12_*` 与 `plan.md` 已补齐的 `phase12 ~ phase16` 共同边界之上，并以新增的 `docs/phase13_*` 承接真实前端页面迁移实施的子任务顺序、页面切片边界、验收基线，以及 `phase13-07` 的尾项收口。
- 当前默认工作流下，任何页面迁移都不得以“真实页面壳已落位”替代“高保真迁移已完成”；若新宿主页面与旧 `Rento` 页面源代码相比仍存在显著结构漂移，只能视为中间实现结果，不得提前标记为验收通过。
- `phase06` 审核通过的最低前提，不仅包括根级真相源、目录治理和仓库状态收口，还包括：完整 `Hono` 路线图、模块分类与文件级吸收映射已冻结并通过审核。
- `phase07` 审核通过的最低前提，至少包括：前端路由方案、开发拓扑、并行壳切入策略、实现目录、脚本方案与最小环境变量口径均已冻结并通过审核；当前该阶段结论已作为 `phase08` 上游输入保留。
- `phase08` 审核通过的最低前提，至少包括：统一 API 宿主、认证门禁、中间件链、错误处理、环境变量约束与最小安全边界均已冻结并通过审核。
- `phase09` 审核通过的最低前提，至少包括：共享领域服务落点、正式宿主边界、主链验证路径、历史数据保留约束与旧兼容宿主保留边界均已冻结并通过审核。
- `phase10` 审核通过的最低前提，至少包括：长期数据访问层方案、正式/兼容/治理查询分层、统一事务边界、SQLite 兼容残留的存在原因与退出条件均已冻结并通过审核。
- `phase11` 审核通过的最低前提，至少包括：正式部署主线、服务端预构建产物链、正式环境模板、健康检查、发布门禁、legacy 回滚基线与 cutline 退出条件均已冻结并通过审核。
- `phase12` 审核通过的最低前提，至少包括：旧页面映射表、页面装配复用策略、UI 保真边界、`Prisma + PostgreSQL` 保留口径与 `phase12 ~ phase16` 完整路线图均已冻结并通过审核。
- `phase13` 审核通过的最低前提，至少包括：P0/P1 正式页面实施范围、route module 承接结构、页面装配/数据加载边界、宿主绑定拆分策略、页面级加载/错态边界、浏览器验收基线与 `phase14` 页面-API 依赖交接均已冻结并通过审核。
- `phase13` 任一已实施页面子任务的最低验收前提，除上述门槛外，还必须证明新页面继续以旧 `Rento` 源代码为原型并达到接近 `100%` 的页面保真度；若仅完成壳层落位、说明页替换、局部模块复用或最小状态边界承接，不得单独视为完成迁移。
- 原地重构默认优先最小边界、分阶段推进，不允许一次性把 UI、框架、ORM 与部署主线一起大爆炸式改写。
- 当前主动开发 remote 默认只保留 `origin -> Rento-miniX`；`Rento-legacy` 仅作为 GitHub 侧只读备份参考，不作为并行推送目标、默认上游或第二真相源。
- 旧容器化运行线相关文档、脚本与部署资产只承担“当前存量运行线参考 + 回滚基线”职责；在新部署主线冻结前，不得继续扩写成 `Rento-miniX` 的未来正式主路径。
- `phase07` 已完成新应用壳与运行时承接位建立；后续阶段不得重新把新增前端宿主逻辑或新增 API/认证宿主逻辑默认写回旧 `Next.js` 宿主。
- `phase08` 期间允许在 `server/` 中冻结统一 API 宿主、认证门禁、中间件和错误处理骨架，但不得在该阶段直接迁移合同、账单、仪表、抄表等主链领域服务，也不得直接切换最终部署主线。
- `phase08` 期间新增公开 API 只允许收口到：
  - `/api/health`
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/session`
- `phase08` 期间 `AUTH_SESSION_SECRET` 是正式主变量；`NEXTAUTH_SECRET` 仅允许作为历史兼容回退项保留，不得继续作为新宿主的主真相源变量传播。
- `phase08` 期间 `src/minix` 只允许补最小登录守卫与登录页真实提交流程，不允许顺带扩写为完整角色框架或领域页面迁移。
- `phase09` 期间允许在 `server/` 中继续承接正式领域 API 路由外壳，但领域业务真相必须优先收口到可被新旧宿主共同复用的共享服务层，不允许再把新增主链语义写回旧 `src/app/api/*`。
- `phase09` 期间允许迁移合同、账单、支付周期、仪表、抄表、退租结算与删除门禁等主链领域服务，但不得直接切换 ORM 最终主线、迁移链方案或最终部署主线。
- `phase09` 期间删除语义继续优先拦截、终止、归档、停用与解绑，不允许因宿主迁移放宽历史事实保留规则。
- `phase10` 期间允许收口长期数据访问层方案、查询层分类、事务边界、迁移兼容项说明与 legacy route inventory 对齐，但不得在该阶段直接新增新的主链领域迁移范围，也不得直接切换最终部署主线。
- `phase10` 期间 `db push` 只能被标记为兼容兜底，不得被重新包装为正式 PostgreSQL 迁移链；在未完成专项治理前，不得贸然直接修改历史 `migration_lock.toml`。
- `phase10` 当前轮最低验证要求固定为：`npm run audit:phase09:legacy-routes`、`npm run lint`、`npm run type-check`；若本轮仅涉及文档，也至少完成 `docs/phase10_*` 互链与被引用路径存在性复核。
- `phase10` 进入后续阶段前，必须明确供 `phase11` 直接继承的最小上游输入：长期数据访问层方案、查询分层与 canonical read path、统一事务边界、迁移兼容项边界，以及与 `phase09-06` route inventory 对齐后的退出/保留判断。
- `phase11` 期间允许冻结 `Caddy + systemd + Hono + PostgreSQL` 的正式部署主线、服务端预构建产物链与发布门禁，但不得在该阶段反向新增新的主链领域迁移范围，也不得借部署切线放宽历史数据保留、认证门禁或迁移兼容边界。
- `phase11` 期间正式部署主线默认不再引入 `redis`；`redis` 仅允许继续留在旧容器化运行线的历史回滚基线中。
- `phase11` 期间根级 `DEPLOYMENT.md` 必须升级为当前正式部署真相源；旧容器化部署说明应明确降级为 legacy 回滚基线，并迁入归档入口或保留为附录。
- `phase11` 期间若调整部署方式、环境变量或健康检查，必须同步更新实现、`.env.example`、`README.md`、`architecture_map.md`、`project_rules.md` 与 `DEPLOYMENT.md`。
- `phase11-04` 期间必须盘点并持续保留以下 legacy 回滚资产清单，直到退出条件满足：`docker-compose.yml`、`nginx/nginx.conf`、`scripts/cloud-deploy.sh`、`scripts/bootstrap-deploy-assets.sh`、`scripts/start-entry.mjs`，以及历史容器化镜像、容器、`nginx`、`redis` 变量口径。
- `phase11-04` 期间必须把 legacy 容器化运行线冻结为“历史运行参考 + 故障回滚基线 + 差异对照”职责，不得再作为默认部署入口、默认运维入口或正式真相源扩写。
- `phase11-04` 期间 `Rento-legacy` 只允许作为 GitHub 侧只读历史备份与对照参考，不得作为部署入口、回滚入口、默认 remote、默认上游或第二真相源重新引入。
- legacy 资产只有在正式部署主线、发布门禁、部署演练与回滚验证全部完成并通过审核，且替代真相源与回滚记录冻结后，才允许进入后续退出决策；本阶段不得直接删除这些资产。
- `phase11` 当前轮最低文档验证要求固定为：`docs/phase11_*` 互链复核、被引用路径存在性复核；进入后续实现或发布验证前，最低工程验证要求固定为：`npm run lint`、`npm run type-check`、`npm run build:minix`、`npm run audit:phase09:legacy-routes`，并在条件允许时执行 `npm run smoke:phase09:all`。
- `phase11-05` 已冻结部署/回滚演练的最小记录要求：至少包含演练时间、目标环境、执行命令、健康检查结果、主链 smoke 结果、回滚触发条件与最终结论；记录必须明确标注“正式主线验证”或“legacy 回滚验证”，并可被根级真相源、`DEPLOYMENT.md` 或 `docs/phase11_*` 引用用于审核。
- `phase12` 期间允许冻结旧页面到 `src/minix` 的承接顺序、页面装配复用策略与 UI 保真规则，但不得把 UI 迁移扩写为视觉重设计，也不得在本阶段重新打开 ORM 替换议题；`Prisma + PostgreSQL` 继续固定为当前正式数据访问主线。
- `phase12` 当前轮最低文档验证要求固定为：`docs/phase12_*` 互链复核、被引用路径存在性复核，以及 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`plan.md` 与 `docs/phase12_*` 状态一致性复核；进入新增 `phase13-frontend-page-parity-implementation` 与后续页面/API/PWA/cutover 实施前，不以“路线图已规划”为理由跳过页面映射表、UI 保真边界、完整路线图、前后依赖、DoD 与退出条件审核。
- `phase13` 期间允许把首页、房源、合同、账单、租客、抄表、设置等 P0/P1 正式页面真实迁入 `src/minix`，并收口页面壳、页面装配层、route-level 数据边界、宿主绑定拆分与页面级验收基线，但不得在该阶段直接切 retained-legacy API/query、PWA runtime 或 legacy cutover。
- `phase13` 当前轮最低文档验证要求固定为：`docs/phase13_*` 互链复核、被引用 `src/minix/*`/`src/components/*`/旧 `src/app/**/page.tsx` 路径存在性复核，以及 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`plan.md` 与 `docs/phase12_*`、`docs/phase13_*` 状态一致性复核；在用户批准前，不得以“进入 phase13”为由直接跳过 `/plan` 文档审核进入 `/spec` 或实现。
- 对显著影响运行边界的路由、脚本、环境变量，必须有注释或文档解释其用途。
- 任何涉及合同、账单、支付周期、仪表、抄表主链的重构，必须在实施前明确：
  - 是否影响历史数据
  - 是否影响其他生成路径、统计路径或入口
  - 是否需要补数据修复策略
  - 至少一条可执行的主链验证路径

## 8. 发布门禁
- 提交前至少完成：`npm run lint`、`npm run type-check`。
- 若当前提交对应某个已批准 `spec` 子任务，还必须附带该子任务对应的独立子代理审核验收通过结论；未通过审核验收，不得提交或推送。
- 发布前至少完成：构建通过、`/api/health` 可用、核心业务流 smoke test。
- 若变更涉及账单、合同、仪表、抄表任一主链，必须补充最少一条可执行验证路径。

## 9. 当前已知治理债务
- 当前 `origin` 已收口到 `Rento-miniX`，但仍需持续防止把 `Rento-legacy` 或旧 `Rento` 地址重新引回主动开发、默认推送或部署资产入口。
- 迁移锁与早期迁移文件仍带有 SQLite 历史痕迹，当前通过部署脚本兼容；在后续专项任务中再完成正式收口。
- 最小鉴权门禁已落地，但角色控制、最小审计与公网发布所需的完整安全边界仍未全部完成。
- 旧容器化部署链仍能支撑存量运行线，但不应被误读为 `Rento-miniX` 的未来正式部署主线；其退出仍依赖 `phase11-04` 已冻结的保留条件、退出条件与回滚记录收口。
- 新主线运行时虽已完成 `build:minix` 前端 `dist/` 与服务端 `build/minix-server/` 预构建产物链收口，且 `phase11-05` 已冻结文档最小验证要求与部署/回滚演练记录要求，但正式部署演练执行、legacy 基线退出审计与最终 cutline 验证仍需在后续审核与演练中继续完成。
- 旧 `src/app` 页面、旧 `src/app/api/*` retained-legacy 路由与旧 Next PWA 宿主仍未完成纯新主线 parity；这些差距已被提升为 `phase12 ~ phase16` 的默认上游问题，不再继续混写到 `phase11` 的部署收口职责中。
