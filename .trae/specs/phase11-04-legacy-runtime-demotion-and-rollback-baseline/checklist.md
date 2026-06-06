- [x] legacy 回滚资产集合完整，且 `docker-compose.yml`、`nginx/nginx.conf`、`scripts/cloud-deploy.sh`、`scripts/bootstrap-deploy-assets.sh`、`scripts/start-entry.mjs` 的路径均真实存在
- [x] `DEPLOYMENT.md` 已明确 legacy 容器化运行线只承担历史运行线与回滚基线职责，不再与正式主线混写
- [x] `README.md`、`AGENTS.md`、`architecture_map.md`、`project_rules.md`、`plan.md`、`DEPLOYMENT.md` 与 `docs/phase11_*` 对 legacy / 正式主线的描述一致
- [x] legacy 基线的保留条件、退出条件与不得继续扩写的边界已明确写清
- [x] `Rento-legacy` 的角色已固定为 GitHub 侧只读历史备份与对照参考，不是部署入口、回滚入口或第二真相源
- [x] 必要的文档与工程校验通过，且未引入新的实现漂移

## 验证备注
- 本轮独立复核已确认：`README.md`、`AGENTS.md`、`architecture_map.md`、`project_rules.md`、`plan.md`、`DEPLOYMENT.md` 与 `docs/phase11_*` 均使用“`phase11` 已进入已批准 spec 顺序实现、legacy 仅作为回滚基线”的单一口径。
- 本轮最小验证已再次执行：`git remote -v` 仅显示 `origin -> Rento-miniX`；`npm run audit:phase09:legacy-routes` 校验通过；legacy 资产路径与正式部署资产路径均已复核存在。
