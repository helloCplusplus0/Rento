# Tasks

- [x] 任务 1：复核 `phase16-03` 的输入范围并冻结当前轮边界
  - [x] 子任务 1.1：对照 `docs/phase16_*`、`phase16-01` matrix、`phase16-02` 自动化验证记录、`DEPLOYMENT.md` 与 legacy 资产清单，确认本子任务只覆盖源码层对齐、cutover 审核包字段冻结与待云端复验占位
  - [x] 子任务 1.2：确认本轮不伪造人工 HTTPS 验收、正式部署演练或 legacy 回滚演练结果
  - [x] 子任务 1.3：确认本轮仍需保留本地开发验收与正式 HTTPS 部署验收的区分口径

- [x] 任务 2：完成源码层对齐复核并记录结论
  - [x] 子任务 2.1：复核页面主链、PWA/runtime、部署入口、健康检查与 rollback 入口在代码和文档层面的当前状态
  - [x] 子任务 2.2：若发现新缺口，映射到具体页面/API/PWA/部署路径与真实文件
  - [x] 子任务 2.3：把源码层对齐结论回写到 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`

- [x] 任务 3：冻结 cutover 审核包与演练记录模板
  - [x] 子任务 3.1：在 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md` 中固定 cutover 审核包字段
  - [x] 子任务 3.2：明确正式部署演练记录、legacy 回滚演练记录、PWA HTTPS 实机验收记录的待补字段、触发条件与引用入口
  - [x] 子任务 3.3：确保所有记录都能被 `docs/phase16_*` 与根级真相源直接引用

- [x] 任务 4：同步 `phase16` 文档与根级真相源的当前轮口径
  - [x] 子任务 4.1：同步 `docs/phase16_*`，明确 `phase16-03` 当前轮以源码层对齐和 cutover packet 冻结为主
  - [x] 子任务 4.2：必要时同步 `README.md`、`AGENTS.md`、`plan.md`、`architecture_map.md` 与 `DEPLOYMENT.md`，写明正式人工验收延后到真实云服务器执行
  - [x] 子任务 4.3：确认没有把“待云端执行”误写成“已执行完成”

- [x] 任务 5：完成 `phase16-03` 文档验收与交接
  - [x] 子任务 5.1：复核 `docs/phase16_*` 对当前轮已完成项、待云端复验项与引用入口的记录一致
  - [x] 子任务 5.2：确认 `phase16-03` 产出可直接作为 `phase16-04-legacy-exit-decision-and-root-sync` 的上游输入
  - [x] 子任务 5.3：确认本子任务没有伪造人工验收、正式部署演练或 legacy 回滚演练结果

# Task Dependencies
- 任务 2 依赖任务 1
- 任务 3 依赖任务 1、任务 2
- 任务 4 依赖任务 3
- 任务 5 依赖任务 4
