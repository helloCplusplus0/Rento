# Phase09 Domain Service Migration 最终执行计划

## Summary
- 本轮 `/plan` 的直接目标不是继续改代码，而是确认 `phase09-domain-service-migration` 的阶段规划已经完整落地、口径一致，并给出后续执行顺序。
- 当前仓库的顶层真相源已经切到 `phase09`，且三份阶段文档已经存在：`docs/phase09_domain_service_migration_architecture_plan.md`、`docs/phase09_domain_service_migration_shared_baseline.md`、`docs/phase09_domain_service_migration_dev_plan.md`。
- 后续真正的实施入口不应再回到“补写阶段文档”，而应在你审核通过后，严格按 `phase09-01` 到 `phase09-06` 的顺序逐个进入 `/spec` 和实现。
- 本计划只冻结执行路线、边界、依赖关系与验证标准，不在只读阶段做任何实现或提交。

## Current State Analysis

### 1. 顶层真相源状态
- `plan.md` 已把默认工作流推进到 `phase09-domain-service-migration`，并把当前结论标记为“规划已完成，待审核”。
- `AGENTS.md` 已将当前默认入口切为 `phase09`，并补充共享领域服务落点、正式宿主边界、历史数据保留和主链验证矩阵。
- `project_rules.md` 已补充 `phase09` 的审核前提、允许路线、禁止越界项与实施前提。
- `architecture_map.md` 已补充 `phase09` 的共享领域服务层、正式领域 API 宿主层、旧宿主兼容层与直接输入。

### 2. 真实代码基线
- 新宿主已经存在且可承接正式 API 外壳：
  - `server/app.ts`
  - `server/middleware/*`
  - `server/routes/auth.ts`
  - `server/routes/health.ts`
- 旧业务实现仍是 `phase09` 的直接参考真相：
  - `src/app/api/contracts/[id]/route.ts`
  - `src/app/api/contracts/[id]/renew/route.ts`
  - `src/app/api/contracts/[id]/checkout/route.ts`
  - `src/app/api/contracts/[id]/generate-bills/route.ts`
  - `src/app/api/bills/[id]/route.ts`
  - `src/app/api/meter-readings/route.ts`
  - `src/app/api/meter-readings/[id]/route.ts`
  - `src/app/api/meter-readings/[id]/related-bills/route.ts`
  - `src/app/api/rooms/[id]/route.ts`
  - `src/app/api/utility-readings/route.ts`
- 共享语义已经沉淀在 `src/lib/*`，是后续抽成单一真相源的主输入：
  - `src/lib/queries.ts`
  - `src/lib/validation.ts`
  - `src/lib/auto-bill-generator.ts`
  - `src/lib/checkout-settlement.ts`
  - `src/lib/bill-semantics.ts`
  - `src/lib/contract-activation.ts`
  - `src/lib/prisma.ts`

### 3. 数据与主链现状
- `prisma/schema.prisma` 已确认当前数据库主线为 PostgreSQL。
- `Contract` 仍是主锚点，`Bill`、`BillDetail`、`MeterReading`、`Room`、`Meter` 关系仍符合阶段文档中的主链假设。
- 数据库层仍存在若干 `onDelete: Cascade`，因此业务删除安全必须继续依赖服务端门禁，而不能把 schema 关系误读为业务允许删除。
- 旧实现中已经存在关键事务流：
  - `src/lib/contract-activation.ts` 使用 `prisma.$transaction(...)` 处理合同激活与房态联动。
  - `src/app/api/contracts/[id]/checkout/route.ts` 使用事务处理退租结算、旧账单结算与审计元数据。
  - `src/app/api/contracts/[id]/renew/route.ts` 使用事务处理续租合同切换。
  - `src/app/api/meter-readings/route.ts` 已使用串行化事务和 `P2034` 重试保护正式抄表去重。

