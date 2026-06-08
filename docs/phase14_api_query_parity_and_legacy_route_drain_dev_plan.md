# Phase14 API Query Parity And Legacy Route Drain 开发规划

## 当前状态
- `phase14` 的开发规划用于把 retained-legacy API/query drain 拆成可逐个进入 `/spec` 的子任务顺序。
- 本文档不替代：
  - [phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_architecture_plan.md)
  - [phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase14_api_query_parity_and_legacy_route_drain_shared_baseline.md)
- `phase13` 已完成正式业务页面 `25/25` 迁移、浏览器验收基线与页面-API/query 交接；`phase14` 当前不再承接页面迁移，而是承接 API/query parity 与 route drain。
- 当前 `server/routes/*` 与 `server/lib/legacy-route-inventory.ts` 已具备较完整承接基础；本阶段重点是把这些已有事实冻结为单一顺序、单一分类与单一退出路径。
- 补充约束：`phase14` 任一子任务都必须继续以旧 `src/app/api/*` 为直接参考基线，以 inventory 分类、shared compat helper 与共享领域服务现状为真实输入，而不是脱离现有代码重新设计一套 API 版图。
- 补充判断：当前真正的阻断已经不是“有没有 Hono 路由”，而是“哪些 Hono 路由已算正式宿主、哪些只是 bridge、哪些旧 Next API 仍在承担正式职责”。

## 一、文档定位
本文档用于把 `phase14-api-query-parity-and-legacy-route-drain` 拆分为顺序执行的实施子任务，确保仓库先明确“先排哪批 API、如何解释 host classification、如何收口 bridge、如何定义旧入口退出前提”，再进入逐域 `/spec`。

## 二、总体推进结论
`phase14` 的固定顺序为：

```text
先统一 route inventory 分类与 host matrix
    ->
再处理 dashboard / settings 的 query host 闭环
    ->
再处理 rooms / buildings / meters
    ->
再处理 contracts / checkout
    ->
再处理 bills / bill-stats
    ->
再处理 renters / meter-readings / utility-readings
    ->
最后收口旧 Next API 的退出基线与 legacy 保留条件
```

原因如下：
- 若不先统一 route inventory 分类与 host matrix，后续所有 `/spec` 都会重新定义 formal-host-owned / compat-wrapper / retained-legacy。
- 若不先明确 dashboard / settings 的 query host，首页、设置页与治理接口的边界会继续混写。
- 若不先处理房源、楼栋、仪表这组引用数据与删除门禁混合域，合同、账单与抄表的 drain 顺序会失去稳定前提。
- 若不把 legacy exit baseline 放到最后统一收口，前面的 bridge / compat 解释会被“能不能删旧文件”提前绑架。

## 二点五、当前实施状态快照
| 子任务 | 当前状态 | 当前结论 |
| --- | --- | --- |
| `phase14-01-route-inventory-reclassification-and-host-matrix` | 已完成（文档冻结） | 已基于 inventory / Hono 路由 / `phase13` 交接表冻结统一分类规则、host matrix 字段集、页面影响面与 drain 优先级 |
| `phase14-02-dashboard-and-settings-query-host-closure` | 待开始 | 需明确 dashboard/settings 是正式 query host、治理保留，还是 bridge 过渡 |
| `phase14-03-rooms-buildings-meters-api-drain` | 待开始 | 需收口房源、楼栋、仪表 API 的读写宿主与删除门禁边界 |
| `phase14-04-contracts-and-checkout-api-drain` | 待开始 | 需收口合同列表/详情/编辑/续租/退租/补账单的读写宿主与 compat 边界 |
| `phase14-05-bills-and-bill-stats-api-drain` | 待开始 | 需收口账单列表/详情/明细/统计的 query host 与兼容包装退出前提 |
| `phase14-06-renters-and-meter-readings-api-drain` | 待开始 | 需收口 renter compat helper、meter-reading bridge 与 utility compat 的最终解释 |
| `phase14-07-legacy-next-api-exit-baseline-closure` | 待开始 | 需统一旧 Next API 可删除前提、compat 保留条件与 legacy 回滚基线 |

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

### 验证要求
- 确认合同锚点与历史数据保留约束未被破坏
- 确认 checkout 子路径与 contracts 路由的挂载优先级解释清楚
- 确认本子任务不把 query parity 与页面 parity 混写

## phase14-05-bills-and-bill-stats-api-drain
### 目标
收口账单列表、详情、明细、状态更新、删除与 `/bills/stats` 的正式 query host、compat 包装与 drain 顺序。

### 范围
- `/api/bills*`
- `/api/bills/stats`
- `server/routes/bills.ts`
- `src/lib/bill-stats.ts`
- `src/lib/bill-cache.ts`

