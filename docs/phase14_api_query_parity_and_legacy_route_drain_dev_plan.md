# Phase14 API Query Parity And Legacy Route Drain 开发规划

## 当前状态
- `phase14` 的开发规划用于把 retained-legacy API/query drain 拆成可逐个进入 `/spec` 的子任务顺序。
- 本文档不替代：
  - [phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md)
  - [phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md)
  - [phase14_execution_layer_correction_plan.md](file:///home/dell/Projects/Rento/.trae/documents/phase14_execution_layer_correction_plan.md)
- `phase13` 已完成正式业务页面 `25/25` 迁移、浏览器验收基线与页面-API/query 交接；`phase14` 当前不再承接页面迁移，而是承接 API/query parity 与 route drain。
- 当前 `server/routes/*` 与 `server/lib/legacy-route-inventory.ts` 已具备较完整承接基础；但结合 `phase14-04` 的实际执行结果，当前必须进一步明确：`phase14-01 ~ phase14-04` 只构成冻结与实施输入，真正用于完成整阶段 API 迁移的交付必须由后续 `phase14-05 ~ phase14-07` 负责吸收并收口。
- 补充约束：`phase14` 任一子任务都必须继续以旧 `src/app/api/*` 为直接参考基线，以 inventory 分类、shared compat helper 与共享领域服务现状为真实输入，而不是脱离现有代码重新设计一套 API 版图。
- 补充判断：当前真正的阻断已经不是“有没有 Hono 路由”，而是“哪些 Hono 路由已算正式宿主、哪些只是 bridge、哪些旧 Next API 仍在承担正式职责”。

## 一、文档定位
本文档用于把 `phase14-api-query-parity-and-legacy-route-drain` 拆分为顺序执行的实施子任务，确保仓库先完成前置冻结层，再进入真实实现层，避免再次出现“阶段定义是实施，但执行结果只有冻结文档”的偏差。

## 二、总体推进结论
`phase14` 的固定顺序为：

```text
先完成 `phase14-01 ~ phase14-04` 的冻结输入
    ->
再执行真实迁移波次一：rooms / contracts / checkout / bills 主链 API cutover
    ->
再执行真实迁移波次二：dashboard / settings / renters / meter-readings / utility 与残余 bridge/compat cutover
    ->
最后统一收口旧 Next API 的迁移完成判定、compat 保留边界与 legacy 回滚基线
```

原因如下：
- `phase14-01 ~ phase14-04` 已经足够把 route inventory、query host、删除门禁、contracts/checkout 边界与页面影响面冻结成单一解释，后续不再追加新的冻结型子任务。
- 若后续仍按业务域继续做“解释性冻结”，`phase14` 会再次重演 `phase12` 的问题：阶段名是迁移，实际交付却只有文档。
- 房源、合同、账单是一条连续主链；若不在同一实施波次里处理 rooms / contracts / checkout / bills，页面调用与 retained-legacy drain 会持续相互牵制。
- dashboard / settings / renters / meter-readings / utility 当前的主要问题是 query host、shared compat helper 与 bridge 尾项清理，更适合作为第二个实现波次整体处理。
- legacy exit baseline 必须最后统一收口，避免在真实迁移尚未完成时过早讨论“旧文件能不能删”。

## 二点五、当前实施状态快照
| 子任务 | 当前状态 | 当前结论 |
| --- | --- | --- |
| `phase14-01-route-inventory-reclassification-and-host-matrix` | 已完成（前置冻结层） | 已基于 inventory / Hono 路由 / `phase13` 交接表冻结统一分类规则、host matrix 字段集、页面影响面与 drain 优先级 |
| `phase14-02-dashboard-and-settings-query-host-closure` | 已完成（前置冻结层） | 已冻结 dashboard retained-legacy query host、Hono page-closure bridge、settings 治理型 retained-legacy 身份、页面影响与 D1 顺序 |
| `phase14-03-rooms-buildings-meters-api-drain` | 已完成（前置冻结层） | 已冻结 D2 宿主解释、删除门禁、页面影响与退出顺序，可作为 `phase14-04` 的直接上游输入 |
| `phase14-04-contracts-and-checkout-api-drain` | 已完成（D3 冻结同步，不计入真实迁移完成数） | 已基于 D1/D2 上游输入同步 contracts / checkout 的 D3 宿主解释、route priority、页面影响与复用边界；其真实 API/query drain 必须并入 `phase14-05 ~ phase14-07` 的实现波次收口 |
| `phase14-05-core-business-api-cutover-wave-1` | 待开始（真实迁移波次一） | 需真实推进 rooms / contracts / checkout / bills 的主链 API cutover，把页面主消费路径切到统一 Hono 宿主，并把旧 Next 入口降级为 compat/rollback-only |
| `phase14-06-query-and-bridge-api-cutover-wave-2` | 待开始（真实迁移波次二） | 需真实推进 dashboard / settings / renters / meter-readings / utility 及残余 bridge/compat 路径的 query host 与 shared helper cutover |
| `phase14-07-legacy-next-api-drain-completion-and-exit-baseline` | 待开始（阶段收口） | 需在前两波真实迁移完成后，证明 `phase14` 已清空正式业务 retained-legacy API，并统一旧 Next API 的 compat 保留、退出判定、inventory 与回滚基线 |

## 二点七五、纠偏后的阶段分层
- `phase14-01 ~ phase14-04` 只构成冻结与实施输入层：
  - 已把 route inventory、query host、删除门禁、页面影响面与 D1/D2 顺序冻结成单一解释
  - `phase14-04` 虽已补到 contracts / checkout 的 D3 冻结输入，但仍不等于 contracts / checkout 已完成真实迁移
  - 不等于 retained-legacy API/query 已完成真实迁移
- `phase14-05 ~ phase14-07` 才构成真实实现与阶段收口层：
  - 必须吸收 `phase14-01 ~ phase14-04` 中尚未完成的全部 API 迁移债务
  - 必须以代码切流、inventory 重分类、compat 降级和页面级调用收口作为交付，而不是继续追加纯冻结型子任务
- `phase14` 阶段完成条件固定为：
  - 冻结与实施输入层已完成
  - `phase14-05 ~ phase14-07` 已完成全部业务主链 API 迁移与收口
  - 两者都通过独立审核验收

## 三、任务拆分建议
## phase14-01-route-inventory-reclassification-and-host-matrix
### 目标
把当前旧 `src/app/api/*`、Hono `server/routes/*`、shared compat helper 与共享领域服务之间的 host classification 冻结成单一 route inventory 矩阵。

### 范围
- `server/lib/legacy-route-inventory.ts`
- `server/routes/*.ts`
- `src/app/api/**/route.ts`
- `phase13` 页面-API/query 交接矩阵
- route inventory 的分类、优先级与排序输入

### 当前事实基线
- 当前 inventory 已有 `formal-host-owned`、`compat-wrapper`、`retained-legacy` 三类分类。
- 当前 inventory 还显式记录了：
  - `formalHosts`
  - `bridgeHosts`
  - `domainServicePaths`
  - `keepReason`
  - `exitCondition`
  - `rollbackCondition`
- 当前尚未冻结的是：
  - 分域 drain 优先级
  - 页面影响面绑定
  - “已有 Hono 路由但仍不算正式宿主”的统一判定规则

### 参考来源
- `server/lib/legacy-route-inventory.ts`
- `server/routes/domain.ts`
- `server/routes/*.ts`
- `docs/phase13_frontend_page_parity_implementation_architecture_plan.md`
- `docs/phase13_frontend_page_parity_implementation_shared_baseline.md`

### 不在范围内
- 不实现任何 API 切流
- 不删除旧 `src/app/api/*`
- 不重写 query helper

### DoD
- route inventory 分类具备单一解释
- 每个业务域都有“当前分类 + 当前正式宿主 + bridge 边界 + 页面影响面”矩阵
- 后续子任务可直接引用该矩阵，不再重复分类

### 当前轮已冻结输出
- 统一字段集固定为：
  - `inventoryScope`
  - `dominantCategory`
  - `formalHosts`
  - `bridgeHosts`
  - `domainServicePaths`
  - `pageImpact`
  - `drainPriority`
  - `freezeConclusion`
- 统一判定规则固定为：
  - “已有 Hono 路由”不等于“正式宿主已冻结”
  - inventory 主分类仍为 `retained-legacy` 或 `formalHosts` 为空时，当前 Hono 只能解释为 bridge / compat
  - 同域关键读路径若仍依赖 `src/lib/page-closure-compat/*` 或 legacy query helper，不得把整域提前标记为 `formal-host-owned`
- 当前矩阵已冻结的分域顺序固定为：
  - D1：dashboard、settings
  - D2：rooms、buildings、meters
  - D3：contracts、checkout
  - D4：bills
  - D5：renters、meter-readings、utility
  - 延后：governance
- 当前矩阵已固定的页面影响面包括：
  - `/`
  - `/settings`
  - `/rooms*`、`/add/room`
  - `/contracts*`、`/add/contract`
  - `/bills*`、`/bills/stats`
  - `/renters*`
  - `/meter-readings/*`

### 验证要求
- 确认矩阵覆盖 dashboard、settings、rooms、buildings、meters、contracts、checkout、bills、renters、meter-readings、utility
- 确认分类结论与现有 `server/routes/*`、`src/app/api/*` 路径真实存在状态一致
- 确认分类未把治理接口误包装成正式业务 API 已完成项

## phase14-02-dashboard-and-settings-query-host-closure
### 目标
冻结 dashboard / settings 的 query host、bridge 角色、治理边界与后续 drain 顺序，使首页与设置页不再继续依赖模糊解释。

### 范围
- `/api/dashboard/*`
- `/api/settings*`
- `server/routes/dashboard.ts`
- `src/lib/page-closure-compat/dashboard.ts`
- `src/lib/dashboard-queries.ts`
- `src/lib/global-settings.ts`

### 当前事实基线
- 首页 `/` 已完成页面 parity，但 dashboard 相关 API 仍主要处于 retained-legacy / bridge 口径。
- `server/routes/dashboard.ts` 已提供最小 Hono bridge，避免首页落入 501 兜底。
- `settings` 页面已迁移，但 settings API 当前仍主要位于治理/初始化口径。

### 参考来源
- `server/routes/dashboard.ts`
- `src/app/api/dashboard/**/route.ts`
- `src/app/api/settings/**/route.ts`
- `docs/phase13_frontend_page_parity_implementation_architecture_plan.md`

### 不在范围内
- 不实现 dashboard 新 query model
- 不重做 settings 权限与审计体系
- 不进入治理页面迁移

### DoD
- dashboard 的正式 query host 与 retained-legacy bridge 关系具备单一解释
- settings 的 API 身份具备单一解释
- 首页/设置页与治理接口的边界具备单一解释

### 当前轮已冻结输出
- D1 固定顺序为：
  - 先冻结 dashboard query host 与 page-closure bridge 解释
  - 再冻结 settings API 身份与治理边界
  - 最后统一首页 `/`、设置页 `/settings` 与 governance 辅助接口的页面影响解释
- dashboard 当前冻结结论：
  - 当前正式 query host 仍是旧 `src/app/api/dashboard/**/route.ts` 与 `src/lib/dashboard-queries.ts` / `src/lib/page-closure-compat/dashboard.ts` 组合，不得误判为已完成正式 Hono 查询切流
  - `server/routes/dashboard.ts` 当前只属于 page-closure bridge；它用于承接首页首屏所需的 `/stats`、`/contract-alerts`、`/upcoming-contracts`、`/leaving-tenants`、`/vacant-rooms`
  - `/api/dashboard/overdue-payments` 与 `/api/dashboard/unpaid-rent` 继续保留为 retained-legacy 查询入口
  - 当前页面影响面固定为首页 `/`
- settings 当前冻结结论：
  - `/api/settings` 与 `/api/settings/init` 继续按治理型 retained-legacy 解释，主语义锚点仍是 `src/lib/global-settings.ts`
  - `server/routes/settings.ts` 当前只属于最小治理兼容宿主，用于承接设置页首屏读写、重置与初始化动作，不等于正式业务 API 已切流
  - 当前页面影响面固定为 `/settings`
  - `/api/validation`、`/api/data-consistency`、健康辅助与 repair/status-check 等入口继续按 governance 延后范围解释
- 本子任务输出已固定为 `phase14-03-rooms-buildings-meters-api-drain` 的 D1 上游输入，不再重复改写 dashboard/settings 解释

### 验证要求
- 确认 dashboard 相关路径逐条可回溯到当前 Hono 或旧 Next 路由
- 确认 settings 未因页面已迁移被误判为正式业务 API 已切流
- 确认本子任务不越界到页面重构、治理实现或 PWA 范围

## phase14-03-rooms-buildings-meters-api-drain
### 目标
收口房源、楼栋与仪表 API 的正式读写宿主、引用数据边界、删除门禁与 drain 顺序。

### 范围
- `/api/rooms*`
- `/api/buildings*`
- `/api/meters*`
- `server/routes/rooms.ts`
- `server/routes/buildings.ts`
- `server/routes/meters.ts`

### 当前事实基线
- `buildings` 已更接近 `formal-host-owned`
- `meters` 当前多为 `compat-wrapper`
- `rooms` 当前 retained-legacy 与 compat 混杂最明显
- `phase13` 页面已明确房源页面对楼栋、仪表与房态 API 的依赖

### 参考来源
- `src/app/api/rooms/**/route.ts`
- `src/app/api/buildings/**/route.ts`
- `src/app/api/meters/**/route.ts`
- `server/routes/rooms.ts`
- `server/routes/buildings.ts`
- `server/routes/meters.ts`
- `src/lib/domain/delete-guards/index.ts`

### 不在范围内
- 不重写房源查询模型
- 不改变仪表作为独立资产的业务约束
- 不删除任何旧路由

### DoD
- rooms / buildings / meters 的分类、正式宿主与退出顺序单一可解释
- 删除门禁、房态修改、房间仪表读写不会被误归类
- 后续 `/spec` 能以业务域方式逐步 drain，而不再按目录零散处理

### 当前轮已冻结输出
- D2 固定顺序已冻结为：
  - 先冻结 rooms 主链读写、局部 compat 与删除门禁解释
  - 再冻结 buildings 作为引用数据的 formal-host-owned 身份与删除条件
  - 再冻结 meters 作为独立资产的 compat-wrapper 身份与房间挂表 retained-legacy 边界
  - 最后统一 `/rooms*`、`/add/room`、`/add/contract`、`/meter-readings/*` 的页面影响与退出顺序
- rooms 当前冻结结论：
  - `/api/rooms` 的 `GET`、`POST`、`PATCH` 与 `/api/rooms/:id` 的 `GET`、`PUT`、`/api/rooms/:id/status`、`/api/rooms/:id/meters` 继续按 retained-legacy 解释
  - `/api/rooms/batch` 已由 `server/routes/rooms.ts` 承接为 formal host；`DELETE /api/rooms/:id` 已由 `server/routes/rooms.ts` + `src/lib/domain/delete-guards/index.ts` 承接，旧入口仅保留 compat wrapper
  - 房间删除与换楼栋继续受 `performRoomDeleteSafetyCheck()`、`deleteRoomWithoutRelatedHistory()` 与 `performRoomBuildingReassignmentSafetyCheck()` 约束；`OCCUPIED` / `OVERDUE`、未结束合同、未结账单、已绑定仪表、抄表历史与账单明细都属于阻断条件
- buildings 当前冻结结论：
  - `/api/buildings` 与 `/api/buildings/:id` 已按 formal-host-owned 解释；`server/routes/buildings.ts` 是单一正式宿主
  - 楼栋仍只按房源引用数据解释；删除条件固定为“仅空楼栋可删”，存在任意房间时必须阻断删除
- meters 当前冻结结论：
  - `/api/meters/:meterId` 与 `/api/meters/:meterId/status` 继续按 compat-wrapper 解释；`server/routes/meters.ts` 已承接详情、更新、启停与删除门禁
  - `/api/rooms/:id/meters` 继续属于 rooms retained-legacy 边界；不能把独立资产宿主与房间挂表链路混写
  - 仪表有历史抄表/账单/账单明细时只允许停用保留，无历史时才允许硬删除；当前数据模型仍不提供结构化解绑
- D2 页面影响已固定为：
  - `/rooms*`、`/add/room`
  - `/add/contract`
  - `/meter-readings/*`
- D2 退出顺序已固定为：
  - 先把 `/api/buildings*` 视为可进入 exit-evaluation 的 formal-host-owned 旧入口
  - 再评估 `/api/meters/:meterId*` compat wrapper 的退出
  - 最后再评估 rooms 主链 `/api/rooms*` 与 `/api/rooms/:id/meters` retained-legacy 的 drain
- 本子任务输出已固定为 `phase14-04-contracts-and-checkout-api-drain` 的 D2 上游输入，不再重复改写 rooms/buildings/meters 解释

### 验证要求
- 确认历史数据保留与删除门禁约束未被放松
- 确认楼栋引用数据与房源主链读写边界被明确区分
- 确认仪表相关 compat wrapper 的存在原因与退出条件明确

## phase14-04-contracts-and-checkout-api-drain
### 目标
收口合同列表、详情、编辑、续租、退租、补账单与 checkout API 的正式宿主和 compat 保留边界。

### 范围
- `/api/contracts*`
- checkout 相关 Hono 子路由
- `server/routes/contracts.ts`
- `server/routes/checkout.ts`

### 当前事实基线
- 合同主链既有 retained-legacy 读路径，也有已冻结到 Hono 的 compat 写路径。
- 续租、退租、补账单与删除门禁已在共享领域服务与 Hono 中具备承接位。
- `phase13` 页面已使合同详情、编辑、续租、退租成为 `phase14` 的直接页面输入。

### 参考来源
- `src/app/api/contracts/**/route.ts`
- `server/routes/contracts.ts`
- `server/routes/checkout.ts`
- `src/lib/domain/contracts/index.ts`
- `src/lib/domain/delete-guards/index.ts`

### 不在范围内
- 不改变合同主链业务语义
- 不重写续租/退租业务规则
- 不进入页面表单改造

### DoD
- 合同读路径、写路径、compat 包装与 checkout 宿主归属单一可解释
- 后续 `/spec` 可以独立处理合同主链 drain，而不重复争论续租/退租/删除归属

### 当前轮已冻结输出
- D3 固定顺序已冻结为：
  - 先冻结 contracts 域 retained-legacy drain、统一 Hono 请求宿主与 compat-wrapper 写路径的单一解释
  - 再冻结 checkout 子域正式写入口、旧 Next compat-wrapper 与共享领域服务边界
  - 再冻结 `server/routes/domain.ts` 中 `'/contracts/:contractId/checkout'` 先于 `'/contracts'` 的挂接优先级解释
  - 最后统一 `/contracts*`、`/contracts/:id`、续租、退租、补账单与 `/add/contract` 的页面影响，并复用 `phase13` 与 `phase09-05` 输入
- contracts 当前冻结结论：
  - `GET/POST /api/contracts` 与 `GET/PUT /api/contracts/:id` 继续按 retained-legacy drain 解释；统一 `/api` runtime 的当前对外请求宿主已是 `server/routes/contracts.ts`，但合同列表、新签创建、详情与编辑仍复用 legacy 查询/写路径，旧 `src/app/api/contracts*` 保留为镜像实现与回滚基线
  - `POST /api/contracts/activate`、`POST /api/contracts/:id/renew`、`POST /api/contracts/:id/generate-bills` 与 `DELETE /api/contracts/:id` 已由 `server/routes/contracts.ts` 承接为 compat-wrapper；共享领域服务与删除门禁继续锚定 `src/lib/domain/contracts/index.ts` 与 `src/lib/domain/delete-guards/index.ts`
  - 合同继续作为租务事实主锚点；账单、抄表、BillDetail 历史保留与删除门禁约束未被放宽
- checkout 当前冻结结论：
  - `POST /api/contracts/:contractId/checkout` 已由 `server/routes/checkout.ts` + `src/lib/domain/contracts/index.ts` 冻结为正式事务编排位
  - 旧 `src/app/api/contracts/[id]/checkout/route.ts` 继续仅保留 compat-wrapper、会话透传与回滚基线职责
  - `server/routes/domain.ts` 中 checkout 子路径必须继续先于 `/contracts` 骨架挂接，避免被更宽泛的 contracts 路由提前吞掉
- D3 页面影响已固定为：
  - `/contracts`
  - `/contracts/:id`
  - `/contracts/:id/edit`
  - `/contracts/:id/renew`
  - `/contracts/:id/checkout`
  - `/add/contract`
- 本子任务输出已固定为后续 contracts / checkout 真实 drain 的文档上游输入；本轮不进入 API 切流实现、不删除旧路由、不重写页面表单或合同业务规则

### 验证要求
- 确认合同锚点与历史数据保留约束未被破坏
- 确认 checkout 子路径与 contracts 路由的挂载优先级解释清楚
- 确认本子任务不把 query parity 与页面 parity 混写

## phase14-05-core-business-api-cutover-wave-1
### 目标
以“真实迁移波次一”的方式完成房源、合同、退租结算与账单主链 API cutover，把当前仍承担正式职责的核心 retained-legacy 路径迁入统一 Hono 宿主，并把旧 Next 入口降级为 compat/rollback-only。

### 范围
- `/api/rooms*` 中仍承担正式职责的 retained-legacy 主路径
- `/api/contracts*`
- `/api/contracts/:id/checkout`
- `/api/bills*`
- `/api/bills/stats`
- `server/routes/rooms.ts`
- `server/routes/contracts.ts`
- `server/routes/checkout.ts`
- `server/routes/bills.ts`
- `src/app/api/rooms/**/route.ts`
- `src/app/api/contracts/**/route.ts`
- `src/app/api/bills/**/route.ts`
- `server/lib/legacy-route-inventory.ts`
- `src/lib/bill-stats.ts`
- `src/lib/bill-cache.ts`
- `src/lib/domain/contracts/index.ts`
- `src/lib/domain/delete-guards/index.ts`

### 当前事实基线
- `phase14-03` 与 `phase14-04` 已冻结 rooms、contracts、checkout 的单一解释，但这些域的大量页面主消费路径仍未完成真实 cutover。
- `buildings` 已接近 formal-host-owned、`meters` 已有 compat 承接位，但房源主链 `/api/rooms*` 仍持续牵制签约、退租与账单生成主链。
- `server/routes/contracts.ts`、`server/routes/checkout.ts`、`server/routes/bills.ts` 已具备较完整承接位，但旧 Next 入口、legacy 查询写路径与页面调用方向尚未统一切到 Hono。
- `/bills/stats` 页面已迁移，但统计读取、账单详情、明细与 utility details 仍存在 retained-legacy / bridge 混用。

### 参考来源
- `src/app/api/rooms/**/route.ts`
- `server/routes/rooms.ts`
- `src/app/api/contracts/**/route.ts`
- `server/routes/contracts.ts`
- `server/routes/checkout.ts`
- `src/app/api/bills/**/route.ts`
- `server/routes/bills.ts`
- `src/minix/lib/primary-route-data.ts`
- `src/lib/bill-stats.ts`
- `src/lib/bill-cache.ts`
- `src/lib/domain/contracts/index.ts`
- `src/lib/domain/delete-guards/index.ts`
- `server/lib/legacy-route-inventory.ts`

### 不在范围内
- 不重写账单统计读模型
- 不改变账务金额语义
- 不重做 rooms / contracts / bills 页面 UI 或表单结构
- 不进入 governance、PWA parity 或 `phase16` cutover

### DoD
- rooms / contracts / checkout / bills 的页面主消费路径已真实切到统一 Hono 宿主，不再由旧 Next API 承担正式主链职责
- `server/lib/legacy-route-inventory.ts` 已同步反映新的 formal-host-owned / compat-wrapper / retained-legacy 分类，且不再把上述主链路径记为“仍由旧 Next 承担正式职责”
- 旧 `src/app/api/rooms*`、`src/app/api/contracts*`、`src/app/api/bills*` 中对应路径已降级为 compat-wrapper、rollback-only 或明确退出候选，而不是继续保留双主宿主状态
- `/add/contract`、`/contracts*`、`/bills*`、`/bills/stats` 所依赖的 API 调用方向单一可解释，且与页面 parity 输入保持一致

### 验证要求
- 确认房间删除门禁、合同锚点、退租结算与账单金额/状态/明细语义未被弱化
- 确认 `/api/contracts/:contractId/checkout` 与 `/api/contracts/*` 的挂载优先级仍正确，且页面与脚本调用方向都已统一
- 确认 `/api/bills/stats`、`/api/bills/:id` 与账单明细读取不再停留在 page-to-legacy bridge
- 至少补一组覆盖 rooms -> contract -> checkout -> bill 的主链 smoke / 人工验证路径

## phase14-06-query-and-bridge-api-cutover-wave-2
### 目标
以“真实迁移波次二”的方式完成 dashboard、settings、renters、meter-readings、utility 与残余 bridge/compat 路径的 API/query cutover，清理 `phase14` 中剩余的页面级 legacy query 入口与 shared compat helper 主真相职责。

### 范围
- `/api/dashboard/*`
- `/api/settings*`
- `/api/renters*`
- `/api/meter-readings*`
- `/api/utility-readings`
- `server/routes/dashboard.ts`
- `server/routes/settings.ts`
- `server/routes/renters.ts`
- `server/routes/meter-readings.ts`
- `src/app/api/dashboard/**/route.ts`
- `src/app/api/settings/**/route.ts`
- `src/lib/page-closure-compat/renters.ts`
- `src/lib/page-closure-compat/meter-readings.ts`
- `src/lib/page-closure-compat/dashboard.ts`
- `src/lib/dashboard-queries.ts`
- `src/lib/global-settings.ts`
- `server/lib/legacy-route-inventory.ts`

### 当前事实基线
- dashboard / settings 的 D1 说明已冻结，但首页与设置页仍存在 retained-legacy query host / 治理型 retained-legacy 的运行时事实。
- renters 与 meter-readings 当前仍是 bridge 痕迹最重的两个业务域，旧 Next 入口与 Hono runtime 共同复用 shared compat helper。
- utility 仍是抄表域的历史兼容尾项；若不在 `phase14` 内一并收口，后续阶段没有专门 API 迁移承接位。
- `phase14-05` 完成后，剩余 API 迁移重点将集中在 query host、bridge helper 与残余 compat 主路径清理。

### 参考来源
- `src/app/api/dashboard/**/route.ts`
- `src/app/api/settings/**/route.ts`
- `src/app/api/renters/**/route.ts`
- `src/app/api/meter-readings/**/route.ts`
- `src/app/api/utility-readings/route.ts`
- `server/routes/dashboard.ts`
- `server/routes/settings.ts`
- `server/routes/renters.ts`
- `server/routes/meter-readings.ts`
- `src/lib/page-closure-compat/*`
- `src/lib/dashboard-queries.ts`
- `src/lib/global-settings.ts`
- `server/lib/legacy-route-inventory.ts`

### 不在范围内
- 不重做首页、设置页、租客页或抄表页 UI
- 不重写 utility 历史业务语义
- 不提前做 `phase16` cutover 或删空全部 legacy 资产

### DoD
- dashboard / settings / renters / meter-readings / utility 的页面主消费路径已不再依赖 retained-legacy query host 或 shared compat helper 作为主真相
- `server/routes/dashboard.ts`、`server/routes/settings.ts`、`server/routes/renters.ts`、`server/routes/meter-readings.ts` 已成为单一正式宿主或明确的最终 compat 宿主，旧 Next 入口不再承担正式业务职责
- `src/lib/page-closure-compat/*` 在上述域中只保留明确的过渡或回滚职责，不再承担页面默认主查询来源
- `server/lib/legacy-route-inventory.ts` 已更新到“除治理型延后范围外，`phase14` 内所有正式业务 API 都已完成迁移或降级为 compat/rollback-only”

### 验证要求
- 确认首页、设置页、租客页、抄表页的 API/query 调用方向与页面表现一致
- 确认历史抄表、关联账单追溯、utility 兼容尾项与治理型设置语义未被破坏
- 确认 dashboard、meter-readings、utility 不再保留“页面已迁移但正式 API 仍在旧 Next”的主路径事实
- 至少补一组覆盖首页/设置/租客/抄表的 smoke / 人工验证路径

## phase14-07-legacy-next-api-drain-completion-and-exit-baseline
### 目标
在前两波真实迁移完成后，统一证明 `phase14` 已完成正式业务 API 层迁移：清空 retained-legacy 主职责、收口 compat 保留条件、更新 route inventory 与顶层真相源，并冻结 legacy Next API 的回滚基线与删除前提。

### 范围
- `src/app/api/**/route.ts`
- `server/lib/legacy-route-inventory.ts`
- `docs/phase14_*`
- `plan.md`
- `AGENTS.md`
- `project_rules.md`
- `architecture_map.md`
- 必要时 `README.md`

### 当前事实基线
- `phase14-05 ~ phase14-06` 完成后，正式业务 API 应已完成真实迁移，但旧 `src/app/api/*` 文件仍会为了回滚、compat 或审计而局部保留。
- `phase14` 的阶段完成标准不是“文件删空”，而是“旧 Next API 不再承担正式业务主职责”。
- legacy 资产在 `phase16` 审核通过前仍必须保留回滚职责，但这种保留必须是显式 compat/rollback-only，而不是隐式继续承载正式流量。

### 参考来源
- `server/lib/legacy-route-inventory.ts`
- `docs/phase14_*`
- `docs/phase13_*`
- `DEPLOYMENT.md`
- `docs/phase11_*`

### 不在范围内
- 不直接删除 legacy 资产
- 不提前执行 cutover
- 不替代 `phase16` 的最终退出审核

### DoD
- `server/lib/legacy-route-inventory.ts` 中除 governance / 明确保留 compat / rollback-only 之外，不再存在承担正式业务主职责的 retained-legacy API
- `docs/phase14_*`、`plan.md` 与顶层真相源已明确写清 `phase14` 阶段内 API 迁移已完成，而不是只完成冻结
- 每个仍保留的旧 Next API 都具备单一可解释的保留原因、退出条件与回滚条件
- `phase15` 与 `phase16` 只继承 API 迁移结果、PWA parity/cutover 输入，不再承担任何正式业务 API 迁移职责

### 验证要求
- 确认 `phase14` 范围内所有正式业务 API 都已在本阶段完成迁移或降级，不把任何业务主链迁移债务留给 `phase15` 或 `phase16`
- 确认任何 route exit 判断都保留回滚条件
- 确认顶层真相源与 `docs/phase14_*` 状态一致
- 确认未把 `phase16` 的 cutover/legacy-exit 职责提前写成当前子任务完成条件
- 至少完成一轮覆盖 dashboard / rooms / contracts / checkout / bills / renters / meter-readings 的 route inventory 审计与主链 smoke

## 四、推荐实施顺序
建议严格按如下顺序推进：

```text
phase14-01-route-inventory-reclassification-and-host-matrix
phase14-02-dashboard-and-settings-query-host-closure
phase14-03-rooms-buildings-meters-api-drain
phase14-04-contracts-and-checkout-api-drain
phase14-05-core-business-api-cutover-wave-1
phase14-06-query-and-bridge-api-cutover-wave-2
phase14-07-legacy-next-api-drain-completion-and-exit-baseline
```

## 四点五、子任务实施验收门禁
- `phase14-*` 任一已批准 `/spec` 子任务在实现完成后，必须额外指定独立子代理执行审核验收。
- 子代理审核必须优先关注：
  - 是否越界到 `phase15 ~ phase16`
  - route inventory 分类是否仍与根级真相源一致
  - 是否破坏 `phase10` 已冻结的查询分层与事务边界
  - 是否放宽历史数据保留、删除门禁或兼容回滚边界
  - 页面 parity 与 API parity 的交接关系是否仍单一可解释
- 只有在子代理明确给出“审核通过 / 验收通过”结论后，才允许把对应子任务标记为正式完成。
- 未通过子代理审核的子任务，必须继续修正并重复“实现 -> 子代理审核 -> 复验”循环，不得提前提交或推送远程仓库。

## 五、阶段结论
`phase14` 的顺序价值在于：

```text
先把 inventory 分类、query host 和 bridge 边界冻结清楚，
再用两个真实迁移波次把所有正式业务 API 切到统一 Hono 宿主，
最后统一收口旧 Next API 的迁移完成判定、compat 保留条件与 legacy baseline。
```

这能避免：
- route inventory 重新退回逐文件摸索
- 页面 parity 与 API parity 的输入脱节
- 先删旧路由、后补解释
- 治理接口、PWA 与 cutover 职责提前闯入 `phase14`
- `phase14-01 ~ phase14-03` 被误判为整个 `phase14` 已完成
