# plan.md

## 当前默认入口
- 当前默认工作流：`phase11-deployment-cutover-and-cutline-closure`
- 当前阶段目标：在 `phase10` 已冻结长期数据访问层方案、查询分层、统一事务边界与迁移兼容边界的前提下，为 `Rento-miniX` 收口正式部署主线、回滚基线、旧运行线退出条件与发布门禁。
- 当前执行方式：`phase10` 已完成阶段级文档与 `phase10-01 ~ phase10-05` `/spec` 收口；`phase11` 已基于这些上游输入进入已批准 spec 的顺序实现，`phase11-01 ~ phase11-04` 已完成当前轮收口。
- 当前下一步：继续以 [phase11_deployment_cutover_and_cutline_closure_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_architecture_plan.md)、[phase11_deployment_cutover_and_cutline_closure_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_dev_plan.md) 与 [phase11_deployment_cutover_and_cutline_closure_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase11_deployment_cutover_and_cutline_closure_shared_baseline.md) 为阶段真相源，继续按已批准的 `phase11-*` spec 顺序推进；当前已完成 legacy 回滚基线降级与边界收口，在正式 cutover 审核完成前不提前删除 legacy 资产。
- 当前阶段说明：`phase10` 已完成并作为 `phase11` 的直接上游输入保留；旧 `phase01~phase09` 继续作为历史连续性输入保留，`phase11` 当前以正式部署主线、环境模板、健康检查、发布门禁与 legacy 回滚基线收口为主。

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
  - 已完成阶段级文档与 `phase10-01 ~ phase10-05` `/spec` 收口，当前等待 `phase10` 最终审核
  - `phase09-06` 的 legacy route inventory、Prisma 事务口径与 SQLite 兼容残留已被纳入本阶段直接输入，并已冻结最低验证命令为 `npm run audit:phase09:legacy-routes`、`npm run lint`、`npm run type-check`
  - 若本轮仅涉及文档，仍至少完成 `docs/phase10_*` 互链与被引用路径存在性复核

### phase11-deployment-cutover-and-cutline-closure
- 目标：完成部署主线切换、回滚基线冻结、旧运行线退出条件与最终发布门禁收口。
- 关键交付：
  - 新部署主线与回滚基线
  - 旧容器化运行线退出条件
  - 发布前验收门禁与切线说明
  - `Rento-legacy`、当前仓库与新部署主线的最终关系收口
- 验收条件：
  - 部署主线切换不会反向干扰前序应用壳、API、领域与数据访问层
  - 回滚路径、健康检查与发布门禁完整可解释
  - 旧容器化运行线已明确退为历史运行线/回滚参考
- 当前结论：
  - 已进入已批准 spec 的顺序实现，`phase11-01 ~ phase11-04` 已完成当前轮收口
  - 正式部署主线、legacy 回滚基线、环境模板、健康检查与发布门禁已同步冻结到 `docs/phase11_*` 与根级真相源

## 当前阶段结论
- 当前仓库具备继续原地重构的业务骨架，不建议从零重写。
- 当前最优策略已从“完成 `phase10` 文档与 `/spec` 收口”推进到“按已批准的 `phase11-*` spec 顺序持续收口部署切线与回滚基线”。
- 当前默认推进方向：继续把 `phase11` 保持为默认工作流，按既定 spec 顺序推进后续任务与验证；在正式 cutover 审核完成前，不直接删除 legacy 资产或跳过既定发布门禁。

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
- `phase10` 收口后的最低验证命令固定为 `npm run audit:phase09:legacy-routes`、`npm run lint`、`npm run type-check`；若仅文档变更，至少补做 `docs/phase10_*` 互链与被引用路径存在性复核。

## 历史说明
- 早期阶段围绕 MVP 功能、UI 落地和 SQLite 本地开发展开。
- 后续阶段转向 PostgreSQL 与容器化部署，并完成了认证、一致性、性能治理与 PWA 交付等阶段收口。
- 当前 GitHub 已新增 `Rento-legacy` 作为保留备份，原主仓已重命名为 `Rento-miniX`；当前仓库进入原地重构主线切换阶段。
