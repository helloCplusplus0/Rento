# Tasks
- [x] Task 1: 复核正式环境变量、健康检查与迁移入口的当前真实承接位。
  - [x] SubTask 1.1: 核对 `.env.example`、`server/lib/env.ts`、`scripts/start-minix.mjs`，确认正式运行时实际读取的变量矩阵
  - [x] SubTask 1.2: 核对 `server/routes/health.ts` 与 `scripts/health-check.sh`，确认 `/api/health` 继续作为唯一主健康入口
  - [x] SubTask 1.3: 核对 `scripts/migrate-and-seed.sh` 与 `docs/phase10_data_access_and_migration_closure_shared_baseline.md`，确认 `migrate deploy` / `db push` 边界原样继承

- [x] Task 2: 升级正式共享环境模板与健康检查脚本口径。
  - [x] SubTask 2.1: 更新 `.env.example`，收口为 `Rento-miniX` 正式部署主线变量矩阵
  - [x] SubTask 2.2: 更新 `scripts/health-check.sh` 的默认推导和说明，确保与 `NEXTAUTH_URL`、`MINIX_SERVER_PORT`、`/api/health` 口径一致
  - [x] SubTask 2.3: 保持 `server/lib/env.ts` 的实现契约不被反向改坏，必要时只做最小同步说明性调整

- [x] Task 3: 同步部署说明、阶段文档与发布门禁，形成单一解释。
  - [x] SubTask 3.1: 更新 `DEPLOYMENT.md`，写清正式变量矩阵、主健康入口、迁移入口与最低发布门禁
  - [x] SubTask 3.2: 更新 `README.md`、`architecture_map.md` 与 `docs/phase11_deployment_cutover_and_cutline_closure_*`，保持与实现一致
  - [x] SubTask 3.3: 明确 legacy 容器化模板变量不再作为正式共享模板，但 `phase10` 迁移兼容边界继续保留

- [x] Task 4: 验证环境模板、健康检查与发布门禁口径无漂移。
  - [x] SubTask 4.1: 复核变量名、脚本路径、文档路径与健康入口真实存在
  - [x] SubTask 4.2: 运行 `npm run lint`、`npm run type-check`
  - [x] SubTask 4.3: 以最小方式验证 `scripts/health-check.sh` 的默认目标和 `migrate-and-seed.sh` 的 phase10 兼容边界说明

# Task Dependencies
- `Task 2` depends on `Task 1`
- `Task 3` depends on `Task 2`
- `Task 4` depends on `Task 2` and `Task 3`
