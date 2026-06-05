# Phase10 Data Access And Migration Closure 架构规划

## 一、文档定位
本文档用于承接 `phase09-domain-service-migration` 完成后的下一阶段工作流，回答以下问题：

- 为什么 `phase10` 先冻结长期数据访问层方案，而不是继续直接迁移新的主链领域服务
- 为什么当前仍以 `Prisma + PostgreSQL` 作为正式数据访问主线，而不是再引入第二套 ORM 或仓储框架
- 为什么需要把正式主链查询、legacy compat 查询与治理/脚本查询分开定义
- 为什么 `src/lib/transaction-manager.ts` 与领域服务中的事务包装不能长期并存为多套口径
- 为什么 `db push` 只能继续作为兼容兜底，而不能被误读成正式迁移链

本文档不替代：

- [plan.md](file:///home/dell/Projects/Rento/plan.md) 的阶段顺序与当前结论职责
- [AGENTS.md](file:///home/dell/Projects/Rento/AGENTS.md) 的入口摘要职责
- [phase10_data_access_and_migration_closure_dev_plan.md](file:///home/dell/Projects/Rento/docs/phase10_data_access_and_migration_closure_dev_plan.md) 的子任务拆分职责
- [phase10_data_access_and_migration_closure_shared_baseline.md](file:///home/dell/Projects/Rento/docs/phase10_data_access_and_migration_closure_shared_baseline.md) 的共享边界职责

## 二、当前阶段前提
### 2.1 已完成上游
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- `phase06-minix-replatform` 已完成完整路线图、模块分类与真相源切换冻结
- `phase07-app-shell-and-runtime-foundation` 已完成新应用壳、新运行时入口与旧运行线映射冻结
- `phase08-api-and-auth-foundation` 已完成统一 API 宿主、认证门禁、中间件链、错误处理与最小页面守卫收口
- `phase09-domain-service-migration` 已完成共享领域服务落点、正式宿主边界、主链 smoke 与旧 `src/app/api/*` compat wrapper 清单收口

### 2.2 真实现状
- 共享领域服务已经收口到：
  - `src/lib/domain/contracts/index.ts`
  - `src/lib/domain/billing/index.ts`
  - `src/lib/domain/meters/index.ts`
  - `src/lib/domain/delete-guards/index.ts`
- 这些服务已承接正式主链写逻辑，但仍直接依赖 `src/lib/prisma.ts`，并分别复制了事务重试逻辑。
- 查询层仍分散在：
  - `src/lib/queries.ts`
  - `src/lib/optimized-queries.ts`
  - `src/lib/dashboard-queries.ts`
  - `src/lib/search-queries.ts`
  - 多个 repair / consistency / validation 辅助文件
- `phase09-06` 已通过以下文件冻结旧路由清单与 `phase10` 分桶输入：
  - `server/lib/legacy-route-inventory.ts`
  - `scripts/phase09-06-legacy-route-inventory.ts`
- 当前数据库主线已切到 PostgreSQL，但迁移链仍保留 SQLite 时代残留：
  - `prisma/schema.prisma` 使用 `postgresql`
  - `prisma/migrations/migration_lock.toml` 仍是 `provider = "sqlite"`
  - `scripts/migrate-and-seed.sh` 仍保留 `db push` 兼容分支

### 2.3 为什么现在进入 `phase10`
当前最合理的下一阶段是：

```text
phase10-data-access-and-migration-closure
```

原因如下：

- `phase09` 已经冻结主链领域语义，后续数据访问层必须建立在这些语义之上，而不是继续由旧查询 helper 反向定义领域边界。
- 当前最缺的不是新的业务规则，而是“哪些路径是正式数据访问主线、哪些仍是兼容查询、哪些只是治理脚本入口”的单一解释。
- 若现在直接进入部署切线或继续迁更多主链领域服务，会把“领域迁移”“数据访问收口”“迁移链修复”“部署切换”重新绑成一次高风险改写。
- 先冻结事务边界、查询分层和迁移兼容项，能让后续 `phase11` 建立在清晰的数据访问真相之上。

### 2.4 外部资料校验
按当前阶段要求，已通过 Context7 核验 `Prisma` 最新文档，得到以下与本阶段直接相关的结论：

- Prisma 官方支持 interactive transaction：
  - `prisma.$transaction(async (tx) => {}, { isolationLevel, maxWait, timeout })`
- Prisma 官方建议在 `Serializable` 下遇到 `P2034` 写冲突时采用有限重试
- 正式部署链路应优先以 `prisma migrate deploy` 应用已冻结迁移
- `db push` 更适合作为开发或兼容路径，而不是长期正式迁移链

## 三、关键决策
### 3.1 正式数据访问主线：继续固定为 `Prisma + PostgreSQL`
选择原因：

- 当前仓库中所有正式主链写路径已经围绕 `Prisma` 构建，不存在引入第二套 ORM 的现实收益。
- `phase09` 已冻结的领域服务、正式宿主与 smoke 验证都建立在现有 Prisma 语义之上。
- 重新引入仓储框架、Query Builder 或第二套 DAL，会把本阶段从“收口”变成“重构一整层基础设施”。

本阶段结论：

- 正式数据访问主线继续固定为 `Prisma + PostgreSQL`
- `src/lib/prisma.ts` 继续作为 Prisma Client 的单一入口
- `phase10` 不引入新的 ORM、Repository 框架或平行数据访问技术栈

### 3.2 正式主链写路径：继续优先收口到共享领域服务
选择原因：

- `phase09` 的核心价值就是把主链真相从旧宿主迁入共享领域服务层。
- 若 `phase10` 再把正式写路径重新抽回旧 `queries.ts`、路由层或新造的数据访问封装，就会破坏 `phase09` 的阶段结论。
- 合同、账单、抄表、退租、删除门禁都是跨聚合写操作，必须继续由共享领域服务保持业务锚点与事务边界。

本阶段结论：

- 正式主链写路径继续固定在 `src/lib/domain/*`
- 数据访问层收口的目标不是替换共享领域服务，而是为它们提供统一事务与访问约束
- 旧 `src/app/api/*`、legacy 查询 helper 与治理脚本不得重新承接新的主链写真相

### 3.3 查询模式：明确分为正式主链查询、legacy compat 查询与治理/脚本查询
选择原因：

- 当前 `src/lib/queries.ts` 与 `src/lib/optimized-queries.ts` 都在承接列表、详情、统计与部分存量写逻辑，职责已经发生重叠。
- `phase09-06` 清单显示，大量 `defer-unmigrated` 路由仍依赖旧查询层；若不显式分层，后续无法判断哪些查询是正式保留、哪些只是兼容债务。
- dashboard、repair、validation、consistency 等辅助入口与主链页面/正式宿主的读模型需求并不完全相同，不应继续混写成同一层。

本阶段结论：

- `phase10` 统一把查询入口分为三类：
  - 正式主链查询
  - legacy compat 查询
  - 治理/脚本查询
- 允许同一文件在过渡期内同时存在多类能力，但文档中必须为其标明正式身份、保留原因与退出条件
- `phase10` 的输出不是立即删掉旧查询 helper，而是先冻结 canonical read path

### 3.4 事务边界：统一为 `Serializable + 有界重试`，但实现口径必须单一
选择原因：

- 当前 `src/lib/domain/contracts/index.ts`、`src/lib/domain/billing/index.ts`、`src/lib/domain/meters/index.ts`、`src/lib/domain/delete-guards/index.ts` 已各自实现：
  - `Serializable`
  - `maxWait: 5000`
  - `timeout: 10000`
  - 基于 Prisma 写冲突码的有限重试
- `src/lib/transaction-manager.ts` 也提供了类似能力，但并未成为正式主链统一入口。
- 长期并存多套事务包装会导致：
  - 参数漂移
  - 重试规则不一致
  - 主链写路径难以审计

本阶段结论：

- 主链写事务默认继续采用 `Serializable + 有界重试`
- `P2034` 继续被视为统一写冲突重试码
- `phase10` 必须冻结“事务策略来源的单一承接位”，不再允许每个领域模块继续复制一份独立事务 helper

### 3.5 `phase09-06` legacy route inventory：直接成为 `phase10` 的排序输入
选择原因：

- `server/lib/legacy-route-inventory.ts` 已把旧 `src/app/api/*` 按：
  - `exit-evaluation`
  - `keep-compat`
  - `defer-unmigrated`
  明确分桶。
- 这些分桶已经直接映射到：
  - formal host 是否已冻结
  - compat wrapper 是否必须保留
  - 旧查询 helper 是否仍被依赖
- 若 `phase10` 不直接消费这个清单，就会重新回到“逐文件摸索”的旧状态。

本阶段结论：

- `phase10` 的数据访问分层优先级以 `phase09-06` inventory 为准
- `scripts/phase09-06-legacy-route-inventory.ts` 继续作为阶段验证输入
- 任何查询层保留/迁移判断都需要能回溯到 route inventory 对应 bucket

### 3.6 迁移兼容项：显式保留为兼容层，不冒充正式迁移链
选择原因：

- 当前 `migration_lock.toml` 仍指向 sqlite，而 `schema.prisma` 已切 PostgreSQL，这本身就是兼容残留。
- `scripts/migrate-and-seed.sh` 中的 `db push` 分支当前确实有现实作用，但它不能继续被表述成正式长期方案。
- 在未设计清楚 baseline、回滚与现网兼容前，贸然直接改 lock 文件也会放大部署风险。

本阶段结论：

- `migration_lock.toml`、旧迁移目录、`db push` 分支在 `phase10` 中统一被标记为“兼容项”
- 正式迁移主路径继续以 PostgreSQL 基线上的 `migrate deploy` 为目标
- `phase10` 先冻结存在原因、当前作用、风险、退出条件与回滚条件，不在本阶段直接完成最终切线

### 3.7 数据库约束与业务保留规则：继续分层表达
选择原因：

- `prisma/schema.prisma` 中多处 `onDelete: Cascade` 仍然存在，但这不代表业务允许物理删除。
- 当前真正保护历史保留的仍是：
  - `src/lib/domain/delete-guards/index.ts`
  - `src/lib/domain/billing/index.ts`
  - `src/lib/domain/meters/index.ts`
  - `src/lib/queries.ts` 的受限删除策略
- 若 `phase10` 误把“整理 schema/迁移链”理解成“业务删除规则已完成闭环”，会破坏上游阶段结论。

本阶段结论：

- 数据库约束、服务端业务门禁与历史保留原则继续分层表达
- `phase10` 只允许在文档中明确这三者的职责关系，不允许借 schema 收口放宽历史保留规则

## 四、承接资产与实现边界
### 4.1 允许直接承接的资产
- `src/lib/prisma.ts`
- `src/lib/transaction-manager.ts`
- `src/lib/queries.ts`
- `src/lib/optimized-queries.ts`
- `src/lib/dashboard-queries.ts`
- `src/lib/search-queries.ts`
- `src/lib/domain/contracts/index.ts`
- `src/lib/domain/billing/index.ts`
- `src/lib/domain/meters/index.ts`
- `src/lib/domain/delete-guards/index.ts`
- `server/lib/legacy-route-inventory.ts`
- `scripts/phase09-06-legacy-route-inventory.ts`
- `prisma/schema.prisma`
- `prisma/migrations/migration_lock.toml`
- `scripts/migrate-and-seed.sh`

### 4.2 允许做的事
- 为正式主链写路径冻结统一事务边界与重试策略
- 为主链与 compat/治理入口冻结 canonical read path
- 明确各查询 helper 的正式身份、保留原因与退出条件
- 明确 SQLite 残留、`db push` 分支与 PostgreSQL 正式迁移链之间的关系
- 为后续 `phase11` 提供稳定的数据访问与迁移链上游输入

### 4.3 暂不做的事
- 不新增新的主链领域服务迁移范围
- 不迁移完整 dashboard / 治理接口到正式宿主
- 不切换最终部署主线
- 不更换 ORM
- 不以清理 migration residue 为由放宽历史数据保留或删除门禁

## 五、目标结构
### 5.1 正式主链写路径承接位
`phase10` 中正式主链写路径继续冻结为：

```text
src/lib/domain/
├── contracts/
├── billing/
├── meters/
├── delete-guards/
└── shared/
```

### 5.2 查询层承接位
`phase10` 中查询层继续收口在以下现有目录，并补充正式身份标识：

```text
src/lib/
├── queries.ts
├── optimized-queries.ts
├── dashboard-queries.ts
├── search-queries.ts
├── global-settings.ts
└── health-checker.ts
```

### 5.3 迁移兼容层承接位
`phase10` 中迁移兼容层继续冻结为：

```text
prisma/
├── schema.prisma
└── migrations/
    └── migration_lock.toml

scripts/
└── migrate-and-seed.sh
```

### 5.4 旧宿主与 route inventory 承接位
- 旧 `src/app/api/*` 的阶段性去向继续由 `phase09-06` inventory 清单统一说明
- `server/lib/legacy-route-inventory.ts` 作为 route inventory 真相源保留
- `scripts/phase09-06-legacy-route-inventory.ts` 作为校验和分桶输出脚本保留

## 六、环境与契约口径
### 6.1 数据访问口径
- 正式主链写路径默认继续经过共享领域服务
- 正式主链查询、compat 查询与治理查询必须可区分
- 不允许再出现“运行时已切换到新宿主，但查询真相仍无法判断”的状态

### 6.2 事务口径
- 正式主链写事务默认要求：
  - Prisma 事务
  - `Serializable`
  - 有界 `P2034` 重试
  - 显式 `maxWait` / `timeout`
- array transaction 与 interactive transaction 的选用应以业务编排复杂度为准，但最终只能来自单一规范来源

### 6.3 迁移链口径
- PostgreSQL 是正式数据库主线
- `migrate deploy` 是正式迁移目标路径
- `db push` 仅是兼容兜底
- SQLite 残留在退出前必须被文档化为“兼容项”，而不是“当前最佳实践”

## 七、阶段结论
`phase10-data-access-and-migration-closure` 的阶段价值不在于“立即完成迁移链最终切线”或“重写全部查询层”，而在于：

```text
先把正式数据访问主线、查询分层、事务边界与迁移兼容项解释清楚，
再让后续实现、迁移和部署建立在单一数据访问真相之上。
```

这能确保：

- 不会让 legacy 查询层继续反向决定领域设计
- 不会让每个领域模块继续复制一套事务策略
- 不会把 `db push` 继续误读为正式 PostgreSQL 迁移链
- 不会在数据访问真相不清时提前进入部署切线