### 当前事实基线
- `server/routes/bills.ts` 已有 `/stats` 静态路由与多条正式/半正式 Hono 路径。
- `/bills/stats` 页面已迁移，但统计读取仍通过 legacy API bridge。
- 账单明细与 utility details 仍明显带有 retained-legacy 查询拼装痕迹。

### 参考来源
- `src/app/api/bills/**/route.ts`
- `server/routes/bills.ts`
- `src/minix/lib/primary-route-data.ts`
- `src/lib/bill-stats.ts`
- `src/lib/bill-cache.ts`

### 不在范围内
- 不重写账单统计读模型
- 不改变账务金额语义
- 不提前做页面层行为改造

### DoD
- 账单列表/详情/明细/统计的正式 query host 单一可解释
- `/api/bills/stats` 的 bridge 身份、退出前提与页面影响面单一可解释
- 账单状态更新、删除等 compat wrapper 的退出前提单一可解释

### 验证要求
- 确认账单金额、状态与明细语义未被弱化
- 确认 `/stats` 与 `/:id` 路由优先级解释清楚
- 确认本子任务不越界为账单统计整套实现重写

## phase14-06-renters-and-meter-readings-api-drain
### 目标
收口 renters、meter-readings 与 utility compat 的 bridge、正式宿主与退出条件。

### 范围
- `/api/renters*`
- `/api/meter-readings*`
- `/api/utility-readings`
- `server/routes/renters.ts`
- `server/routes/meter-readings.ts`
- `src/lib/page-closure-compat/renters.ts`
- `src/lib/page-closure-compat/meter-readings.ts`

### 当前事实基线
- renters 与 meter-readings 当前是 bridge 痕迹最重的两个业务域。
- 旧 Next 入口与 Hono runtime bridge 共同复用 shared compat helper。
- 页面已经迁移完成，但 API/query parity 解释尚未冻结。

### 参考来源
- `src/app/api/renters/**/route.ts`
- `src/app/api/meter-readings/**/route.ts`
- `src/app/api/utility-readings/route.ts`
- `server/routes/renters.ts`
- `server/routes/meter-readings.ts`
- `src/lib/page-closure-compat/*`

### 不在范围内
- 不改写租客或抄表页面
- 不重写 utility 历史兼容逻辑
- 不提前做 legacy cutover

### DoD
- renters / meter-readings / utility 的正式宿主、compat helper 与 bridge 边界单一可解释
- 抄表历史保留、禁删门禁与 utility 兼容边界单一可解释

### 验证要求
- 确认历史抄表与相关账单追溯语义未被破坏
- 确认双入口 bridge 的存在原因与退出条件明确
- 确认 utility compat 不被误判为正式主链接口已完成切流

## phase14-07-legacy-next-api-exit-baseline-closure
### 目标
收口旧 `src/app/api/*` 的退出前提、compat 保留条件、route drain 完成判定与 legacy 回滚基线。

### 范围
- `src/app/api/**/route.ts`
- `server/lib/legacy-route-inventory.ts`
- `plan.md`
- `AGENTS.md`
- `project_rules.md`
- `architecture_map.md`
- 必要时 `README.md`

### 当前事实基线
- 当前仓库已完成页面 parity，但旧 API 仍广泛保留。
- 不同域的 formal-host-owned / compat-wrapper / retained-legacy 已经混合存在。
- legacy 资产在 `phase16` 审核通过前仍必须保留回滚职责。

### 参考来源
- `server/lib/legacy-route-inventory.ts`
- `docs/phase14_*`
- `DEPLOYMENT.md`
- `docs/phase11_*`

### 不在范围内
- 不直接删除 legacy 资产
- 不提前执行 cutover
- 不替代 `phase16` 的最终退出审核

### DoD
- 旧 Next API 可删除前提、compat 保留条件与 route drain 完成判定具备单一解释
- `phase14` 的输出可被 `phase15`、`phase16` 直接继承

### 验证要求
- 确认任何 route exit 判断都保留回滚条件
- 确认顶层真相源与 `docs/phase14_*` 状态一致
- 确认未把 `phase16` 的 cutover/legacy-exit 职责提前写成当前子任务完成条件

## 四、推荐实施顺序
建议严格按如下顺序推进：

```text
phase14-01-route-inventory-reclassification-and-host-matrix
phase14-02-dashboard-and-settings-query-host-closure
phase14-03-rooms-buildings-meters-api-drain
phase14-04-contracts-and-checkout-api-drain
phase14-05-bills-and-bill-stats-api-drain
phase14-06-renters-and-meter-readings-api-drain
phase14-07-legacy-next-api-exit-baseline-closure
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
再按业务域逐步清空 retained-legacy 正式业务 API，
最后统一收口旧 Next API 的退出前提与 legacy baseline。
```

这能避免：
- route inventory 重新退回逐文件摸索
- 页面 parity 与 API parity 的输入脱节
- 先删旧路由、后补解释
- 治理接口、PWA 与 cutover 职责提前闯入 `phase14`
