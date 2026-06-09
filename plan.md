# plan.md

## 当前默认入口
- 当前默认工作流：`phase16-parity-verification-cutover-and-legacy-exit`
- 当前阶段目标：在 `phase10` 已冻结 `Prisma + PostgreSQL` 数据访问主线、查询分层、统一事务边界与迁移兼容边界，`phase11` 已冻结正式部署主线、回滚基线与发布门禁，且 `phase12 ~ phase15` 已分别完成页面 parity、正式业务 API/query parity 与纯新主线 PWA/runtime parity 的前提下，进入仅继承结果的 `phase16` 最终验收与 cutover 路线。
- 当前执行方式：`phase12` 已完成页面事实表、页面装配与路线图冻结；`phase13` 已完成正式业务页面 `25/25` 迁移；`phase14` 已完成 `phase14-01 ~ phase14-07` 的冻结输入、两波真实 API/query cutover、route inventory 审计与阶段收口。后续 `phase15` 仅继承纯新主线页面与 API 边界结果，不再承担任何正式业务 API 迁移职责。
- 当前下一步：以 [phase15_minix_pwa_and_runtime_parity_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase15_minix_pwa_and_runtime_parity_architecture_plan.md)、[phase15_minix_pwa_and_runtime_parity_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase15_minix_pwa_and_runtime_parity_dev_plan.md)、[phase15_minix_pwa_and_runtime_parity_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase15_minix_pwa_and_runtime_parity_shared_baseline.md)、[phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md)、[phase14_api_query_parity_and_legacy_route_drain_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_dev_plan.md)、[phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md) 与本文件中的 `phase12 ~ phase16` 路线图作为已完成上游输入，进入 `phase16` 的 `/plan` 与最终验收准备；在此期间不再把 `phase15` 视为进行中阶段。
- 当前人工验收补充：本地 `PC + Edge/Chrome + HTTP` 已验证安装提示、安装成功与登录链路正常；本地移动端 `Edge/Chrome + HTTP` 不出现安装入口按浏览器安全要求与既有 `Rento` 部署经验属于预期退化，移动端安装提示的正式判断继续以带公认 HTTPS 证书的部署环境为准。
- 当前阶段说明：`phase10` 已完成并继续作为后续阶段的数据访问主线上游输入保留；`phase11` 已完成并继续作为正式部署主线、发布门禁与 legacy 回滚基线的稳定上游输入保留；`phase13` 已完成当前轮真实页面迁移与阶段尾项收口；`phase14` 已完成 API 层迁移收口，旧 `src/app/api/*` 中已不存在承担正式业务主职责的 retained-legacy 路由，剩余 retained-legacy 仅限治理/辅助接口，`phase15` 与 `phase16` 只继承结果，不再继续承担正式业务 API 迁移职责。

## 阶段顺序

### phase01-restart-foundation
- 目标：完成项目级治理文档、目录归档、文档去漂移、PostgreSQL-only 口径统一。
- 关键交付：
  - `AGENTS.md`
  - `project_rules.md`
  - `architecture_map.md`
  - `plan.md`
  - 历史任务文档归档
  - README / QUICK_START / DEPLOYMENT / ENVIRONMENT_GUIDE / `.env.example` 同步
- 验收条件：
  - 顶层文档不再引用其他项目内容
  - 主文档不再把 SQLite 当作当前支持方案传播
  - `docs/task_*.md` 不再占据主文档路径
  - 当前仓库结构和说明一致
- 当前结论：
  - 已完成
  - 已具备恢复开发条件，但尚未满足公网发布条件

### phase02-auth-gate
- 目标：补齐最小认证门禁，阻断公网裸奔风险。
- 关键交付：
  - 登录页与登录/登出 API
  - 页面与 API 的统一认证策略
  - 基于 `httpOnly cookie` 的最小 Session 方案
  - 最小角色模型（至少 `ADMIN`）
  - 鉴权相关环境变量和文档
