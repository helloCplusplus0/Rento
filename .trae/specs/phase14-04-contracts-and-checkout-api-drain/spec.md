# Phase14 合同与 Checkout API Drain Spec

## Why
`phase14-03` 已冻结 rooms/buildings/meters 的 D2 边界，但合同主链与 checkout 仍同时存在 retained-legacy drain 分类、统一 Hono `/api` 对外宿主、旧 Next 镜像入口与共享领域服务承接位。若不先把合同列表、详情、编辑、续租、退租、补账单与 checkout 子路由的正式请求宿主、drain 分类与 compat 保留边界冻结成单一解释，后续实现层仍会反复争论“合同真相到底在 Hono、旧 Next 还是共享领域服务”。

## What Changes
- 冻结合同域 `/api/contracts*` 当前请求宿主、读写语义、compat-wrapper 与 retained-legacy drain 分类的单一解释。
- 明确 `server/routes/contracts.ts` 当前承接的合同列表、新签创建、详情、编辑、激活、续租、补账单与删除门禁边界。
- 明确 `server/routes/checkout.ts` 当前承接的退租结算正式写入口，以及旧 `src/app/api/contracts/[id]/checkout/route.ts` 的 compat-wrapper 身份。
- 冻结 `server/routes/domain.ts` 中 `'/contracts/:contractId/checkout'` 先于 `'/contracts'` 挂接的路由优先级解释，避免 checkout 子路径被更宽泛的合同骨架误吞。
- 明确 `phase13` 合同详情、编辑、续租、退租页面与 `phase09` 共享领域服务结论，继续作为 `phase14-04` 的直接输入。
- 保持本子任务只做冻结与解释，不实现 API 切流、不删除旧路由、不重写合同业务语义或页面表单。

## Impact
- Affected specs: `phase14-api-query-parity-and-legacy-route-drain`、`phase13-frontend-page-parity-implementation`、`phase09-05-checkout-renewal-and-main-flow-consistency`、`phase09-02-contract-lifecycle-delete-guards`
- Affected code: `docs/phase14_*`、`server/routes/contracts.ts`、`server/routes/checkout.ts`、`server/routes/domain.ts`、`src/app/api/contracts/**/route.ts`、`src/lib/domain/contracts/index.ts`、`src/lib/domain/delete-guards/index.ts`、`server/lib/legacy-route-inventory.ts`

## ADDED Requirements
### Requirement: Contracts Domain Freeze
系统 SHALL 为合同域提供单一的宿主与 drain 解释，明确 `/api/contracts`、`/api/contracts/:id`、`/api/contracts/activate`、`/api/contracts/:id/renew`、`/api/contracts/:id/generate-bills`、`DELETE /api/contracts/:id` 当前哪些仍属 retained-legacy drain，哪些已由 Hono 作为 compat-wrapper 承接，以及旧 Next 文件当前仅承担镜像实现与回滚基线职责。

#### Scenario: 合同主链读写边界可解释
- **WHEN** 团队查看 `/api/contracts` 与 `/api/contracts/:id`
- **THEN** 能明确 `GET/POST /api/contracts` 与 `GET/PUT /api/contracts/:id` 当前仍属于 retained-legacy drain，而统一 `/api` runtime 的当前对外请求宿主已经是 `server/routes/contracts.ts`
- **AND** 能明确 `POST /api/contracts/activate`、`POST /api/contracts/:id/renew`、`POST /api/contracts/:id/generate-bills` 与 `DELETE /api/contracts/:id` 已由 `server/routes/contracts.ts` + 共享领域服务承接为 compat-wrapper
- **AND** 能明确旧 `src/app/api/contracts*` 文件在 `GET/POST/PUT` 上继续保留镜像实现与回滚基线价值，而不是当前唯一正式请求入口

#### Scenario: 合同锚点与历史保留不被弱化
- **WHEN** 团队评估合同编辑、续租、补账单与删除门禁
- **THEN** 不会把“合同是主链事实锚点”改写成普通 CRUD 迁移问题
- **AND** 继续保持账单、抄表、BillDetail 与删除门禁的历史保留约束

### Requirement: Checkout Domain Freeze
系统 SHALL 为 checkout 子域提供单一的正式写入口解释，明确 `POST /api/contracts/:contractId/checkout` 当前由 `server/routes/checkout.ts` 与 `src/lib/domain/contracts/index.ts` 承接，旧 Next 入口仅保留 compat-wrapper 与回滚价值。

#### Scenario: 退租结算宿主边界稳定
- **WHEN** 团队查看 `/api/contracts/:contractId/checkout`
- **THEN** 能明确正式事务编排位于 `server/routes/checkout.ts` + `src/lib/domain/contracts/index.ts`
- **AND** 旧 `src/app/api/contracts/[id]/checkout/route.ts` 只保留 compat-wrapper、会话透传与回滚基线职责

### Requirement: Checkout Route Priority Freeze
系统 SHALL 冻结 checkout 子路径与 contracts 路由骨架的挂载优先级解释，确保更窄的 `'/contracts/:contractId/checkout'` 先于 `'/contracts'` 被挂接，且该解释可被后续实现层直接复用。

#### Scenario: checkout 子路由不被 contracts 骨架吞掉
- **WHEN** 团队查看 `server/routes/domain.ts` 的 Hono 路由树
- **THEN** 能明确 `domainRoutes.route('/contracts/:contractId/checkout', createCheckoutRoutes(env))` 必须先于 `domainRoutes.route('/contracts', createContractRoutes(env))`
- **AND** 该顺序既符合当前代码事实，也符合 Hono “先组装子路由、再挂父应用，且按注册顺序匹配”的最新路由组织原则

### Requirement: Phase13 And Phase09 Contract Handoff Reuse
系统 SHALL 直接复用 `phase13` 合同详情/编辑/续租/退租页面交接与 `phase09` 共享领域服务结论作为 `phase14-04` 输入，而不是重新做页面迁移审计或重写续租/退租业务规则。

#### Scenario: 页面输入与服务真相直接复用
- **WHEN** 后续 `phase14-04` 及其实现层继续推进合同主链 drain
- **THEN** 直接继承 `phase13` 页面-API/query 交接与 `phase09-05` 的 checkout/renew/generate-bills 正式写路径结论
- **AND** 不把 query parity 与页面 parity 混写为同一类任务

## MODIFIED Requirements
### Requirement: Phase14 Contracts Drain Definition
`phase14` 在合同域的 drain 定义 SHALL 细化为“先冻结 retained-legacy 主链读写与统一 Hono 请求宿主并存的单一解释，再进入真实实现层处理合同主链迁移”，不得把已存在的 Hono 同名入口误写成“整域已切流完成”。

#### Scenario: 合同域不会被误判为已完成切流
- **WHEN** 团队评估 `phase14-04` 产出
- **THEN** 能明确 contracts 域当前仍处于“统一 Hono 请求宿主已暴露，但 `GET/POST/PUT` 仍属 retained-legacy drain、部分生命周期写路径为 compat-wrapper、checkout 独立子域 formal write host”并存状态
- **AND** 不会因为 `server/routes/contracts.ts` 已存在就把 `GET/POST /api/contracts` 与 `GET/PUT /api/contracts/:id` 误判为 contracts 主域已完成 formal-host-owned 切流

## REMOVED Requirements
### Requirement: None
**Reason**: 本子任务只新增 `phase14-04` 的冻结与解释要求，不移除既有能力。
**Migration**: 无。