### 4. Context7 最新工具口径
- Hono 文档确认：
  - 大型应用应把路由拆到独立文件，再通过 `app.route()` 组合。
  - 路由嵌套必须先挂子路由，再把父路由挂到主应用，避免遗漏子路由。
- Prisma 文档确认：
  - 需要跨实体一致性的主链写操作应使用 `$transaction`。
  - 对并发写冲突场景，推荐使用 `Serializable` 隔离级别并在 `P2034` 时重试。
- 这与仓库现状是一致的，因此 `phase09` 不应推翻当前技术路线，而应延续“共享服务层 + Hono 路由适配 + Prisma 事务保护”的落地方式。

## Proposed Changes

### 1. 以已存在的 `phase09` 三份文档作为正式评审对象
- 评审文件：
  - `docs/phase09_domain_service_migration_architecture_plan.md`
  - `docs/phase09_domain_service_migration_shared_baseline.md`
  - `docs/phase09_domain_service_migration_dev_plan.md`
- 评审重点：
  - 是否已冻结共享领域服务落点为 `src/lib/domain/` 或等价共享目录。
  - 是否已冻结正式领域 API 宿主继续收口到 `server/`。
  - 是否已明确旧 `src/app/api/*` 只能作为 compat wrapper、未迁移存量接口或只读参考。
  - 是否已把删除门禁、历史保留、退租结算、多仪表追溯写成统一口径。

### 2. 审核通过后的实施顺序固定为 `phase09-01` 到 `phase09-06`
- `phase09-01-domain-shared-semantics-and-service-host`
  - 先创建共享服务层目录、服务命名与宿主挂接方式。
  - 文件焦点：
    - `server/app.ts`
    - `src/lib/domain/**`
    - `server/routes/*.ts`
- `phase09-02-contract-lifecycle-and-delete-guards`
  - 先稳定合同主锚点、合同删除门禁、房间删除门禁。
  - 文件焦点：
    - `src/lib/contract-activation.ts`
    - `src/lib/validation.ts`
    - `src/app/api/contracts/[id]/route.ts`
    - `src/app/api/rooms/[id]/route.ts`
- `phase09-03-billing-and-payment-cycle-services`
  - 再收口账单金额/状态语义、支付周期与账单删除门禁。
  - 文件焦点：
    - `src/lib/bill-semantics.ts`
    - `src/lib/auto-bill-generator.ts`
    - `src/app/api/bills/[id]/route.ts`
- `phase09-04-meter-reading-and-utility-billing-chain`
  - 再迁移抄表、周期判重、自动出账、相关账单追溯与最终抄表语义。
  - 文件焦点：
    - `src/app/api/meter-readings/route.ts`
    - `src/app/api/meter-readings/[id]/route.ts`
    - `src/app/api/meter-readings/[id]/related-bills/route.ts`
    - `src/app/api/utility-readings/route.ts`
- `phase09-05-checkout-renewal-and-main-flow-consistency`
  - 最后再收口续租、退租结算与主链一致性矩阵。
  - 文件焦点：
    - `src/lib/checkout-settlement.ts`
    - `src/app/api/contracts/[id]/renew/route.ts`
    - `src/app/api/contracts/[id]/checkout/route.ts`
    - `src/app/api/contracts/[id]/generate-bills/route.ts`
- `phase09-06-legacy-route-compat-and-exit-checklist`
  - 最终形成 compat wrapper 清单、未迁移接口去向和退出条件。
  - 文件焦点：
    - `src/app/api/**/*`
    - `server/routes/*`
    - `docs/phase09_domain_service_migration_*`

### 3. 共享服务层与路由层的实现方式在执行前即锁定
- 共享领域服务层：
  - 正式落点采用 `src/lib/domain/`。
  - 内部按主链拆分为 `contracts/`、`billing/`、`meters/`、`delete-guards/`、`shared/`。
  - 原则是“抽取既有业务真相”，不是“重写一套全新业务”。