- 验收条件：
  - 未登录用户无法访问核心业务页与写 API
  - 已登录管理员可正常访问核心业务页面和 API
  - 页面门禁与 API 门禁口径一致
  - 公网部署具备最小可接受安全边界
- 当前结论：
  - 已完成
  - 页面和核心业务 API 均已接入最小认证闭环

### phase03-consistency-hardening
- 目标：修复核心业务链的一致性问题与历史语义漂移。
- 关键交付：
  - 房间/合同/账单/仪表的删除与状态门禁清单
  - 多仪表历史保留策略收口
  - 关键查询和金额语义复核
  - 迁移锁与数据库口径治理方案
- 验收条件：
  - 关键状态流转有明确规则
  - 不再存在“文档正确、代码行为相反”的主链路问题
- 当前结论：
  - 已完成
  - 已为 `phase04` 的性能治理、观测治理与辅助入口治理提供稳定上游前提

### phase04-performance-and-ops
- 目标：在安全与一致性稳定后，再处理查询性能、运维可观测性与调试辅助入口治理。
- 关键交付：
  - 列表接口数据库侧优化
  - 健康检查与日志补强
  - dev-only 页面分类和门禁
- 验收条件：
  - 关键接口性能达标
  - 运行辅助页面不再污染正式业务入口
- 当前结论：
  - 已完成
  - 已完成当前阶段既定子任务

### phase05-pwa-delivery
- 目标：在保持单一 Next.js Web 主线、单 UI 与低复杂度前提下，把旧 `Rento` 收口为受控安卓优先、可安装、可解释、可维护的私有管理 Web App。
- 关键交付：
  - 正式支持矩阵、环境分层与退化策略
  - 安装壳、manifest、图标与启动体验收口
  - 最小 service worker、更新策略与最小离线兜底
  - 关键业务页移动端可用性收口
  - 私有部署、安装流程与发布前验收说明
- 验收条件：
  - 移动端主线已经明确冻结为单一 Web 主线，不回退到 Flutter / 原生双线
  - 正式支持浏览器中可完成安装、启动、更新与失败退化闭环
  - 关键业务页面在主流手机尺寸下具备可接受可用性
  - 安装与缓存增强不破坏正常 Web 访问主线与既有安全边界
- 当前结论：
  - 已完成
  - 已完成阶段级文档与对应实现落地：
    - `docs/phase05_pwa_delivery_architecture_plan.md`
    - `docs/phase05_pwa_delivery_dev_plan.md`
    - `docs/phase05_pwa_delivery_shared_baseline.md`

### phase06-minix-replatform
- 目标：在保持当前 UI 展示效果与业务主链语义不失真的前提下，完成 `Rento-miniX` 原地重构主线的顶层切换、边界冻结与实施顺序设计。
- 关键交付：
  - 根级真相源切换
  - `phase06` 架构规划、开发规划与共享基线
  - 旧 `Rento` 存量运行线与 `Rento-miniX` 新主线关系冻结
  - 原内嵌 `Rento-miniX/` 目录的抽取、复核与清理收口
  - `Hono` 版完整 Phase 路线图与模块迁移分类
  - 原 `Rento-miniX/` 内嵌目录文件级吸收映射、删除门禁与删除结果
  - 后续实现子任务顺序与门禁
- 验收条件：
  - 当前仓库的主叙事、主文档与阶段文档口径一致
  - UI 默认承接、PostgreSQL 固定主线、低复杂度重构原则全部冻结
  - 后续实现可以直接按 `phase06` 子任务顺序进入 `/spec`
  - 原内嵌 `Rento-miniX/` 目录已完成吸收、引用复核与实际删除，不再继续争夺长期真相源
- 当前结论：
  - 已完成
  - 已完成根级真相源切换、完整路线图冻结、模块分类冻结以及原内嵌目录删除收口，作为 `phase07` 上游输入保留

