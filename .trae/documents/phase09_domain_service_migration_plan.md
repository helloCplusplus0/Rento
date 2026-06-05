# Phase09 Domain Service Migration Plan

## Summary
- 本轮 `/plan` 只为 `phase09-domain-service-migration` 产出阶段规划，不直接进入 `/spec`、不直接改代码。
- 当前仓库的真实代码进度已经完成 `phase08` 的统一 API 宿主、最小认证闭环、请求治理与 `src/minix` 最小登录守卫，但顶层真相源仍停留在“`phase08` 文档已产出、待审核”的旧口径；`phase09` 的第一步必须先同步根级真相源，再产出新的阶段级文档。
- `phase09` 的核心不是“重写业务”，而是把已经沉淀在旧 `src/app/api/*` 与 `src/lib/*` 里的合同、账单、支付周期、仪表、抄表、退租结算、删除门禁等主链语义，迁到以 `server/` 为正式宿主、以共享领域服务为单一真相源的新主线上。
- 本轮计划基于仓库真实输入冻结一个低风险路线：先抽取/收口共享领域语义，再分组迁移 Hono 路由与兼容适配，最后补足主链验证与退出条件，而不是把宿主切换、领域迁移、ORM 决策与部署切线绑成一次大爆炸改写。

## Current State Analysis

### 1. 上游阶段与当前漂移
- `phase07` 已完成并把 `src/minix/` 与 `server/` 冻结为正式前端壳/运行时承接位；`phase08` 的代码实现也已经完成统一 `/api` 宿主、最小认证闭环、请求治理、错误出口与最小页面门禁。
- 但顶层真相源仍把默认入口停留在 `phase08`：
  - `plan.md` 仍写“当前默认工作流：phase08-api-and-auth-foundation”，并把 `phase08` 记为“规划已完成，待审核”。
  - `AGENTS.md` 与 `architecture_map.md` 也仍以 `phase08` 为当前默认入口。
- 因此，`phase09` 的 `/plan` 不只是新增阶段文档，还必须先修复“代码已推进，顶层叙事未同步”的真相源漂移。

### 2. `phase09` 的真实直接输入
- 新宿主输入已经存在：
  - `server/app.ts`
  - `server/routes/auth.ts`
  - `server/routes/health.ts`
  - `server/middleware/*`
- 前端壳输入已经存在：
  - `src/minix/router/index.tsx`
  - `src/minix/router/guards.ts`
  - `src/minix/lib/session-client.ts`
  - `src/minix/routes/LoginPage.tsx`
- 旧领域实现仍是直接参考基线，集中在：
  - `src/app/api/contracts/[id]/route.ts`
  - `src/app/api/contracts/[id]/checkout/route.ts`
  - `src/app/api/contracts/[id]/generate-bills/route.ts`
  - `src/app/api/bills/[id]/route.ts`
  - `src/app/api/meter-readings/route.ts`
  - `src/app/api/meter-readings/[id]/route.ts`
  - `src/app/api/meter-readings/[id]/related-bills/route.ts`
  - `src/app/api/rooms/[id]/route.ts`
  - `src/app/api/utility-readings/route.ts`
- 共享领域语义已分散沉淀在 `src/lib/*`，其中最关键的输入是：
  - `src/lib/queries.ts`
  - `src/lib/validation.ts`
  - `src/lib/auto-bill-generator.ts`
  - `src/lib/checkout-settlement.ts`
  - `src/lib/bill-semantics.ts`
  - `src/lib/contract-activation.ts`
  - `src/lib/prisma.ts`

### 3. 主链业务真相已经存在，但承载层分散
- 合同是租务事实主锚点，`Contract` 连接 `Room`、`Renter`、`Bill` 与 `MeterReading`，其状态语义已固定在 `schema.prisma`。
- 多仪表与历史保留链已经存在：
  - `Meter` 是独立资产
  - `MeterReading` 区分 `INITIAL_BASELINE / REGULAR_READING / CHECKOUT_FINAL`
  - `BillDetail` 是正式多仪表计费追溯链
