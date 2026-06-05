# Phase10-04 Closure

## 1. 收口结论
- `Rento-miniX` 的唯一正式数据库主线已经冻结为 PostgreSQL。
- `prisma/schema.prisma` 中的 `provider = "postgresql"` 是当前正式数据库真相。
- `prisma/migrations/migration_lock.toml` 仍保留 `provider = "sqlite"`，但它只代表历史迁移链残留，不代表仓库仍正式支持 SQLite。
- `scripts/migrate-and-seed.sh` 继续保留 `db push` 分支；由于脚本会先检查 `migration_lock.toml`，当前仓库默认执行仍会先命中 `sqlite -> db push` compat path。
- PostgreSQL 基线上的 `prisma migrate deploy` 已冻结为正式迁移目标，但“正式目标已冻结”不等于“当前默认执行已经切到该路径”。

## 2. 兼容项矩阵
| 项目 | 当前状态 | 存在原因 | 当前作用 | 风险 | 退出条件 | 回滚条件 |
| --- | --- | --- | --- | --- | --- | --- |
| `prisma/schema.prisma` | `provider = "postgresql"` | 运行时数据库主线已切到 PostgreSQL | 作为正式数据库 provider 真相源 | 若与迁移历史继续分裂，后续部署会误读正式迁移路径 | PostgreSQL baseline 与正式迁移链完成治理后继续保留为正式真相 | 保持 PostgreSQL provider，不回退到 SQLite |
| `prisma/migrations/migration_lock.toml` | `provider = "sqlite"` | 迁移目录仍保留历史 SQLite 时代状态 | 保留现有迁移链历史事实 | 易被误读为仓库仍支持 SQLite，或被误当成当前最佳实践 | 完成 PostgreSQL baseline / resolve 验证，并确认不破坏现有部署后，再进入专项整改 | 在专项整改失败时继续保留该锁文件现状，避免未验证改写放大风险 |
| `scripts/migrate-and-seed.sh` 中的 `db push` 分支 | 已保留，且当前默认执行仍先命中该分支 | 旧迁移链尚未完成 PostgreSQL 基线收口，`migration_lock.toml` 仍保留 sqlite provider | 为 PostgreSQL 环境提供 schema 同步兼容兜底，并作为当前默认执行路径 | 继续存在会让团队误把 `db push` 当成长期正式迁移链，或误判仓库已完成 `migrate deploy` 切线 | 完成 PostgreSQL baseline / resolve 验证、消除脚本对 sqlite lock 的前置命中，并完成部署脚本、备份、回滚链路复核 | 暂时保留该兼容分支，作为 PostgreSQL 现网保底路径 |

## 3. 正式 / 兼容边界
- 正式数据库：PostgreSQL。
- 非正式残留：SQLite，仅存在于迁移兼容治理语境。
- 正式迁移路径：`prisma migrate deploy`。
- 兼容兜底路径：`prisma db push`，仅在历史 lock 残留或正式迁移链暂未完成 PostgreSQL baseline 收口时使用。
- 当前默认执行路径：由于脚本会先检测 `migration_lock.toml` 是否仍为 sqlite，现状下默认仍先进入 `sqlite -> db push` compat path，尚未完成向 `migrate deploy` 的默认切线。

## 4. 退出前提
- 完成 PostgreSQL baseline / resolve 方案与验证。
- 完成 `migration_lock.toml` 与脚本分支前置条件的专项治理，确保默认执行不再先命中 `sqlite -> db push` compat path。
- 证明 `migrate deploy` 能在目标环境稳定、重复执行。
- 复核部署脚本、备份流程与回滚操作，确认移除 `db push` 兼容分支后不会失去保底路径。
- 确认后续迁移专项不会越界改写 `phase09` 已冻结的共享领域服务边界与历史保留规则。

## 5. 当前回滚基线
- 不修改 `migration_lock.toml`。
- 保留 `scripts/migrate-and-seed.sh` 的兼容分支。
- 继续以 PostgreSQL 作为唯一运行时数据库。
- 默认继续接受“脚本先命中 `sqlite -> db push` compat path”的现状，作为当前未切线前的回滚基线。
- 若正式迁移链专项验证失败，回到“保留现状 lock 残留 + 兼容脚本兜底”的当前基线。

## 6. 外部口径核验
- Prisma 官方文档将 `prisma migrate deploy` 定位为 staging / production 等非开发环境应用待执行迁移的命令。
- Prisma 官方文档将 `db push` 定位为快速原型或兼容同步路径，不建议把它当作长期正式迁移链。
- 因此，本次 `phase10-04` 采用“`migrate deploy` 为正式目标，`db push` 为兼容兜底”的口径与官方迁移模型一致。

## 7. 本次边界
- 已做：冻结语义、补脚本注释、同步 phase10/phase03 文档、收口 spec 结论。
- 未做：修改 `migration_lock.toml`、重建迁移链、执行生产切线。