### phase07-app-shell-and-runtime-foundation
- 目标：承接 `Rento-miniX` 的前端应用壳、服务端运行时入口、基础路由、中间件与最小健康检查骨架。
- 关键交付：
  - 前端应用壳与路由承接位
  - 服务端运行时入口与基础中间件
  - 最小健康检查与环境变量口径
  - 旧运行线到新应用壳/运行时的映射与退出条件
  - `React Router`、双服务代理与“先并行壳后切换”的阶段决策
- 验收条件：
  - 新主线已有单一应用壳与运行时承接位
  - 不再需要继续把后续迁移挂靠在旧 `Next.js` 宿主之上
  - UI 默认承接边界、业务主链语义与环境变量口径未被破坏
  - `phase07` 的阶段文档已完整冻结实现目录、脚本方案与最小环境变量口径
- 当前结论：
  - 已完成
  - 已完成应用壳、运行时入口、旧运行线映射与退出条件冻结，作为 `phase08` 与 `phase09` 的直接上游输入保留

### phase08-api-and-auth-foundation
- 目标：承接 `Hono` API 骨架、认证会话、错误处理、最小安全边界与基础 API 契约。
- 关键交付：
  - 统一 API 宿主
  - 认证会话与门禁中间件
  - 错误处理与基础请求约束
  - API 契约与环境变量约束
- 验收条件：
  - 新 API 宿主已可稳定承接后续主链业务接口
  - 页面门禁与 API 门禁继续保持一致
  - 不因切换宿主而破坏既有最小安全边界
- 当前结论：
  - 已完成
  - 已完成统一 API 宿主、最小认证闭环、请求治理、统一错误出口、最小公开 API 白名单、环境变量“新主旧兼”口径与 `src/minix` 最小页面守卫收口，作为 `phase09` 的直接上游输入保留

### phase09-domain-service-migration
- 目标：迁移合同、账单、支付周期、仪表、抄表、删除门禁等主链领域服务，使新主线承接业务真相。
- 关键交付：
  - 合同主锚点相关领域服务
  - 账单、支付周期与删除门禁语义迁移
  - 多仪表与历史保留规则迁移
  - 主链查询与写路径的一致性收口
- 验收条件：
  - 主链业务语义在新主线中可解释、可追溯
  - 历史数据保留原则未被破坏
  - 页面预期、服务端生成结果与数据库事实口径一致
- 当前结论：
  - 已完成
  - 已完成 `phase09-01 ~ phase09-06` 子任务实现、验证、`smoke:phase09:all` 与 `audit:phase09:legacy-routes` 收口；`docs/phase09_*` 已成为后续 `phase10` 的直接上游输入

### phase10-data-access-and-migration-closure
- 目标：冻结长期数据访问层方案，收口 ORM、查询模式、事务边界、迁移链兼容项与退出条件。
- 关键交付：
  - 长期数据访问层方案判断
  - 查询模式与事务边界收口
  - 迁移链兼容项说明与退出条件
  - 与领域服务一致的数据访问约束
  - 最低验证命令、仅文档变更时的最小验证要求与 `phase11` 直接继承输入清单
- 验收条件：
  - 数据访问层服务于已冻结的领域语义，而非反向驱动业务设计
  - 历史迁移兼容项的存在原因、当前作用与退出条件明确
  - 不再存在“运行时已切换但数据访问层真相不清”的状态
- 当前结论：
  - 已完成阶段级文档与 `phase10-01 ~ phase10-05` `/spec` 收口，现已作为 `phase11` 的稳定上游输入保留，不再承担当前默认工作流职责
  - `phase09-06` 的 legacy route inventory、Prisma 事务口径与 SQLite 兼容残留已被纳入本阶段直接输入，并已冻结最低验证命令为 `npm run audit:phase09:legacy-routes`、`npm run lint`、`npm run type-check`
  - 若本轮仅涉及文档，仍至少完成 `docs/phase10_*` 互链与被引用路径存在性复核