- 删除门禁已经在代码中被显式收紧：
  - `src/lib/queries.ts` 默认拒绝房间、合同、账单、抄表的通用删除
  - `src/lib/validation.ts` 里有房间/合同删除安全检查
  - 抄表删除已被显式禁用
- 退租结算、账单状态语义、支付周期账单生成、合同激活等也都有现成实现，但它们现在仍分散在旧 API 路由与 `src/lib/*` 之间，还没有成为新主线单一承接层。

### 4. 当前最大的迁移风险
- 风险一：数据库 schema 仍保留多个 `onDelete: Cascade`，当前安全主要靠服务端门禁；若 phase09 直接绕开现有服务层去直连 Prisma，容易破坏历史事实保留。
- 风险二：退租、账单生成、抄表计费是跨合同/账单/房间/仪表的事务编排逻辑，若按“按文件搬运”而不是“按领域服务切块”迁移，容易把一致性拆散。
- 风险三：旧 `src/app/api/*` 与新 `server/` 若同时继续承载新增领域语义，会重新形成双重宿主真相。
- 风险四：`src/minix` 当前只完成最小门禁，并没有完整领域页面迁移基础，因此 `phase09` 不能把“前端页面迁移”误当作领域服务迁移前提。

### 5. 已有文档与阶段输入
- 仓库里尚无任何 `docs/phase09_*` 文档，说明本轮必须新建：
  - `docs/phase09_domain_service_migration_architecture_plan.md`
  - `docs/phase09_domain_service_migration_dev_plan.md`
  - `docs/phase09_domain_service_migration_shared_baseline.md`
- 现有 `docs/phase06_*`、`docs/phase07_*`、`docs/phase08_*` 已足够作为 `phase09` 的上游输入，尤其是：
  - `docs/phase06_minix_replatform_architecture_plan.md`
  - `docs/phase07_app_shell_and_runtime_foundation_architecture_plan.md`
  - `docs/phase08_api_and_auth_foundation_architecture_plan.md`
  - `docs/phase08_api_and_auth_foundation_dev_plan.md`
  - `docs/phase08_api_and_auth_foundation_shared_baseline.md`

## Assumptions & Decisions
- 阶段切换判断：本轮计划以“`phase08` 代码已完成、顶层文档需同步”为既定事实，不再把 `phase08` 当作当前待审核入口继续停留。
- 迁移主目标：`phase09` 只冻结“领域服务迁移”，不提前做 ORM 最终定案、不切部署主线、不迁完整前端页面。
- 正式宿主：所有新增正式领域 API 的默认宿主固定为 `server/`，不再把新增主链业务路由写回旧 `src/app/api/*`。
- 共享服务落点：领域语义的单一真相源应优先收口到可被新旧宿主共同复用的共享服务层，而不是复制一份只给 Hono 用的私有实现。基于当前仓库结构，优先采用 `src/lib/domain/*` 或等价共享目录承接服务语义，再由 `server/routes/*` 与旧兼容 API 做适配。
- 兼容策略：`src/app/api/*` 在 `phase09` 期间可继续作为兼容入口，但其职责应逐步降为“薄包装/薄转发/保留未迁接口”，不能继续承载新增领域真相。
- 删除策略：房间、合同、账单、抄表默认继续优先拦截/终止/归档/解绑，不因宿主迁移放宽历史事实保留规则。
- 数据边界：`schema.prisma` 继续作为数据主真相源，但 `phase09` 不把 schema 结构重写当作默认交付；若发现必须调整，也只允许做支撑现有领域语义的最小增量，不在本阶段定案 ORM 与迁移链整改。
- 前端边界：`src/minix` 在 `phase09` 默认不扩张为完整领域页面迁移层；页面预期一致性以“现有页面行为与新领域服务结果一致”为主，而不是要求本阶段完成 UI 宿主切换。
- 验收方法：`phase09` 的验收要以主链验证路径为核心，而不是只看路由是否迁到 Hono。至少覆盖：新签合同出账、续租、退租结算、多仪表抄表出账、删除门禁。

## Proposed Changes

