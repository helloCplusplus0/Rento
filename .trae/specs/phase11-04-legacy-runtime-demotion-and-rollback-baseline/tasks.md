# Tasks
- [x] Task 1: 盘点 legacy 回滚资产集合与当前真实边界。
  - [x] SubTask 1.1: 复核 `docker-compose.yml`、`nginx/nginx.conf`、`scripts/cloud-deploy.sh`、`scripts/bootstrap-deploy-assets.sh`、`scripts/start-entry.mjs` 的存在性与当前职责
  - [x] SubTask 1.2: 复核 `README.md`、`DEPLOYMENT.md`、`AGENTS.md`、`architecture_map.md`、`project_rules.md` 对 legacy / 正式主线的当前表述
  - [x] SubTask 1.3: 复核 `Rento-legacy` 在根级真相源中的角色描述，确认未被重新引入为 remote、部署入口或第二真相源

- [x] Task 2: 收口 legacy 回滚资产清单、职责边界与 cutline 条件。
  - [x] SubTask 2.1: 更新 `DEPLOYMENT.md`，明确 legacy 资产清单、保留条件、退出条件与不得继续扩写的边界
  - [x] SubTask 2.2: 更新 `README.md`、`AGENTS.md`、`architecture_map.md`、`project_rules.md`，对齐 legacy 与正式主线的单一解释
  - [x] SubTask 2.3: 更新 `docs/phase11_deployment_cutover_and_cutline_closure_*`，补齐 `phase11-04` 的收口结果与 cutline 退出条件

- [x] Task 3: 验证 legacy 表述已无漂移。
  - [x] SubTask 3.1: 复核所有 legacy 资产路径真实存在
  - [x] SubTask 3.2: 复核根级真相源与 `DEPLOYMENT.md` 的 legacy 表述一致
  - [x] SubTask 3.3: 运行必要的文档与工程校验，确保未引入新的实现漂移

- [x] Task 4: 修复 `phase11` 根级真相源状态漂移。
  - [x] SubTask 4.1: 更新 `plan.md`，把“`phase11` 阶段文档待审核、不得进入 `/spec`”的旧状态改为与当前已批准 spec 顺序实现一致
  - [x] SubTask 4.2: 复核 `plan.md` 与 `README.md`、`AGENTS.md`、`architecture_map.md`、`project_rules.md`、`DEPLOYMENT.md`、`docs/phase11_*` 的阶段状态表述，确认不再出现“待审核”与“已批准实现中”混写

# Task Dependencies
- `Task 2` depends on `Task 1`
- `Task 3` depends on `Task 2`
- `Task 4` depends on `Task 3`
