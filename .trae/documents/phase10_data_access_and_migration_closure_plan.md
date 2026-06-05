# Phase10 Data Access And Migration Closure 计划

## 1. Summary
- 目标：完成 `phase10-data-access-and-migration-closure` 的阶段级 `/plan` 产出，冻结长期数据访问层方案、查询分层、事务边界、迁移兼容项与退出条件，并为后续 `/spec` 提供可直接执行的拆分顺序。
- 直接上游输入必须显式消费：
  - `server/lib/legacy-route-inventory.ts`
  - `scripts/phase09-06-legacy-route-inventory.ts`
- 当前阶段只做规划与文档冻结，不做新的主链实现迁移，不切换最终部署主线，不修改 Prisma schema 或历史迁移锁。
- 本计划基于仓库现状而不是假设：顶层真相源已切到 `phase10`，三份 `docs/phase10_*` 已全部产出；本文记录本轮如何完成这些交付并冻结后续 `/spec` 顺序。

## 2. Goal And Success Criteria
### 2.1 目标
- 为 `phase10` 产出完整阶段文档集：
  - `docs/phase10_data_access_and_migration_closure_architecture_plan.md`
  - `docs/phase10_data_access_and_migration_closure_shared_baseline.md`
  - `docs/phase10_data_access_and_migration_closure_dev_plan.md`
- 复核并按需同步顶层真相源，使其与 `phase10` 阶段文档状态一致：
  - `AGENTS.md`
  - `plan.md`
  - `architecture_map.md`
  - `project_rules.md`
- 冻结后续 `/spec` 的顺序、范围、DoD 和验证口径，避免 `phase10` 在实现时重新做架构判断。

### 2.2 成功标准
- 数据访问主线明确为 `Prisma + PostgreSQL`，且文档中不再留有“可能切换第二套 ORM / Repository”的悬而未决表述。
- 正式主链写路径、正式主链查询、legacy compat 查询、治理/脚本查询四类职责均有清晰边界。
- `Serializable + P2034 有界重试` 被冻结为主链写事务默认策略，并指定唯一承接位候选，不允许领域模块继续各自复制事务包装。
- `migration_lock.toml`、`db push` 分支、PostgreSQL 正式迁移目标之间的关系、风险、退出条件和回滚条件明确。
- `phase09-06` route inventory 被直接写入 `phase10` 文档，不再只是“参考阅读材料”。
- 阶段文档完成后可以停在“待审核”状态；审核通过前不进入 `/spec` 或实现。

## 3. Current State Analysis
### 3.1 已确认的真相源状态
- `plan.md` 已把 `phase10` 标记为“已完成阶段级文档产出，待审核”，说明根级阶段状态已经切换。
- `AGENTS.md`、`architecture_map.md`、`project_rules.md` 已同步到 `phase10` 入口语义，并明确后续 `/spec` 应直接消费 `phase09-06` inventory。
- `docs/phase10_data_access_and_migration_closure_architecture_plan.md` 已存在，内容已经覆盖：
  - `Prisma + PostgreSQL` 主线判断
  - 查询分层
  - 事务边界
  - legacy route inventory 直接输入
  - 迁移兼容项与退出条件
- 当前阶段文档已齐备：
  - `docs/phase10_data_access_and_migration_closure_architecture_plan.md`
  - `docs/phase10_data_access_and_migration_closure_shared_baseline.md`
  - `docs/phase10_data_access_and_migration_closure_dev_plan.md`

### 3.2 已确认的实现事实
- Prisma 单例入口是 `src/lib/prisma.ts`。
- 仓库存在独立事务管理器 `src/lib/transaction-manager.ts`，默认值为：
  - `maxWait: 5000`
  - `timeout: 10000`
  - `isolationLevel: Serializable`
  - `P2034` 视为可重试死锁/写冲突
- `src/lib/domain/contracts/index.ts`
- `src/lib/domain/billing/index.ts`
- `src/lib/domain/meters/index.ts`
- `src/lib/domain/delete-guards/index.ts`
  当前都仍内置各自的 `runWithSerializableTransaction` 或同类事务包装，说明事务策略虽已趋同，但承接位仍未统一。