### phase11-deployment-cutover-and-cutline-closure
- 目标：完成部署主线切换、回滚基线冻结、旧运行线退出条件与最终发布门禁收口。
- 关键交付：
  - 新部署主线与回滚基线
  - 旧容器化运行线退出条件
  - 发布前验收门禁与切线说明
  - 文档最小验证要求与部署/回滚演练记录要求
  - `Rento-legacy`、当前仓库与新部署主线的最终关系收口
- 验收条件：
  - 部署主线切换不会反向干扰前序应用壳、API、领域与数据访问层
  - 回滚路径、健康检查与发布门禁完整可解释
  - 顶层真相源、`DEPLOYMENT.md` 与 `docs/phase11_*` 对当前状态、最低验证要求和部署演练要求保持单一解释
  - 旧容器化运行线已明确退为历史运行线/回滚参考
- 当前结论：
- 已完成 `phase11-01 ~ phase11-05` 当前轮已批准 spec 收口
- 正式部署主线、legacy 回滚基线、环境模板、健康检查、发布门禁、文档最小验证要求与部署/回滚演练记录要求已同步冻结到 `docs/phase11_*`、`DEPLOYMENT.md` 与根级真相源

### phase12-frontend-parity-and-shell-cutover
- 目标：在保持当前 `Rento` UI 展示效果、页面信息结构与主链业务语义不失真的前提下，冻结旧 `src/app` 正式业务页面壳迁入 `src/minix` 所需的页面事实表、页面装配边界、前端路由承接位、UI 保真规则与后续 `phase12 ~ phase16` 完整迁移路线图。
- 关键交付：
  - 旧 `src/app` 页面到 `src/minix` 路由承接位的一一映射
  - 页面装配层、导航壳、布局壳与数据加载边界的复用/迁移策略
  - 旧 UI 承接硬约束与允许的最小技术适配边界
  - `Prisma + PostgreSQL` 继续保留为正式数据访问主线的阶段继承口径
  - 后续 `phase13 ~ phase16` 的完整路线图与交付顺序
- 验收条件：
  - 能清楚说明当前哪些正式页面仍在旧宿主、哪些页面先迁、哪些页面继续延后
  - 能清楚说明如何在不重做 UI 的前提下，为后续页面迁移实施冻结页面壳与页面装配逻辑
  - 能清楚说明 `phase12 ~ phase16` 的职责边界、上游输入与顺序关系
  - 阶段文档已完成 `architecture_plan`、`dev_plan` 与 `shared_baseline` 产出，并与顶层真相源互链一致
- 当前结论：
  - 已完成当前轮阶段文档与 `phase12-05` 路线图一致性收口
  - 当前真相源已同步为“`phase12` 只负责冻结与收口；后续待新增 `phase13-frontend-page-parity-implementation` 承接真实页面迁移实施”

### phase13-frontend-page-parity-implementation
- 目标：基于 `phase12` 已冻结的页面事实表、页面映射、页面装配复用策略与 UI 保真边界，把旧 `src/app` 的正式业务页面壳、页面装配边界与前端路由承接位逐步真实迁入 `src/minix`。
- 关键交付：
  - 首页、房源、合同、账单、租客、抄表、设置等正式页面在 `src/minix` 的真实路由与页面壳落位
  - 页面装配层、数据加载边界与页面级错误/加载状态从旧宿主迁入新宿主
  - `src/components/pages/*`、`src/components/business/*`、`src/components/layout/*` 在新宿主下的复用与宿主适配落地
  - 页面 parity 的最小验收矩阵与人工浏览器验收基线
- 验收条件：
  - 首批正式业务页面已不再只是 `PlaceholderPage` 承接位，而是具备真实页面壳与页面装配能力
  - 任何已迁页面都必须继续以旧 `Rento` 源代码为直接原型，并在除最小技术适配外达到接近 `100%` 的信息结构、组件表达、导航节奏、表单交互、状态反馈与主链语义保真度
  - 页面迁移继续保持旧 UI 原型、导航节奏、表单交互与主链业务语义不失真
  - 不把 API/query parity、PWA parity 或 cutover 职责混写进本阶段