- Hono 路由层：
  - 正式落点采用 `server/routes/` 下的领域子路由文件。
  - 路由文件只负责请求解析、鉴权边界、响应契约和错误出口，不承载新的业务真相。
  - 路由挂接时遵循 Hono 的 `app.route()` 组合方式和正确的先子后父挂接顺序。
- 兼容层：
  - 已迁接口的旧 `src/app/api/*` 逐步退化为 compat wrapper。
  - 未迁接口继续保留，但不得继续新增主链业务语义。

### 4. 主链事务与删除门禁策略在执行前即锁定
- 涉及合同状态切换、房态联动、账单生成、退租结算、抄表创建等跨实体写操作，继续优先使用 Prisma 事务。
- 对并发冲突明显的写场景，延续当前 `meter-readings` 的做法，优先保留 `Serializable + P2034 retry` 的治理模式。
- 删除策略固定为：
  - 优先拦截
  - 终止
  - 归档
  - 停用
  - 解绑
- 不允许因为 `phase09` 迁移而放宽：
  - 合同删除门禁
  - 房间删除门禁
  - 账单删除门禁
  - 抄表历史保留
  - 仪表历史保留

### 5. 验收矩阵以主链路径为核心，而不是接口数量
- 执行阶段必须至少覆盖以下主链验证路径：
  - 新签合同 -> 自动生成押金/租金/其他账单 -> 合同/房态/账单一致。
  - 续租 -> 原合同状态切换 + 新合同生成 + 账单周期保持一致。
  - 退租结算 -> 欠费、押金、最终抄表、结算账单一致。
  - 多仪表抄表 -> 周期判重 -> 自动出账 -> `BillDetail` 可追溯。
- 执行阶段必须至少覆盖以下门禁验证：
  - 合同删除门禁
  - 房间删除门禁
  - 账单删除门禁
  - 抄表禁删与历史保留

## Assumptions & Decisions
- 已确认本轮 `/plan` 所需的顶层真相源同步和 `docs/phase09_*` 文档产出已经完成，因此当前不再重复规划或新增第二套阶段文档。
- 已确认 `phase09` 的目标是“领域服务迁移”，不是 UI 迁移、ORM 定案或部署切线。
- 已确认 `server/` 是正式领域 API 唯一正式宿主，`src/app/api/*` 只保留 compat/存量/参考职责。
- 已确认 `src/minix/` 在 `phase09` 继续只承担最小应用壳与门禁职责，不扩张为完整领域页面迁移层。
- 已确认 `Prisma + PostgreSQL` 仍是当前阶段的数据访问主线，`phase09` 不处理迁移链最终收口。
- 已确认后续所有实现前都应先明确需要使用的工具，并优先参考 Context7 的最新文档口径，尤其是 Hono 路由组织与 Prisma 事务策略。

## Verification Steps
- 文档一致性验证：
  - 复核 `plan.md`、`AGENTS.md`、`project_rules.md`、`architecture_map.md` 是否都已使用 `phase09` 作为当前默认入口。
  - 复核三份 `docs/phase09_*` 文档是否都使用同一套共享领域服务落点、正式宿主边界、旧兼容宿主边界和主链验证矩阵。
- 代码映射验证：
  - 复核计划中引用的所有输入路径在仓库中都真实存在。
  - 复核 `server/app.ts` 当前仍只挂载 `health` 与 `auth`，说明后续新增领域路由确有明确承接位。
  - 复核旧业务 API 与 `src/lib/*` 中的事务、删除门禁和账单/抄表语义仍可作为直接参考基线。
- 工具口径验证：
  - 复核 Context7 提供的 Hono 路由组织与 Prisma 事务策略，确保执行阶段不偏离当前技术栈最佳实践。
- 阶段停顿门禁：
  - 本轮 `/plan` 到此结束，必须等待用户审核 `phase09` 文档与本计划文件。
  - 未经审核，不进入 `phase09` 的 `/spec`、实现、提交或推送。