- 查询层明显分散在：
  - `src/lib/queries.ts`
  - `src/lib/optimized-queries.ts`
  - `src/lib/dashboard-queries.ts`
  - `src/lib/search-queries.ts`
- `src/lib/queries.ts` 不是纯读层，仍混有：
  - 创建/更新逻辑
  - 事务操作
  - 删除限制错误
- `src/lib/optimized-queries.ts` 承担分页、筛选、统计和部分原生 SQL 排序。
- `server/lib/legacy-route-inventory.ts` 已定义 `exit-evaluation`、`keep-compat`、`defer-unmigrated` 三类 `phase10` 输入桶。
- `scripts/phase09-06-legacy-route-inventory.ts` 可验证旧 `src/app/api/*` 是否被 inventory 全量覆盖，并输出 `phase10` 输入分桶统计。
- `prisma/schema.prisma` 当前 `datasource` 已固定为 `postgresql`，但仍有多处 `onDelete: Cascade`。
- `prisma/migrations/migration_lock.toml` 仍为 `provider = "sqlite"`。
- `scripts/migrate-and-seed.sh` 当前逻辑是：
  - 命中 SQLite 残留锁时直接走 `db push`
  - 否则优先 `migrate deploy`
  - `migrate deploy` 失败时仍可回退到 `db push`

### 3.3 Context7 最新口径
- 已通过 Context7 获取 Prisma 最新文档信息，并确认：
  - interactive transaction 支持 `maxWait`、`timeout`、`Serializable`
  - Prisma 官方建议在 `Serializable` 下对 `P2034` 进行有限重试
  - 生产/CI 场景推荐 `prisma migrate deploy`
  - `db push` 更适合作为开发或兼容同步路径，而不是长期正式迁移链

## 4. Scope
### 4.1 In Scope
- 完成 `phase10` 阶段文档集。
- 复核并按需修正 `phase10` 相关顶层真相源表述。
- 把 `phase09-06` inventory 变成 `phase10` 文档和后续 `/spec` 的直接输入。
- 冻结 `/spec` 拆分顺序、DoD、验证命令与回滚/退出口径。

### 4.2 Out Of Scope
- 不直接迁移 dashboard、治理接口或未迁移 CRUD 到 Hono 正式宿主。
- 不在本阶段修改 `prisma/schema.prisma`、`migration_lock.toml` 或历史 migration 内容。
- 不在本阶段引入 Repository 模式、Drizzle、Kysely 或其他第二套数据访问框架。
- 不切换最终部署主线，不处理 `phase11` 的部署切线。
- 不放宽历史保留、删除门禁与合同锚点等已冻结业务规则。

## 5. Assumptions And Decisions
### 5.1 已冻结决策
- 正式数据访问主线继续固定为 `Prisma + PostgreSQL`。
- 正式主链写路径继续以 `src/lib/domain/*` 为承接位，不反向回流到旧 `src/app/api/*` 或通用 query helper。
- `phase10` 的核心不是“删光旧查询”，而是冻结 canonical read path 与兼容债务边界。
- `phase09-06` inventory 是 `phase10` 的排序输入，不是可选参考。
- `db push` 只能被定义为显式兼容兜底；正式迁移目标仍是 PostgreSQL 基线上的 `migrate deploy`。

### 5.2 执行时必须保持的约束
- 任何关于删除、历史保留、账务语义的文档判断，必须服从 `project_rules.md` 与 `phase09` 已冻结结论。
- 任何事务边界方案都不能重新把主链业务规则下沉回路由层。
- 任何查询分类都必须能回溯到“服务谁、为什么保留、何时退出”。
- 任何迁移兼容说明都必须区分：
  - 当前存在原因
  - 现实使用场景
  - 风险
  - 退出条件
  - 回滚条件

## 6. Proposed Changes
### 6.1 计划文件本身
- 文件：`.trae/documents/phase10_data_access_and_migration_closure_plan.md`
- 变更：作为本轮 `/plan` 的唯一实施蓝图，供后续执行者直接遵循。
- 原因：用户已要求去重为单一计划文件，避免 `phase10` 计划真相源分叉。