- 当前结论：
  - 已完成 `phase13-05-page-parity-acceptance-baseline-closure` 最终复核与文档收口
  - `phase13-06-dashboard-parity-closure` 与 `phase13-07-bill-stats-route-parity` 已完成首页 `/` 与 `/bills/stats` 的尾项收口
  - 正式业务页面 `25/25` 已迁移并完成当前轮页面 parity 验收基线收口，`phase13` 可以视为当前轮整体完成
  - 依赖 `phase12` 已冻结的页面事实表、页面映射、复用矩阵、UI 保真边界与实施优先顺序
  - 后续默认不再新增 `phase13` 页面迁移子任务；下一步应进入 `phase14` `/plan`

### phase14-api-query-parity-and-legacy-route-drain
- 目标：清空旧 `src/app/api/*` 中仍承担正式业务职责的 retained-legacy 路由，把正式 API / query 承接位继续收口到 Hono 宿主与已冻结的数据访问主线之上。
- 关键交付：
  - `phase14-01 ~ phase14-04` 冻结与实施输入层，以及 `phase14-05 ~ phase14-07` 真实迁移波次与阶段收口层的阶段拆分
  - retained-legacy / compat-wrapper / formal-host-owned 路由分类更新与退出顺序
  - 合同、账单、房间、租客、仪表、设置、dashboard 等正式接口的宿主切流方案
  - 查询路径、写路径、事务边界与历史保留约束的阶段继承说明
  - 旧宿主 API 可删除前提与 compat 保留条件
- 验收条件：
  - 正式业务 API 的最终宿主清单单一可解释
  - 不因宿主迁移破坏主链语义、历史数据保留与删除门禁
  - 正式业务 retained-legacy 路由已完成清零，剩余 retained-legacy 仅限治理/辅助接口
  - `phase14` 阶段完成必须包含真实 API/query drain 实施、route inventory 审计与验收结果，而不是只完成冻结文档
- 当前结论：
  - 已完成 `phase14-01 ~ phase14-04` 的冻结与实施输入层同步
  - 已完成 `phase14-05` 主链 API cutover、`phase14-06` query/bridge cutover 与 `phase14-07` route inventory 审计、保留边界复核、回滚基线冻结和顶层真相源同步
  - 旧 `src/app/api/*` 中已不存在承担正式业务主职责的 retained-legacy 路由；正式业务路径已统一收口为 `formal-host-owned` 或 `compat-wrapper`
  - `phase15` 与 `phase16` 仅继承本阶段输出的 API/query parity、compat 保留边界与回滚基线结果，不再承担正式业务 API 迁移职责

### phase15-minix-pwa-and-runtime-parity
- 目标：把 PWA 能力从旧 Next 宿主迁移到 `Vite + Hono` 新主线，使纯 `Rento-miniX` 具备与当前受控 Web App 等价的安装、更新、离线兜底与发布口径。
- 关键交付：
  - 新主线 `manifest`、`service worker`、安装提示、更新提示与最小离线页的承接策略
  - 新主线 PWA 缓存边界、安全边界与不缓存动态鉴权业务接口的规则
  - `Vite` / Hono / 静态托管的 PWA 产物交付口径
  - 与 `phase05` 既有 PWA 验收价值对齐的新主线验收清单
- 验收条件：
  - 纯新主线具备与当前受控 PWA 等价的最小能力
  - PWA 迁移不反向引入第二套前端宿主或第二套缓存真相源
  - PWA 验收清单与发布门禁可被后续 cutover 审核直接引用