### 1. 先同步顶层真相源，把默认入口从 `phase08` 推进到 `phase09`
- 更新 `plan.md`
  - 把“当前默认工作流”从 `phase08-api-and-auth-foundation` 切到 `phase09-domain-service-migration`。
  - 把 `phase08` 的当前结论从“规划已完成，待审核”推进为“已完成”或等价结论，并注明已完成统一 API 宿主、认证门禁、中间件链、错误处理、最小公开 API 白名单与最小页面守卫。
  - 把“当前下一步”改为先发起 `phase09` 的 `/plan`，冻结领域服务迁移边界，而不是继续停留在 `phase08`。
- 更新 `AGENTS.md`
  - 将当前默认入口改成 `phase09-domain-service-migration`。
  - 补充 `phase09` 的当前阶段重点：合同锚点、账单语义、支付周期、仪表/抄表、删除门禁、多仪表历史保留、主链查询与写路径一致性。
- 更新 `project_rules.md`
  - 新增 `phase09` 的最低审核前提：共享领域服务落点、正式宿主边界、主链验证路径、历史数据保留约束、旧兼容宿主保留边界。
  - 明确 `phase09` 禁止越界到 `phase10/11`：不切 ORM 最终主线、不切部署主线、不因迁移顺手大改 UI。
- 更新 `architecture_map.md`
  - 把当前阶段说明从 `phase08` 切到 `phase09`。
  - 补充 `phase09` 的目标结构：`server/` 正式领域路由承接位、共享领域服务承接位、旧 `src/app/api/*` 的兼容角色与退出条件。
- 核对 `global_skills.md` 与 `project_skills.md`
  - 预期不需要大改方法论，但需在计划中明确：若内容无需调整，也要在本轮同步检查后显式保持不变，避免遗漏顶层同步要求。

### 2. 新建 `phase09` 架构规划文档，先冻结“迁什么，不迁什么”
- 新建 `docs/phase09_domain_service_migration_architecture_plan.md`
- 文档必须回答以下关键问题：
  - 为什么 `phase09` 要先迁领域服务，而不是先改前端页面或部署主线。
  - 为什么正式领域 API 继续收口到 `server/`，而共享业务真相优先收口到共享服务层，而不是继续把核心语义留在旧 `src/app/api/*` 路由里。
  - 为什么合同、账单、支付周期、仪表、抄表、删除门禁必须作为一个主链集合整体规划，而不能分散零敲碎打。
  - 为什么删除门禁与历史保留必须先于“清理旧接口”。
  - 为什么 `phase09` 仍不能顺手决定 ORM 主线或部署切线。
- 文档中必须冻结的目标结构建议：
  - `server/routes/contracts.ts`
  - `server/routes/bills.ts`
  - `server/routes/meter-readings.ts`
  - `server/routes/rooms.ts`
  - `server/routes/renters.ts` 或等价最小承接位（仅在直接涉及合同锚点读取时）
  - `src/lib/domain/contracts/*`
  - `src/lib/domain/billing/*`
  - `src/lib/domain/meters/*`
  - `src/lib/domain/delete-guards/*`
  - `src/lib/domain/shared/*`
- 若最终命名不完全相同，也必须在文档中固定“共享服务层”和“路由适配层”的目录边界，避免后续 `/spec` 再次摇摆。

### 3. 新建 `phase09` 共享基线文档，冻结主链语义与禁止路线
- 新建 `docs/phase09_domain_service_migration_shared_baseline.md`
- 文档必须统一冻结以下共享语义：
  - 合同是租务事实主锚点，合同生命周期优先于页面交互便利性。
  - `Bill.amount / receivedAmount / pendingAmount / BillStatus` 的金额与状态语义继续沿用 `src/lib/bill-semantics.ts`。
  - 押金、钥匙押金、卫生费、租金周期账单继续沿用既有生成语义，不重写为另一套轻量简化规则。
  - 多仪表计费继续以 `BillDetail + MeterReading` 为正式追溯链，`Bill.meterReadingId` 只视为兼容字段。
  - 仪表是独立资产；停用/解绑优先于删除。
  - 抄表记录默认不删；合同/房间/账单删除默认受门禁保护。
  - 退租结算继续以“账单、押金、欠费、最终抄表”联动为主，不拆成互不一致的局部流程。
