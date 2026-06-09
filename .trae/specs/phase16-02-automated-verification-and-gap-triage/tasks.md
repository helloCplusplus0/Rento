# Tasks

- [x] 任务 1：复核 `phase16-02` 的输入范围并冻结自动化验证边界
  - [x] 子任务 1.1：对照 `docs/phase16_*`、`phase16-01` spec 产物、`package.json` 与相关脚本，确认本子任务只覆盖固定自动化验证组合、结果记录与 gap triage
  - [x] 子任务 1.2：确认 `npm run lint`、`npm run type-check`、`npm run build:minix`、`npm run audit:phase09:legacy-routes`、`npm run smoke:phase09:all`、`npm run smoke:phase14:wave2`、`npm run build:minix:pwa`、`bash ./scripts/pwa-smoke-check.sh ...`、`bash ./scripts/health-check.sh ...` 全部纳入执行范围
  - [x] 子任务 1.3：确认本子任务不越界到人工 HTTPS 验收、正式部署演练、legacy 回滚演练或 legacy 退出最终结论

- [x] 任务 2：执行基础工程验证并记录结果
  - [x] 子任务 2.1：执行 `npm run lint`
  - [x] 子任务 2.2：执行 `npm run type-check`
  - [x] 子任务 2.3：执行 `npm run build:minix`
  - [x] 子任务 2.4：把三条命令的结果回写到 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`

- [x] 任务 3：执行 API/query 与主链 smoke 验证并记录结果
  - [x] 子任务 3.1：执行 `npm run audit:phase09:legacy-routes`
  - [x] 子任务 3.2：执行 `npm run smoke:phase09:all`
  - [x] 子任务 3.3：执行 `npm run smoke:phase14:wave2`
  - [x] 子任务 3.4：把结果映射到页面/API/query parity matrix，并回写到 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`

- [x] 任务 4：执行 PWA 与 health 自动化验证并记录结果
  - [x] 子任务 4.1：执行 `npm run build:minix:pwa`
  - [x] 子任务 4.2：准备运行时 URL，并执行 `bash ./scripts/pwa-smoke-check.sh --profile production-ready --base-url <runtime-url>`
  - [x] 子任务 4.3：执行 `bash ./scripts/health-check.sh --url <runtime-url>`
  - [x] 子任务 4.4：把结果映射到 PWA/runtime 与 deploy/cutover/rollback matrix，并回写到 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`

- [x] 任务 5：执行 gap triage 并固定 blocker 判定
  - [x] 子任务 5.1：逐条审查失败项或无法执行项，分类为环境问题、合理适配或真实迁移遗漏
  - [x] 子任务 5.2：若发现真实迁移遗漏，必须映射到具体页面/API/PWA/部署路径与真实文件
  - [x] 子任务 5.3：若命令无法执行，必须补充阻塞原因、是否构成 blocker 与临时替代验证路径

- [x] 任务 6：完成 `phase16-02` 文档验收与交接
  - [x] 子任务 6.1：复核 `docs/phase16_*` 对自动化验证结果、triage 结论与阶段边界的记录一致
  - [x] 子任务 6.2：确认 `phase16-02` 产出可直接作为 `phase16-03-manual-acceptance-and-cutover-packet` 的上游输入
  - [x] 子任务 6.3：确认本子任务没有提前写入人工 HTTPS 验收、cutover 最终结论或 legacy 退出最终结论

# Task Dependencies
- 任务 2 依赖任务 1
- 任务 3 依赖任务 1
- 任务 4 依赖任务 1、任务 2
- 任务 5 依赖任务 2、任务 3、任务 4
- 任务 6 依赖任务 5