- 当前结论：
  - 已完成当前轮 `/plan`、阶段文档与实现收口
  - 仅继承 `phase13` 页面 parity 结果、`phase14` 已完成的正式 API/query 宿主边界、compat 保留条件与回滚基线，不再承担任何正式业务 API 迁移职责
  - 已完成 `src/minix/*`、`public/*`、`server/lib/static.ts`、`.env.example` 与 `scripts/pwa-smoke-check.sh` 的单一 PWA 交付链路收口
  - 已完成当前轮工程验证、独立审核与人工验收补充：本地 PC 安装/登录链路通过，本地移动端 HTTP 不出现安装入口属于预期退化；移动端安装体验的正式浏览器结论继续以带公认 HTTPS 证书的部署环境为准
  - 后续 `phase16` 只继承本阶段的 PWA parity、人工验收边界与发布口径结果，不再回写 `phase15` 实现职责

### phase16-parity-verification-cutover-and-legacy-exit
- 目标：基于 `phase13 ~ phase15` 的迁移结果，完成自动化对齐、人工浏览器验收、cutover 审核、回滚演练与 legacy 技术栈退出条件收口。
- 关键交付：
  - 旧 `Rento` 与纯新主线 `Rento-miniX` 的功能 parity 矩阵
  - 自动化 smoke / API parity / 页面级冒烟与发布前验证要求
  - 人工浏览器操作验收清单与结果记录
  - 正式 cutover 审核与 legacy 退出顺序、删除前提、回滚窗口说明
- 验收条件：
  - 能证明纯新主线可在不依赖旧 `src/app` / `src/app/api/*` / Next PWA 宿主的前提下完成正式业务交付
  - cutover 审核、回滚演练与 legacy 退出条件具备单一解释
  - 旧技术栈只剩归档/只读参考职责，不再是正式运行必需项
- 当前结论：
  - 尚未进入 `/plan`
  - 当前默认下一步为基于 `phase13` 页面 parity、`phase14` API/query parity 与 `phase15` PWA parity 的实现和验证结果，进入最终验收、cutover 审核、回滚演练与 legacy 退出规划
  - 仅继承既有页面/API/PWA parity 结果，不再承担任何正式业务 API 迁移职责

