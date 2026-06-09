# Tasks

- [x] 任务 1：复核 `phase16-04` 的输入证据与当前轮边界
  - [x] 子任务 1.1：对照 `phase16-01 ~ phase16-03` 结果、`DEPLOYMENT.md` 与 legacy 资产清单，确认本轮只冻结 legacy-exit 决策与 root sync
  - [x] 子任务 1.2：确认正式人工 HTTPS 验收、正式部署演练与 legacy 回滚演练仍待云端执行
  - [x] 子任务 1.3：确认本轮不删除 legacy 资产、不伪造云端证据

- [x] 任务 2：冻结 legacy 资产退出顺序与保留条件
  - [x] 子任务 2.1：盘点 `docker-compose.yml`、`nginx/nginx.conf`、`scripts/cloud-deploy.sh`、`scripts/bootstrap-deploy-assets.sh`、`scripts/start-entry.mjs` 的当前职责
  - [x] 子任务 2.2：明确哪些资产继续保留为 rollback-only 基线，哪些仅满足后续归档或退出前提
  - [x] 子任务 2.3：把 legacy 资产退出顺序、保留条件与回滚窗口回写到 `docs/phase16_*` 与 `DEPLOYMENT.md`

- [x] 任务 3：冻结 `phase16` 当前轮最终结论
  - [x] 子任务 3.1：基于当前证据判断 `phase16` 当前轮应为“通过”还是“未通过但单值化”
  - [x] 子任务 3.2：将最终结论与原因回写到 `docs/phase16_*`
  - [x] 子任务 3.3：明确后续只有在真实云服务器补齐证据后，才允许重新判断最终通过结论

- [x] 任务 4：同步根级真相源
  - [x] 子任务 4.1：同步 `README.md`、`AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md`、`architecture_map.md`
  - [x] 子任务 4.2：确保根级真相源与 `docs/phase16_*` 对 rollback-only 资产、退出条件与当前轮结论保持一致
  - [x] 子任务 4.3：确认没有把“待云端执行”误写成“已完成通过”

- [x] 任务 5：完成 `phase16-04` 文档验收与交接
  - [x] 子任务 5.1：复核 `docs/phase16_*`、`DEPLOYMENT.md` 与根级真相源的口径一致
  - [x] 子任务 5.2：确认 `phase16` 当前轮最终结论、legacy 资产保留边界与后续入口均已单值化
  - [x] 子任务 5.3：确认本子任务可作为后续真实云服务器验收后的最终复判入口

# Task Dependencies
- 任务 2 依赖任务 1
- 任务 3 依赖任务 2
- 任务 4 依赖任务 3
- 任务 5 依赖任务 4