### 6.2 完成 `phase10` 架构文档
- 文件：`docs/phase10_data_access_and_migration_closure_architecture_plan.md`
- 处理方式：
  - 以现有文档为基础做补充和收口，不重写整体结构。
  - 确认文中显式引用以下真实输入：
    - `src/lib/prisma.ts`
    - `src/lib/transaction-manager.ts`
    - `src/lib/queries.ts`
    - `src/lib/optimized-queries.ts`
    - `src/lib/dashboard-queries.ts`
    - `src/lib/search-queries.ts`
    - `src/lib/global-settings.ts`
    - `src/lib/health-checker.ts`
    - `server/lib/legacy-route-inventory.ts`
    - `scripts/phase09-06-legacy-route-inventory.ts`
    - `prisma/schema.prisma`
    - `prisma/migrations/migration_lock.toml`
    - `scripts/migrate-and-seed.sh`
  - 如果已有内容已覆盖，则仅补充缺失的证据链和互链。
- 结果要求：
  - 文档成为 `phase10` “为什么这样定”的唯一解释层。

### 6.3 新增 `phase10` 共享基线文档
- 文件：`docs/phase10_data_access_and_migration_closure_shared_baseline.md`
- 必须包含的内容：
  - `phase09` 上游冻结资产清单
  - `phase10` 直接输入清单
  - 查询分类共享词汇表：
    - 正式主链写路径
    - 正式主链查询
    - legacy compat 查询
    - 治理/脚本查询
  - 事务边界共享口径：
    - 默认隔离级别
    - `maxWait`
    - `timeout`
    - `P2034` 重试
    - 单一承接位候选
  - route inventory 与查询分类的映射规则
  - `db push` / `migrate deploy` / SQLite 残留的共享语义
  - 不可越界事项与回滚边界
- 原因：
  - `phase10` 的真正难点是跨文档共享词汇和边界，如果没有 shared baseline，后续 `/spec` 很容易出现不同子任务使用不同口径。

### 6.4 新增 `phase10` 开发计划文档
- 文件：`docs/phase10_data_access_and_migration_closure_dev_plan.md`
- 必须把 `/spec` 顺序冻结为以下子任务：
  - `phase10-01-data-access-inventory-and-query-role-classification`
    - 盘点现有 query helper、正式写路径、旧宿主依赖点
    - 为每一类入口标注正式/兼容/治理身份
  - `phase10-02-transaction-boundary-unification-baseline`
    - 统一事务默认参数、重试规则和唯一承接位
    - 明确领域模块如何消费统一事务策略
  - `phase10-03-canonical-read-path-and-compat-query-closure`
    - 冻结 canonical read path
    - 明确 `queries.ts`、`optimized-queries.ts`、dashboard/search 查询的长期定位
  - `phase10-04-migration-compatibility-and-exit-conditions`
    - 冻结 SQLite 残留、`migration_lock.toml`、`db push` 分支的存在原因、风险和退出条件
  - `phase10-05-documentation-consistency-and-verification-closure`
    - 收口真相源、一致性复核、验收命令与后续 `phase11` 上游输入
- 每个子任务必须包含：
  - 范围
  - 非目标
  - 输入文件
  - 产出文件
  - DoD
  - 验证要求
  - 回滚/退出条件

### 6.5 顶层真相源按需复核
- 文件：
  - `AGENTS.md`
  - `plan.md`
  - `architecture_map.md`
  - `project_rules.md`
- 处理方式：
  - 逐项核对是否已准确指向三份 `docs/phase10_*`。
  - 仅在发现漂移时修正文案；若现状已一致，则不做无意义改动。
- 原因：
  - 当前这些文件大体已切到 `phase10`，但新增 `dev_plan` 与 `shared_baseline` 后仍需最终确认链接、状态和下一步口径没有遗漏。