## `phase12 ~ phase16` 闭环路线图矩阵
| 阶段 | 核心职责 | 直接继承输入 | 前置依赖 | DoD | 退出条件 | 仅文档轮次最小验证要求 |
| --- | --- | --- | --- | --- | --- | --- |
| `phase12-frontend-parity-and-shell-cutover` | 冻结旧页面清单、页面映射、页面装配复用、UI 保真边界与多阶段路线图 | `phase10` 的数据访问边界、`phase11` 的部署/回滚边界、旧 `src/app/*` 页面原型、新 `src/minix/*` 承接位 | `phase10`、`phase11` 已完成并冻结上游输入 | 三份 `docs/phase12_*` 文档与顶层真相源已写清页面事实表、路线图矩阵、页面-API 联动、复用矩阵与 UI 保真边界 | `phase12-05` 完成，且顶层真相源不再保留“等待审核/不进入 spec”的旧状态描述；后续只在批准新增 `phase13` 实施阶段后进入真实页面迁移 | `docs/phase12_*` 互链复核、被引用路径存在性复核、`README.md`/`AGENTS.md`/`project_rules.md`/`architecture_map.md`/`plan.md` 与 `docs/phase12_*` 状态一致性复核 |
| `phase13-frontend-page-parity-implementation` | 把首页、房源、合同、账单、租客、抄表、设置等正式页面真实迁入 `src/minix`，完成页面壳、装配层与数据加载边界承接 | `phase12` 的页面事实表、页面映射、页面装配复用矩阵、UI 保真边界与页面-API 联动 | `phase12` 已冻结页面迁移前置决策 | 首批正式业务页面不再只是 placeholder，真实页面壳、页面装配与页面级加载/错误边界已在新宿主落位 | 正式页面 parity 结果可被 `phase14` API/query parity、`phase15` PWA parity 与 `phase16` 最终验收直接引用 | 未来 `docs/phase13_*` 互链复核、被引用 `src/minix/*`/`src/components/pages/*`/`src/components/business/*`/`src/components/layout/*`/`src/app/**/page.tsx` 路径存在性复核、顶层真相源状态一致性复核 |
| `phase14-api-query-parity-and-legacy-route-drain` | 清空 retained-legacy 正式业务 API，收口正式 API/query 到 `server/` 与既有数据访问主线 | `phase13` 的真实页面 parity 结果、`phase12` 的页面-API 联动、`phase10` query/事务边界、`phase11` 发布门禁与回滚基线 | `phase12` 已冻结页面-API 关系，`phase13` 已提供真实页面承接结果 | `phase14-01 ~ phase14-04` 冻结与实施输入层、`phase14-05 ~ phase14-06` 真实迁移波次与 `phase14-07` route inventory 审计/顶层同步已形成单一闭环 | 旧 `src/app/api/*` 中不再存在承担正式业务主职责的 retained-legacy 路由；剩余 retained-legacy 仅限治理/辅助接口，`phase15` 与 `phase16` 只继承 API/query parity 结果与 compat/rollback 边界 | 未来 `docs/phase14_*` 互链复核、被引用 `server/*`/`src/lib/domain/*`/`src/lib/queries*`/`server/lib/legacy-route-inventory.ts` 路径存在性复核、顶层真相源状态一致性复核 |
| `phase15-minix-pwa-and-runtime-parity` | 把 PWA 安装、更新、manifest、service worker、最小离线页与缓存边界迁入纯新主线 | `phase05` PWA 基线、`phase13` 页面壳、`phase14` 正式 API 边界、`phase11` 部署主线 | `phase13` 页面入口与 `phase14` API 边界已就绪 | 新主线 PWA 安装、更新、离线兜底与缓存边界单一可解释，且不缓存动态鉴权业务接口 | 纯 `src/minix + server + public + vite.config.ts` 路径可独立承接最小受控 PWA 能力，不再依赖旧 Next PWA 宿主 | 未来 `docs/phase15_*` 互链复核、被引用 `vite.config.ts`/`public/*`/`server/lib/static.ts` 路径存在性复核、顶层真相源状态一致性复核 |
| `phase16-parity-verification-cutover-and-legacy-exit` | 完成功能 parity 验收、cutover 审核、回滚演练与 legacy 退出条件收口 | `phase11` 部署/回滚基线、`phase13` 页面 parity、`phase14` API parity、`phase15` PWA parity | `phase13 ~ phase15` 已提供可验证输出 | 页面/API/PWA parity 矩阵、自动化 smoke、人工浏览器验收、cutover/rollback 记录与 legacy 退出顺序形成单一闭环 | 能证明纯新主线在不依赖旧 `src/app/*`、旧 `src/app/api/*`、旧 Next PWA 宿主的前提下正式交付，且 legacy 资产只剩归档/只读参考职责 | 未来 `docs/phase16_*` 互链复核、被引用 parity 验收记录/部署记录/回滚记录/legacy 资产清单路径存在性复核、顶层真相源状态一致性复核 |

## 当前阶段结论
- 当前仓库具备继续原地重构的业务骨架，不建议从零重写。
- 当前最优策略已从“以 `phase14` 为当前默认入口完成正式业务 API/query parity 与旧 Next API 主职责 drain”推进到“以 `phase15 -> phase16` 仅继承 `phase13` 页面 parity 与 `phase14` API/query parity 结果，继续完成 PWA parity、最终验收、cutover 与 legacy 退出”。
- 当前正式数据访问主线继续固定为 `Prisma + PostgreSQL`；Prisma 替换不属于当前默认路线图，只作为后续条件成熟时的独立议题评估。
- 当前默认推进方向：`phase13` 与 `phase14` 已完成当前轮收口，旧 `src/app/api/*` 中不再存在承担正式业务主职责的 retained-legacy 路由；后续按 `phase15 -> phase16` 的顺序逐段推进，在 `phase16` cutover 审核完成前不直接删除 legacy 资产，也不把旧 UI 设计语言重新打开为可自由重做事项。

