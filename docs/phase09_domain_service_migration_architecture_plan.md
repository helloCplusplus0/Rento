# Phase09 Domain Service Migration 架构规划

## 一、文档定位
本文档用于承接 `phase08-api-and-auth-foundation` 完成后的下一阶段工作流，回答以下问题：

- 为什么 `phase09` 先迁领域服务，而不是先改前端页面或部署主线
- 为什么正式领域 API 继续收口到 `server/`，而共享业务真相优先收口到共享服务层
- 为什么合同、账单、支付周期、仪表、抄表、退租结算与删除门禁必须作为同一条主链整体规划
- 为什么删除门禁与历史保留必须先于“清理旧接口”
- 为什么 `phase09` 仍不能顺手决定 ORM 主线或部署切线

本文档不替代：

- [plan.md](file:///home/dell/Projects/Rento/plan.md) 的阶段顺序与当前结论职责
- [AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md) 的入口摘要职责
- [phase09_domain_service_migration_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase09_domain_service_migration_dev_plan.md) 的子任务拆分职责
- [phase09_domain_service_migration_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase09_domain_service_migration_shared_baseline.md) 的共享边界职责

## 二、当前阶段前提
### 2.1 已完成上游
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- `phase06-minix-replatform` 已完成当前轮文档治理收口
- `phase07-app-shell-and-runtime-foundation` 已完成新应用壳、新运行时入口、旧运行线映射与退出条件冻结
- `phase08-api-and-auth-foundation` 已完成统一 API 宿主、最小认证闭环、请求治理、统一错误出口与最小页面守卫收口

### 2.2 真实现状
- 新前端壳已收口到 `src/minix/`，但仍只承接最小登录守卫与应用壳，不承担完整领域页面迁移。
- 新运行时已收口到 `server/`，并已冻结统一 `/api` 宿主、认证门禁、中间件链、错误处理与最小公开 API 白名单。
- 旧 `src/app/api/*` 仍承接正式业务 API、治理/辅助接口和兼容宿主职责，其中合同、账单、抄表、退租结算与删除门禁仍主要保留在旧宿主。
- 领域业务真相已经沉淀在旧 API 路由与 `src/lib/*`，但尚未收口为新主线共享服务层的单一真相源。

### 2.3 为什么现在进入 `phase09`
当前最合理的下一阶段是：

```text
phase09-domain-service-migration
```

原因如下：

- `phase08` 已把宿主、认证、错误处理与最小安全边界稳定下来，领域迁移已有正式承接面。
- 当前最缺的不是 API/Auth 壳，而是主链领域语义在新主线中的正式承接与验证。
- 若现在直接进入 ORM 定案或部署切线，会再次把“宿主迁移”“领域迁移”“数据访问定案”“部署切换”绑成一次高风险改写。
- 先冻结共享领域服务落点、正式宿主边界与主链验证矩阵，能让后续 `phase10` 的数据访问层收口建立在已确认的业务语义之上，而不是反向驱动业务设计。

## 三、关键决策
### 3.1 正式领域 API 宿主：继续收口到 `server/`
选择原因：

- `phase07` 已明确 `server/` 是后续新增宿主逻辑的正式落点。
- `phase08` 已把 `server/` 上的统一 `/api` 宿主、认证门禁与请求治理骨架跑通，不需要再新建第三套服务端入口。
- 若继续把新增正式领域 API 写回旧 `src/app/api/*`，会直接破坏 `phase07`、`phase08` 已冻结的宿主映射。

本阶段结论：

- 正式领域 API 宿主继续固定在 `server/`
- 旧 `src/app/api/*` 继续保留为存量业务 API、治理/辅助接口与兼容宿主
- `phase09` 的目标是让后续新增主链业务接口默认挂到 `server/`，而不是继续新增写回旧宿主

### 3.2 共享业务真相：优先收口到共享领域服务层
选择原因：

- 当前合同、账单、支付周期、仪表、抄表、退租结算与删除门禁语义已经分散沉淀在：
  - `src/lib/queries.ts`
  - `src/lib/validation.ts`
  - `src/lib/auto-bill-generator.ts`
  - `src/lib/checkout-settlement.ts`
  - `src/lib/bill-semantics.ts`
  - `src/lib/contract-activation.ts`
- 新旧宿主在 `phase09` 期间仍需并行存在；若只在 `server/` 私有目录重写一套逻辑，会重新制造第二份业务真相。
- 共享服务层可同时服务于：
  - Hono 正式领域 API
  - 旧 `src/app/api/*` 兼容包装
  - 后续主链验证与 `phase10` 数据访问层收口

本阶段结论：

- 领域业务真相优先收口到 `src/lib/domain/` 或等价共享目录
- `server/routes/*` 负责正式路由与请求/响应适配
- 旧 `src/app/api/*` 在需要兼容时只保留为薄包装、代理层或只读参考实现

### 3.3 主链范围：按“合同锚点 -> 账务 -> 仪表/抄表 -> 删除门禁/退租”整体规划
选择原因：

- 合同是租务事实主锚点，账单、续租、退租、抄表、房态变化都优先围绕合同表达。
- 支付周期、账单语义、抄表自动出账、退租结算与删除门禁之间本身存在事务编排和历史追溯耦合。
- 若把这些入口割裂为多个无关小任务，容易出现：
  - 页面预期正确、服务端生成结果不一致
  - 服务端生成结果正确、数据库事实不可追溯
  - 删除门禁只迁了一半，历史保留规则被破坏

本阶段结论：

- `phase09` 的正式范围包括：
  - 合同生命周期与合同主锚点相关服务
  - 账单金额/状态语义、支付周期与自动出账
  - 仪表/抄表、多仪表历史保留与相关账单追溯
  - 退租结算与删除门禁
- `phase09` 不按“页面/接口数量”拆，而按“领域真相链路”拆

### 3.4 删除与历史保留：优先拦截、终止、归档、停用与解绑
选择原因：

- `schema.prisma` 中仍存在多处 `onDelete: Cascade`，但 `phase03` 已明确：数据库关系设置不等于业务允许物理删除。
- 当前服务端已经通过 `queries.ts` 与 `validation.ts` 收紧了合同、房间、账单、抄表的默认删除路径。
- `Meter` 是独立资产，`MeterReading`、`Bill`、`BillDetail` 和退租结算账单都属于必须优先保留的历史事实。

本阶段结论：

- 删除语义继续优先：
  - 拦截
  - 终止
  - 归档
  - 停用
  - 解绑
- `phase09` 不因宿主迁移放宽历史事实保留规则
- 已迁移的正式领域服务必须继续显式表达删除门禁，而不是退回到依赖数据库级联

### 3.5 前端边界：不把 `src/minix` 扩写为完整领域页面迁移层
选择原因：

- `phase08` 只冻结了最小页面守卫，并没有准备完整领域页面加载与写操作的迁移基础。
- 当前用户对 UI 展示效果已有冻结要求，不适合把领域服务迁移与大规模前端页面迁移绑在一起。
- `phase09` 的验收重点是“页面预期、服务端生成结果与数据库事实一致”，而不是“所有页面都迁入新壳”。

本阶段结论：

- `src/minix` 在 `phase09` 继续只承担最小应用壳与门禁职责
- 当前领域服务迁移默认先服务于：
  - 新主线正式 API 宿主
  - 旧页面/旧 API 的兼容消费
- 完整页面迁移留给后续专门阶段判断

### 3.6 数据访问与部署：继续后置
选择原因：

- 数据访问层应服务于已确认的领域语义，而不是反向驱动业务设计。
- 当前迁移链仍有 SQLite 历史兼容项，贸然在 `phase09` 中同步处理 ORM/迁移链，会扩大风险面。
- 部署主线切换风险最高，必须后置到 `phase11` 才收口。

本阶段结论：

- `phase09` 不输出 ORM 最终定案
- `phase09` 不输出迁移链兼容项退出方案
- `phase09` 不输出最终部署主线
- `phase09` 的输出是为 `phase10` 与 `phase11` 提供稳定的领域服务边界与验证路径

## 四、承接资产与实现边界
### 4.1 允许直接承接的资产
- `server/app.ts`
- `server/middleware/*`
- `src/lib/prisma.ts`
- `src/lib/queries.ts`
- `src/lib/validation.ts`
- `src/lib/auto-bill-generator.ts`
- `src/lib/checkout-settlement.ts`
- `src/lib/bill-semantics.ts`
- `src/lib/contract-activation.ts`
- `src/app/api/contracts/[id]/route.ts`
- `src/app/api/contracts/[id]/checkout/route.ts`
- `src/app/api/contracts/[id]/generate-bills/route.ts`
- `src/app/api/bills/[id]/route.ts`
- `src/app/api/meter-readings/route.ts`
- `src/app/api/meter-readings/[id]/route.ts`
- `src/app/api/meter-readings/[id]/related-bills/route.ts`
- `src/app/api/rooms/[id]/route.ts`
- `src/app/api/utility-readings/route.ts`
- `prisma/schema.prisma`

### 4.2 允许做的事
- 在共享领域服务层收口合同、账单、支付周期、仪表、抄表、退租结算与删除门禁等主链语义。
- 在 `server/` 中承接正式领域 API 路由外壳，使新宿主开始正式承接主链业务接口。
- 让旧 `src/app/api/*` 在已迁接口上逐步退化为 compat wrapper、代理层或只读参考实现。
- 为后续 `phase10` 冻结查询/写路径需求、事务边界候选与仍存在的 schema/迁移链兼容项。

### 4.3 暂不做的事
- 不切换 ORM 或数据访问最终主线
- 不切换最终部署主线
- 不迁移治理/辅助接口
- 不迁移完整前端页面数据加载和领域页面逻辑
- 不新增用户体系、刷新令牌、角色框架或审计体系

## 五、目标结构
### 5.1 共享领域服务承接位
`phase09` 规划中的共享领域服务目录冻结为：

```text
src/lib/domain/
├── contracts/
├── billing/
├── meters/
├── delete-guards/
└── shared/
```

### 5.2 正式领域 API 宿主承接位
`phase09` 规划中的正式领域 API 目录冻结为：

```text
server/routes/
├── contracts.ts
├── bills.ts
├── meter-readings.ts
├── rooms.ts
└── checkout.ts
```

### 5.3 旧宿主保留边界
- 旧 `src/app/api/*`
  - 在 `phase09` 期间继续承担未迁移接口、治理/辅助接口与兼容宿主职责
  - 不再作为新增正式领域 API 的默认落点
- 旧 `src/app/*`
  - 继续作为当前页面行为与 UI 参考基线
  - 页面预期一致性继续作为 `phase09` 的验收输入，但不在本阶段要求完整页面迁移

## 六、环境与契约口径
### 6.1 数据与历史保留口径
- `Contract` 继续作为租务事实主锚点
- `Bill.amount / receivedAmount / pendingAmount / BillStatus` 继续沿用既有金额与状态语义
- `BillDetail + MeterReading` 继续作为正式多仪表计费追溯链
- `Meter` 继续作为独立资产
- `MeterReading.recordType` 继续区分：
  - `INITIAL_BASELINE`
  - `REGULAR_READING`
  - `CHECKOUT_FINAL`
- 合同、房间、账单、抄表删除继续优先受门禁保护

### 6.2 API 契约口径
- `phase09` 正式迁入的新 API 默认继续挂在 `server/` 的统一 `/api` 宿主下
- `phase09` 迁入的正式业务接口必须继续服从 `phase08` 已冻结的认证门禁、中间件链和错误出口
- 已迁主链接口的返回契约必须继续满足：
  - 页面预期可消费
  - 数据库事实可追溯
  - 失败语义稳定可解释

### 6.3 页面/API 一致性口径
- 当前页面宿主可暂时不迁，但页面所依赖的主链业务结果必须与新宿主服务端生成结果一致
- 未迁页面消费旧接口时，旧接口必须逐步退化为兼容层，而不是继续演化出第二套业务真相
- `phase09` 的一致性判断优先围绕：
  - 新签合同出账
  - 续租
  - 退租结算
  - 多仪表抄表出账
  - 删除门禁

## 七、阶段结论
`phase09-domain-service-migration` 的阶段价值不在于“已经完成 ORM 与部署切线收口”，而在于：

```text
先把共享领域服务、正式宿主边界与主链验证矩阵冻结下来，
再让后续数据访问层与部署主线建立在稳定的业务真相之上。
```

这能确保：

- 不会继续把新增主链业务真相写回旧 `src/app/api/*`
- 不会把领域迁移、ORM 定案与部署切线重新绑成一次大爆炸改写
- 不会在历史数据保留与删除门禁未冻结前就仓促进入后续阶段
- 当前阶段结论：`phase09` 已完成架构规划冻结，后续应按 `dev_plan` 子任务顺序进入 `/spec`