- 文档必须明确禁止路线：
  - 不直接迁移治理/辅助接口
  - 不把 schema `Cascade` 误读成业务允许删除
  - 不用“删旧宿主接口”替代主链验收
  - 不把 `src/minix` 页面迁移当作 `phase09` 的默认前提
  - 不在本阶段敲定 ORM/迁移链最终方案

### 4. 新建 `phase09` 开发规划文档，按主链风险拆成顺序子任务
- 新建 `docs/phase09_domain_service_migration_dev_plan.md`
- 建议把 `phase09` 拆成以下顺序子任务，确保每一轮 `/spec` 都有清晰边界：
  - `phase09-01-domain-shared-semantics-and-service-host`
    - 目标：冻结共享领域服务层落点、服务命名、事务边界、旧/新宿主调用关系。
    - 直接输入：`src/lib/bill-semantics.ts`、`src/lib/queries.ts`、`src/lib/prisma.ts`、`server/app.ts`
    - DoD：共享领域服务目录、核心服务清单、兼容调用策略已冻结。
  - `phase09-02-contract-lifecycle-and-delete-guards`
    - 目标：迁移合同状态流转、合同删除门禁、房间删除门禁及其服务化承接。
    - 直接输入：`src/lib/contract-activation.ts`、`src/lib/validation.ts`、`src/app/api/contracts/[id]/route.ts`、`src/app/api/rooms/[id]/route.ts`
    - DoD：合同/房间删除门禁与合同激活语义可由新主线服务稳定承接。
  - `phase09-03-billing-and-payment-cycle-services`
    - 目标：迁移账单金额/状态语义、支付周期账单生成与账单删除门禁。
    - 直接输入：`src/lib/bill-semantics.ts`、`src/lib/auto-bill-generator.ts`、`src/app/api/bills/[id]/route.ts`
    - DoD：账单语义、支付周期、删除门禁与生成路径在共享服务层统一。
  - `phase09-04-meter-reading-and-utility-billing-chain`
    - 目标：迁移抄表创建、重复门禁、自动出账、相关账单追溯与最终抄表语义。
    - 直接输入：`src/app/api/meter-readings/route.ts`、`src/app/api/meter-readings/[id]/route.ts`、`src/app/api/meter-readings/[id]/related-bills/route.ts`、`src/app/api/utility-readings/route.ts`
    - DoD：多仪表抄表链与自动出账链可由新服务承接，历史追溯不丢失。
  - `phase09-05-checkout-renewal-and-main-flow-consistency`
    - 目标：迁移退租结算、续租/补账单关联编排，收口主链查询与写路径一致性。
    - 直接输入：`src/lib/checkout-settlement.ts`、`src/app/api/contracts/[id]/checkout/route.ts`、`src/app/api/contracts/[id]/generate-bills/route.ts`、相关续租入口
    - DoD：新签合同、续租、退租结算、多仪表抄表出账四条主链在新宿主上可解释、可验证。
  - `phase09-06-legacy-route-compat-and-exit-checklist`
    - 目标：写清旧 `src/app/api/*` 兼容包装边界、未迁接口去向与退出条件。
    - DoD：哪些旧接口已降级为 compat wrapper、哪些仍保留、哪些可在后续阶段退出，均已形成清单。
- 每个子任务都必须包含：
  - 目标
  - 范围
  - 不在范围内
  - 参考来源
  - DoD
  - 至少一条可执行主链验证路径

### 5. 冻结 `phase09` 的共享服务落点与旧/新宿主关系
- 计划中必须明确以下文件/目录是 `phase09` 的真实变更落点候选：
  - 继续修改：
    - `server/app.ts`
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
  - 新增共享服务目录建议：
    - `src/lib/domain/contracts/`
    - `src/lib/domain/billing/`
    - `src/lib/domain/meters/`
    - `src/lib/domain/delete-guards/`
    - `src/lib/domain/shared/`
  - 新增 Hono 路由承接位建议：
    - `server/routes/contracts.ts`
    - `server/routes/bills.ts`
    - `server/routes/meter-readings.ts`
    - `server/routes/rooms.ts`
    - `server/routes/checkout.ts` 或将退租入口收口到 `contracts.ts` 的受控子路由