## 阶段执行工作流
- 当推进方向不明确时，先执行 `/plan`，在 `.trae/documents/` 下生成阶段推进计划文档，作为本轮阶段判断承接位。
- `/plan` 完成前，必须先同步 `AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md` 与 `architecture_map.md`，确保顶层真相源一致。
- 每个 `phase*` 默认先产出 `docs/phaseX_<workflow>_architecture_plan.md` 与 `docs/phaseX_<workflow>_dev_plan.md`；存在共享边界时，再补 `docs/phaseX_<workflow>_shared_baseline.md`。
- 阶段级文档产出后即停止工作流，等待用户审核；未经用户明确批准，禁止直接进入 `/spec` 或实现。
- 用户审核后，按 `dev_plan` 的子任务顺序逐个进入 `/spec`、开发、验收、提交并推送；每个子任务通过验收后再进入下一个子任务。
- `phase09` 审核通过前，不直接扩张到 ORM 最终定案、迁移链收口或部署切线实现。
- 完整 `Rento -> Rento-miniX` 阶段路线图由本文件长期承接；`docs/phase06_*` 仅负责解释本阶段为何冻结该路线图以及如何把它提升为全局真相源。
- `docs/phase07_*` 将承接应用壳、运行时入口、开发拓扑、实现目录与共享基线等阶段细节；本文件继续只保留阶段总览与验收结论。
- `docs/phase08_*` 将承接统一 API 宿主、认证门禁、中间件链、错误处理、最小公开 API 白名单与页面守卫边界等阶段细节；本文件继续只保留阶段总览与验收结论。
- `docs/phase09_*` 将承接共享领域服务落点、合同/账单/支付周期/仪表/抄表/删除门禁迁移顺序、兼容宿主边界与主链验证矩阵等阶段细节；本文件继续只保留阶段总览与验收结论。
- `docs/phase10_*` 将承接长期数据访问层方案、查询分层、事务边界、迁移兼容项与 legacy route inventory 对齐等阶段细节；本文件继续只保留阶段总览与验收结论。
- `docs/phase11_*` 将承接正式部署主线、服务端产物链、环境模板、健康检查、发布门禁、legacy 回滚基线与 cutline 退出条件等阶段细节；本文件继续只保留阶段总览与验收结论。
- `docs/phase12_*` 将承接旧页面到 `src/minix` 的映射表、页面装配复用策略、UI 保真边界与 `phase12 ~ phase16` 路线图冻结；本文件继续只保留阶段总览与验收结论。
- `phase10` 收口后的最低验证命令固定为 `npm run audit:phase09:legacy-routes`、`npm run lint`、`npm run type-check`；若仅文档变更，至少补做 `docs/phase10_*` 互链与被引用路径存在性复核。
- `phase11-05` 收口后，若本轮仅涉及 `phase11` 文档，最低验证要求固定为：`docs/phase11_*` 互链复核、被引用路径存在性复核，以及根级真相源与 `DEPLOYMENT.md` 状态一致性复核；若进入后续实施、演练或发布验证，最低工程验证命令固定为 `npm run lint`、`npm run type-check`、`npm run build:minix`、`npm run audit:phase09:legacy-routes`，并在条件允许时执行 `npm run smoke:phase09:all`。
- `phase12` 当前轮若仅涉及文档，最低验证要求固定为：`docs/phase12_*` 三份文档互链复核、被引用路径存在性复核，以及 `README.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md`、`plan.md` 与 `docs/phase12_*` 状态一致性复核；待进入新增 `phase13-frontend-page-parity-implementation` 阶段时，再由对应 `dev_plan` 冻结最低工程验证命令与页面 parity 验收要求。

## 历史说明
- 早期阶段围绕 MVP 功能、UI 落地和 SQLite 本地开发展开。
- 后续阶段转向 PostgreSQL 与容器化部署，并完成了认证、一致性、性能治理与 PWA 交付等阶段收口。
- 当前 GitHub 已新增 `Rento-legacy` 作为保留备份，原主仓已重命名为 `Rento-miniX`；当前仓库进入原地重构主线切换阶段。
