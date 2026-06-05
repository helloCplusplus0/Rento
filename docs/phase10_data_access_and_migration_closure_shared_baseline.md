# Phase10 Data Access And Migration Closure Shared Baseline

## 当前状态
- `phase10` 的共享基线已完成当前轮产出，作为后续 `/spec` 的统一语义输入。
- 本文档直接建立在 `phase09` 已完成的共享领域服务、正式宿主、主链 smoke 路径与 legacy route inventory 之上。
- 本文档不替代 `architecture_plan` 的结构判断，也不替代 `dev_plan` 的任务拆分；它只负责冻结所有子任务必须共同遵守的边界与词汇。

## 一、文档目的
本文档用于冻结 `phase10-data-access-and-migration-closure` 的共享判断标准，避免后续子任务分别从查询层、事务层、迁移链或旧宿主视角出发，重新产出互相冲突的解释。

## 二、共享前提
- `phase01-restart-foundation-*` 已完成
- `phase02-auth-gate-*` 已完成
- `phase03-consistency-hardening-*` 已完成
- `phase04-performance-and-ops-*` 已完成
- `phase05-pwa-delivery-*` 已完成
- `phase06-minix-replatform` 已完成完整路线图、模块分类与真相源切换冻结
- `phase07-app-shell-and-runtime-foundation` 已完成新应用壳、新运行时入口与旧运行线映射冻结
- `phase08-api-and-auth-foundation` 已完成统一 API 宿主、认证门禁、中间件链、错误处理与最小页面守卫冻结
- `phase09-domain-service-migration` 已完成共享领域服务、正式宿主、主链 smoke 与 compat wrapper 清单收口
- 当前根级真相源已切换到 `phase10-data-access-and-migration-closure`
- `phase09-06` 已产出以下 `phase10` 直接输入：
  - `server/lib/legacy-route-inventory.ts`
  - `scripts/phase09-06-legacy-route-inventory.ts`

## 三、共享判断标准
- 默认优先冻结长期数据访问真相，而不是继续新增主链领域迁移。
- 默认优先让数据访问层服务 `phase09` 已冻结的业务语义，而不是反向定义领域边界。
- 默认优先把“正式主链查询 / legacy compat 查询 / 治理与脚本查询”分层写清，而不是追求一次性删光旧 helper。
- 默认优先把事务策略收口为单一来源，而不是允许每个领域模块继续复制自己的事务包装。
- 默认优先把 SQLite 残留、`db push` 兜底与 PostgreSQL 正式迁移目标解释清楚，而不是在未冻结回滚条件前贸然切线。
- 默认继续保持低复杂度、单仓库、单主线、单一真相源。

## 四、共享输入清单
### 4.1 正式上游输入
- `src/lib/prisma.ts`
- `src/lib/transaction-manager.ts`
- `src/lib/domain/contracts/index.ts`
- `src/lib/domain/billing/index.ts`
- `src/lib/domain/meters/index.ts`
- `src/lib/domain/delete-guards/index.ts`
- `src/lib/queries.ts`
- `src/lib/optimized-queries.ts`
- `src/lib/dashboard-queries.ts`
- `src/lib/search-queries.ts`
- `src/lib/global-settings.ts`
- `src/lib/health-checker.ts`
- `prisma/schema.prisma`
- `prisma/migrations/migration_lock.toml`
- `scripts/migrate-and-seed.sh`

### 4.2 `phase09-06` 直接输入
- `server/lib/legacy-route-inventory.ts`
  - 提供 `exit-evaluation`、`keep-compat`、`defer-unmigrated` 三类输入桶
- `scripts/phase09-06-legacy-route-inventory.ts`
  - 提供旧 `src/app/api/*` 清单覆盖校验、formal host / domain service 引用校验和分桶统计输出

### 4.3 顶层治理输入
- `AGENTS.md`
- `project_rules.md`
- `plan.md`
- `architecture_map.md`
- `docs/phase10_data_access_and_migration_closure_architecture_plan.md`
- `docs/phase10_data_access_and_migration_closure_dev_plan.md`

## 五、统一方案语义
### 5.1 正式数据访问主线
- 正式数据访问主线固定为：`Prisma + PostgreSQL`
- `src/lib/prisma.ts` 固定为 Prisma Client 单例入口
- `phase10` 不引入第二套 ORM、Repository 框架或平行数据访问技术栈

### 5.2 正式主链写路径
- 正式主链写路径继续固定在 `src/lib/domain/*`
- 合同、账单、抄表、退租结算、删除门禁等跨聚合写操作，不回流到旧 `src/app/api/*` 或通用查询 helper
- 数据访问层的职责是为共享领域服务提供统一事务和访问约束，而不是替换领域服务

### 5.3 查询分类共享词汇
- 正式主链查询
  - 服务正式宿主、主链页面和主链回查
  - 允许位于现有 `queries.ts` / `optimized-queries.ts` 中，但必须有明确正式身份
- legacy compat 查询
  - 服务 `src/app/api/*` 中仍保留的 compat wrapper 或未切流入口
  - 必须能回溯到 `phase09-06` inventory 中的 bucket
- 治理/脚本查询
  - 服务 dashboard、repair、validation、consistency、health 子路径等辅助入口
  - 不得反向成为正式主链的数据访问真相源

### 5.4 route inventory 共享语义
- `exit-evaluation`
  - 表示正式宿主已冻结，`phase10` 应优先评估旧入口和其依赖查询层是否可退出