- 选择理由：
  - 共享领域真相需要同时服务于 Hono 新宿主和旧兼容宿主。
  - 当前 Hono 宿主已稳定，适合继续承接正式业务路由外壳。
  - 当前 `src/lib/*` 已经是最真实的语义沉淀位，优先抽层比“重写一套 server 私有逻辑”更符合低复杂度原则。

### 6. 冻结 `phase09` 的主链验证矩阵与最小验收路径
- 阶段文档必须明确至少四条主链验证路径：
  - 新签合同 -> 自动生成押金/租金/其他账单 -> 合同/房态/账单数据一致
  - 续租 -> 新旧合同关系与账单周期策略一致
  - 退租结算 -> 欠费、押金、最终抄表、结算账单一致
  - 多仪表抄表 -> 周期判重 -> 聚合账单 -> BillDetail/历史追溯一致
- 还必须明确至少三类门禁验证：
  - 房间删除门禁
  - 合同删除门禁
  - 账单/抄表历史删除门禁
- 验收文档中必须写清数据库事实核对点：
  - `Contract.status`
  - `Room.status / currentRenter`
  - `Bill.amount / receivedAmount / pendingAmount / status`
  - `Meter.isActive`
  - `MeterReading.recordType / isBilled`
  - `BillDetail` 追溯链

### 7. 冻结 `phase09` 的兼容保留边界与后续输出
- 必须写清旧 `src/app/api/*` 的阶段性职责：
  - 已迁接口：允许退化为 compat wrapper、代理层或直接只读参考实现
  - 未迁接口：继续作为旧宿主存量运行线保留
  - 禁止再新增主链业务真相到旧宿主
- 必须写清 `phase09` 对 `phase10` 的输出：
  - 已冻结的领域服务边界
  - 查询与写路径需求
  - 事务边界候选
  - 仍存在的 schema/迁移链兼容项
- 必须写清 `phase09` 不输出的内容：
  - ORM 最终定案
  - 最终部署主线
  - 完整前端页面迁移

## Verification Steps
- 顶层真相源验证：
  - `AGENTS.md`、`project_rules.md`、`plan.md`、`architecture_map.md` 已从 `phase08` 切换为 `phase09` 默认入口。
  - `global_skills.md`、`project_skills.md` 已在本轮同步检查；若无需修改，也已在计划/审核说明中明确“保持不变”。
- 阶段文档验证：
  - `docs/phase09_domain_service_migration_architecture_plan.md` 已冻结范围、边界、共享服务落点、旧/新宿主关系和禁止路线。
  - `docs/phase09_domain_service_migration_shared_baseline.md` 已冻结合同锚点、账单语义、多仪表历史保留、删除门禁和退租结算共享语义。
  - `docs/phase09_domain_service_migration_dev_plan.md` 已拆出顺序子任务，并为每个子任务给出范围、参考来源与 DoD。
- 代码映射验证：
  - `phase09` 的计划文件中引用的路径都能在仓库中找到真实输入：
    - `server/app.ts`
    - `src/lib/queries.ts`
    - `src/lib/validation.ts`
    - `src/lib/auto-bill-generator.ts`
    - `src/lib/checkout-settlement.ts`
    - `src/lib/bill-semantics.ts`
    - `src/lib/contract-activation.ts`
    - 旧 `src/app/api/*` 领域路由
    - `prisma/schema.prisma`
- 阶段边界验证：
  - 文档中没有把 `phase09` 扩张到 ORM 最终定案、部署切线或完整页面迁移。
  - 文档中已明确 `phase09` 的正式宿主、共享服务层和旧兼容宿主边界。
  - 文档中已明确“删除门禁优先于物理删除”的历史保留原则。
- 后续实施前预置验收路径：
  - `npm run lint`
  - `npm run type-check`
  - `npm run build`
  - `npm run build:minix`
  - `/api/health` 可用
  - 至少一条新签合同、续租、退租结算、多仪表抄表出账的 smoke 验证路径
