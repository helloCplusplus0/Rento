# Phase09 Domain Service Migration 开发规划

## 当前完成状态
- `phase09-01-domain-shared-semantics-and-service-host`
- `phase09-02-contract-lifecycle-and-delete-guards`
- `phase09-03-billing-and-payment-cycle-services`
- `phase09-04-meter-reading-and-utility-billing-chain`
- `phase09-05-checkout-renewal-and-main-flow-consistency`
- `phase09-06-legacy-route-compat-and-exit-checklist`
- 以上子任务均已完成当前轮实现、校验、提交顺序推进与阶段收口；本文档现作为 `phase09` 的任务拆分记录与完结依据。

## 一、文档定位
本文档用于把 `phase09-domain-service-migration` 拆分为顺序执行的子任务，确保当前仓库先完成共享领域服务落点、正式宿主边界、主链读写与删除门禁迁移，再进入 `phase10` 的数据访问层收口。

## 二、总体推进结论
`phase09` 的执行顺序固定为：

```text
先冻结共享领域服务落点与宿主关系
    ->
再迁合同生命周期与删除门禁
    ->
再迁账单语义与支付周期
    ->
再迁仪表/抄表与自动出账链
    ->
最后收口退租结算、续租与主链一致性，并写清旧兼容宿主边界
```

原因如下：

- 若不先冻结共享领域服务落点，后续主链语义仍会继续漂移在旧 `src/app/api/*`、新 `server/` 与 `src/lib/*` 之间
- 若不先迁合同生命周期与删除门禁，后续账单、抄表与退租链无法建立稳定的主锚点
- 若不先收口账单金额/状态语义与支付周期，后续抄表出账与退租结算仍会重复旧漂移问题
- 若不最后写清 compat wrapper 与退出条件，后续阶段会再次出现“新旧宿主同时继续承载新增业务真相”的返工

## 三、任务拆分建议
## phase09-01-domain-shared-semantics-and-service-host
### 目标
冻结共享领域服务落点、服务命名、事务边界候选、旧/新宿主调用关系，使后续主链 API 和 compat wrapper 能围绕单一领域真相推进。

### 范围
- 冻结 `src/lib/domain/` 或等价共享目录的正式承接位
- 冻结 `server/routes/*` 的正式领域路由承接位
- 明确旧 `src/app/api/*` 与共享领域服务的兼容调用关系
- 明确 `server/app.ts` 中新增正式领域路由的挂接方式

### 参考来源
- `server/app.ts`
- `src/lib/queries.ts`
- `src/lib/prisma.ts`
- `docs/phase08_api_and_auth_foundation_architecture_plan.md`
- `docs/phase09_domain_service_migration_architecture_plan.md`

### 不在范围内
- 不迁移具体合同/账单/抄表业务逻辑
- 不迁移治理/辅助接口
- 不切换 ORM 或部署主线

### DoD
- 共享领域服务目录与正式领域路由目录已冻结
- 旧 `src/app/api/*` 与新 `server/` 的调用关系已可解释
- compat wrapper 与正式宿主的职责边界已可验证

## phase09-02-contract-lifecycle-and-delete-guards
### 目标
迁移合同生命周期、合同删除门禁与房间删除门禁，使合同锚点与删除语义先在新主线中稳定下来。

### 范围
- 迁移合同激活与合同状态流转相关服务
- 迁移合同删除门禁
- 迁移房间删除门禁
- 明确合同/房间删除与终止/归档流程的关系

### 参考来源
- `src/lib/contract-activation.ts`
- `src/lib/validation.ts`
- `src/app/api/contracts/[id]/route.ts`
- `src/app/api/rooms/[id]/route.ts`
- `prisma/schema.prisma`

### 不在范围内
- 不迁移退租结算完整编排
- 不迁移账单生成或抄表自动出账
- 不迁移完整页面逻辑

### DoD
- 合同锚点相关服务已可由新主线承接
- 合同/房间删除门禁已在共享服务层与正式宿主中可解释
- 历史保留原则未被破坏

## phase09-03-billing-and-payment-cycle-services
### 目标
迁移账单金额/状态语义、支付周期与账单删除门禁，使账务主链的开放态/结清态与自动出账规则在新主线中统一。

### 范围
- 迁移 `Bill.amount / receivedAmount / pendingAmount / BillStatus` 的统一语义
- 迁移支付周期账单生成规则
- 迁移账单删除门禁
- 明确账单生成来源、展示语义与 compat 边界

### 参考来源
- `src/lib/bill-semantics.ts`
- `src/lib/auto-bill-generator.ts`
- `src/app/api/bills/[id]/route.ts`
- `docs/fix/fix_001_analysis_contract-billing-cycle.md`
- `docs/fix/fix_002_analysis_contract-bill-consistency-and-state-statistics.md`

### 不在范围内
- 不迁移抄表自动出账细节
- 不迁移退租结算编排
- 不切换数据访问主线