### 6.6 为 `phase11` 冻结最小上游输入
- 文件：
  - `docs/phase10_data_access_and_migration_closure_architecture_plan.md`
  - `docs/phase10_data_access_and_migration_closure_shared_baseline.md`
  - `docs/phase10_data_access_and_migration_closure_dev_plan.md`
- 需要显式冻结的最小上游输入：
  - 长期数据访问层方案判断
  - 正式/兼容/治理查询分层与 canonical read path 判断
  - 统一事务边界与单一策略来源
  - SQLite 兼容残留、`db push` 兜底与 `migrate deploy` 正式目标的职责边界
  - 与 `phase09-06` legacy route inventory 对齐后的退出/保留判断
- 原因：
  - `phase10-05` 需要收口的不只是当前阶段文档齐备，还包括把后续部署切线真正依赖的数据访问真相冻结为可直接继承的输入，避免 `phase11` 再回头重做数据访问层架构判断。

## 7. Execution Order
1. 复读本计划文件，作为执行期间唯一蓝图。
2. 复核现有 `docs/phase10_data_access_and_migration_closure_architecture_plan.md`，只补齐证据链、互链和缺漏，不推翻已写结构。
3. 编写 `docs/phase10_data_access_and_migration_closure_shared_baseline.md`，先冻结共享词汇和边界。
4. 编写 `docs/phase10_data_access_and_migration_closure_dev_plan.md`，把 `/spec` 拆分顺序、DoD 与验证口径冻结。
5. 回头复核 `AGENTS.md`、`plan.md`、`architecture_map.md`、`project_rules.md` 是否需要最小同步。
6. 进行文档一致性校验，确认 `phase10` 已处于“阶段级文档齐备，待审核”的稳定状态。
7. 完成本轮阶段规划交付。

## 8. Verification Steps
### 8.1 文档一致性验证
- 检查 `AGENTS.md`、`plan.md`、`architecture_map.md`、`project_rules.md` 与 `docs/phase10_*` 的阶段状态一致。
- 检查 `docs/phase10_*` 之间是否互相引用正确。
- 检查所有被引用的真实代码/脚本路径在仓库中存在。

### 8.2 技术事实验证
- 对照以下文件确认阶段文档没有虚构实现：
  - `src/lib/prisma.ts`
  - `src/lib/transaction-manager.ts`
  - `src/lib/domain/contracts/index.ts`
  - `src/lib/domain/billing/index.ts`
  - `src/lib/domain/meters/index.ts`
  - `src/lib/domain/delete-guards/index.ts`
  - `src/lib/queries.ts`
  - `src/lib/optimized-queries.ts`
  - `src/lib/global-settings.ts`
  - `src/lib/health-checker.ts`
  - `prisma/schema.prisma`
  - `prisma/migrations/migration_lock.toml`
  - `scripts/migrate-and-seed.sh`

### 8.3 执行完成后的命令验证
- `npm run audit:phase09:legacy-routes`
- `npm run lint`
- `npm run type-check`
- 如后续 `/spec` 涉及主链行为变动，再补充：
  - `npm run smoke:phase09:all`

## 9. Risks And Mitigations
- 风险：把 `phase10` 写成“新建一套数据访问架构”。
  - 缓解：文档必须明确本阶段是收口，不是重造；不引入第二套 ORM/Repository。
- 风险：把查询分类误写成“立刻删除旧 helper”。
  - 缓解：明确过渡期允许同文件存在多类职责，但必须标识身份、保留原因和退出条件。
- 风险：把 `db push` 重新描述成正式主路径。
  - 缓解：所有文档统一标记为兼容兜底，并把正式迁移目标写为 `migrate deploy`。
- 风险：把 schema 的 `onDelete: Cascade` 误读成业务允许级联删除。
  - 缓解：文档必须重申业务删除门禁优先于数据库级联便利性。

## 10. Ready Output
- 本轮 `/plan` 完成后，仓库应至少具备：
  - 一份单一真相源的 `phase10` plan file
  - 三份齐备的 `docs/phase10_*`
  - 与之匹配的顶层真相源状态
  - 已明确供 `phase11` 直接继承的最小上游输入清单