- `keep-compat`
  - 表示旧入口仍承担 compat wrapper 职责，`phase10` 不得直接删除
- `defer-unmigrated`
  - 表示旧入口仍属于未迁移存量接口或治理入口，`phase10` 需要先明确查询层归属，再决定后续阶段策略

## 六、事务边界共享口径
### 6.1 默认事务策略
- 正式主链写事务默认要求：
  - Prisma 事务
  - `Serializable`
  - 有界 `P2034` 重试
  - 显式 `maxWait`
  - 显式 `timeout`

### 6.2 默认参数口径
- 当前共享默认值以仓库现状和 Context7 核验结果为准：
  - `maxWait: 5000`
  - `timeout: 10000`
  - `isolationLevel: Prisma.TransactionIsolationLevel.Serializable`
- 后续 `/spec` 若要调整这些值，必须给出明确的仓库内证据和验证路径

### 6.3 单一承接位要求
- `phase10` 必须冻结单一事务策略来源
- 允许的结果是：
  - 统一复用 `src/lib/transaction-manager.ts`
  - 或在该文件基础上提炼更轻量的共享事务 helper
- 不允许的结果是：
  - `contracts`、`billing`、`meters`、`delete-guards` 各自继续长期维护一份独立事务包装

### 6.4 array transaction / interactive transaction 口径
- array transaction 适用于简单、顺序明确的批量写操作
- interactive transaction 适用于跨聚合业务编排、条件判断与分支控制较多的主链写路径
- 无论采用哪种方式，最终参数和重试规则都只能来自同一共享规范来源

## 七、迁移链共享口径
### 7.1 正式与兼容路径
- PostgreSQL 是正式数据库主线
- `migrate deploy` 是正式迁移目标路径
- `db push` 仅是兼容兜底
- SQLite 残留在退出前必须被明确标记为“兼容项”

### 7.2 当前兼容项
- `prisma/migrations/migration_lock.toml` 仍指向 sqlite
- `scripts/migrate-and-seed.sh` 在特定条件下仍走 `db push`
- 这些都代表“当前仍需解释并治理的兼容残留”，不是当前最佳实践

### 7.3 禁止误读
- 不得把 `db push` 重新包装成正式 PostgreSQL 迁移链
- 不得把 `migration_lock.toml` 的 SQLite 残留误读成“仓库仍允许 SQLite 主路径”
- 不得在未冻结 baseline、退出条件和回滚条件前直接修改历史锁文件

## 八、业务保留与删除门禁共享口径
### 8.1 合同锚点
- `Contract` 继续是租务事实主锚点
- 数据访问层不得绕开合同锚点重塑账单、退租、续租、抄表关系

### 8.2 多仪表与历史保留
- `Meter` 继续视为独立资产
- `MeterReading`、`Bill`、`BillDetail` 的历史记录继续优先保留
- 数据访问层不得为了收口而回退成单仪表主真相

### 8.3 删除门禁
- 数据库级 `Cascade` 不等于业务授权删除
- 服务端删除门禁、终止/归档/停用/解绑策略继续优先于数据库便利性
- `phase10` 不允许借 schema/迁移收口放宽历史保留规则

## 九、允许路线
- 允许继续复用现有 `src/lib/prisma.ts` 和 `src/lib/transaction-manager.ts` 作为数据访问与事务规范候选承接位
- 允许保留 `src/lib/queries.ts`、`src/lib/optimized-queries.ts`、`src/lib/dashboard-queries.ts`、`src/lib/search-queries.ts`
  但必须补充正式身份、保留原因与退出条件
- 允许把 `phase09-06` inventory 直接嵌入 `phase10` 文档、脚本和后续 `/spec` 验证要求
- 允许在文档中显式承认 SQLite 迁移残留和 `db push` 兼容兜底的现实存在

## 十、禁止路线
- 禁止在 `phase10` 中直接新增新的主链领域迁移范围
- 禁止在 `phase10` 中切换最终部署主线
- 禁止在 `phase10` 中引入第二套 ORM 或平行 DAL
- 禁止让治理/脚本查询反向成为正式主链数据真相
- 禁止把 legacy 查询层继续视为“默认正式入口”
- 禁止把 schema 的 `onDelete: Cascade` 视为业务删除授权

## 十一、统一验证要求
- 至少确认：
  - `docs/phase10_data_access_and_migration_closure_architecture_plan.md`
  - `docs/phase10_data_access_and_migration_closure_shared_baseline.md`
  - `docs/phase10_data_access_and_migration_closure_dev_plan.md`
  三份文档已齐备并互相引用一致
- 至少确认顶层真相源已与三份 `docs/phase10_*` 的状态一致
- 至少确认 `phase09-06` inventory 在 `phase10` 文档中已被显式当作直接输入
- 至少确认事务默认口径、查询分类、迁移兼容项身份和禁止路线已形成单一判断标准

## 十二、阶段结论
`phase10-data-access-and-migration-closure` 的共享基线价值不在于“立刻重写全部查询层”或“立刻完成最终迁移链切线”，而在于：

```text
先把正式数据访问主线、查询分类、事务边界和迁移兼容项的共享词汇冻结，
再让后续 /spec 和实现建立在单一数据访问真相之上。
```

这能确保：
- 不让 legacy 查询层继续反向决定领域设计
- 不让每个领域模块继续复制一套事务策略
- 不把 `db push` 误读为正式 PostgreSQL 迁移链
- 不在数据访问真相不清时提前进入部署切线