### DoD
- 账单金额/状态语义已在共享服务层统一
- 支付周期与自动出账基础规则已可由新主线消费
- 账单删除门禁与历史保留语义已稳定

## phase09-04-meter-reading-and-utility-billing-chain
### 目标
迁移仪表/抄表、周期判重、自动出账、相关账单追溯与最终抄表语义，使多仪表历史链在新主线中可追溯。

### 范围
- 迁移抄表创建与周期判重
- 迁移抄表自动生成账单逻辑
- 迁移相关账单追溯能力
- 迁移 `CHECKOUT_FINAL` 最终抄表语义

### 参考来源
- `src/app/api/meter-readings/route.ts`
- `src/app/api/meter-readings/[id]/route.ts`
- `src/app/api/meter-readings/[id]/related-bills/route.ts`
- `src/app/api/utility-readings/route.ts`
- `prisma/schema.prisma`
- `docs/fix/fix_003_analysis_meter-reading-replacement.md`

### 不在范围内
- 不迁移治理/辅助统计接口
- 不新增完整观测能力
- 不迁移完整页面展示层

### DoD
- 多仪表抄表链已可由新主线承接
- 自动出账、相关账单追溯与最终抄表语义已可解释
- 仪表历史保留与抄表禁删原则未被破坏

## phase09-05-checkout-renewal-and-main-flow-consistency
### 目标
迁移退租结算、续租/补账单关联编排，收口主链查询与写路径一致性。

### 范围
- 迁移退租结算计算器与事务编排
- 迁移续租/补账单关联主链
- 收口主链查询与写路径的一致性
- 补齐至少四条主链 smoke 验证路径

### 参考来源
- `src/lib/checkout-settlement.ts`
- `src/app/api/contracts/[id]/checkout/route.ts`
- `src/app/api/contracts/[id]/generate-bills/route.ts`
- 相关续租入口
- `docs/delete_contract_chart.md`
- `docs/renew_lease_chart.md`
- `docs/moving_out_rental_chart.md`

### 不在范围内
- 不切 ORM 或迁移链主线
- 不切最终部署主线
- 不迁移完整前端页面壳

### DoD
- 新签合同、续租、退租结算、多仪表抄表出账四条主链在新主线中可解释、可验证
- 页面预期、服务端生成结果与数据库事实口径一致
- 旧兼容宿主与正式宿主的保留边界已写成清单

## phase09-06-legacy-route-compat-and-exit-checklist
### 目标
写清旧 `src/app/api/*` 在 `phase09` 结束时的 compat wrapper、未迁移接口去向与退出条件，为 `phase10` 做上游输入收口。

### 范围
- 明确哪些旧接口已迁移为新主线正式承接
- 明确哪些旧接口仍保留为 compat wrapper
- 明确哪些旧接口继续保留为未迁移存量接口
- 明确旧兼容宿主退出条件与回滚条件

### 参考来源
- `src/app/api/*`
- `server/routes/*`
- `docs/phase09_domain_service_migration_shared_baseline.md`
- `docs/phase09_domain_service_migration_architecture_plan.md`

### 不在范围内
- 不执行旧接口实际删除
- 不迁移治理/辅助接口
- 不切部署主线

### DoD
- 旧兼容宿主清单已形成
- 退出条件、回滚条件与未迁移接口去向已可解释
- `phase10` 的上游输入已清晰

## 四、推荐实施顺序
建议严格按如下顺序推进：

```text
phase09-01-domain-shared-semantics-and-service-host
phase09-02-contract-lifecycle-and-delete-guards
phase09-03-billing-and-payment-cycle-services
phase09-04-meter-reading-and-utility-billing-chain
phase09-05-checkout-renewal-and-main-flow-consistency
phase09-06-legacy-route-compat-and-exit-checklist
```

## 五、默认路线约束
`phase09` 的全部子任务都必须遵守：

- 默认优先冻结共享领域服务与正式宿主边界，而不是抢跑完整页面迁移
- 默认继续把 `server/` 视为正式领域 API 宿主唯一正式落点
- 默认继续把 `src/lib/*` 中的既有主链语义实现视为直接参考基线
- 默认继续把 `src/minix` 的前端职责限制在最小应用壳与门禁，不扩张为完整领域页面迁移
- 默认继续保持 `Prisma + PostgreSQL` 为数据主线，不在本阶段切 ORM
- 默认不迁治理/辅助接口，不切部署主线，不重做 UI 风格
- 默认由用户审核 `phase09` 阶段文档后，再逐个进入 `/spec`

## 六、结语
`phase09` 的价值不在于“已经完成最终数据访问层或部署切线收口”，而在于：

```text
先让共享领域服务、正式宿主边界与主链验证矩阵稳定下来，
再让后续 ORM 收口与部署主线建立在稳定的业务真相之上。
```
