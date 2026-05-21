# Tasks

- [x] Task 1: 冻结迁移兼容项基线
  - [x] SubTask 1.1: 审视 `prisma/migrations/migration_lock.toml` 的当前内容与历史角色
  - [x] SubTask 1.2: 审视 `scripts/migrate-and-seed.sh` 中 SQLite 兼容分支的触发条件与当前作用
  - [x] SubTask 1.3: 明确哪些内容属于“当前主线”，哪些内容属于“历史兼容项”

- [x] Task 2: 收口脚本与迁移说明口径
  - [x] SubTask 2.1: 为 `scripts/migrate-and-seed.sh` 补最小注释或说明，明确兼容分支用途
  - [x] SubTask 2.2: 保证脚本中的迁移路径描述与当前 PostgreSQL 主线口径一致
  - [x] SubTask 2.3: 明确当前阶段不直接重建迁移基线、不切断 `db push` 兼容分支

- [x] Task 3: 更新文档中的兼容项说明
  - [x] SubTask 3.1: 在 `architecture_map.md` 标注迁移兼容项、当前作用与风险边界
  - [x] SubTask 3.2: 同步 `README.md`、`DEPLOYMENT.md`、`ENVIRONMENT_GUIDE.md` 与 `.env.example` 的迁移说明
  - [x] SubTask 3.3: 保证文档与脚本对“兼容项不是当前推荐路径”的表达一致

- [x] Task 4: 冻结正式退出条件
  - [x] SubTask 4.1: 为 `migration_lock.toml` 兼容现状定义退出前置条件
  - [x] SubTask 4.2: 为 `sqlite -> db push` 兼容分支定义退出前置条件与专项治理入口
  - [x] SubTask 4.3: 将退出条件写成后续可直接复用的上游输入

- [x] Task 5: 验证迁移兼容口径一致性
  - [x] SubTask 5.1: 执行 `npm run lint`
  - [x] SubTask 5.2: 执行 `npm run type-check`
  - [x] SubTask 5.3: 执行一条口径校验脚本，确认 `scripts/migrate-and-seed.sh`、`architecture_map.md`、`DEPLOYMENT.md`、`ENVIRONMENT_GUIDE.md` 与 `.env.example` 都显式包含 `migration_lock.toml` / `db push` / PostgreSQL 主线说明

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 2
- Task 5 depends on Task 3
- Task 5 depends on Task 4
