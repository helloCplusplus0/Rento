# Tasks

- [x] 任务 1：复核 `phase16-01` 的输入范围并冻结证据盘点边界
  - [x] 子任务 1.1：对照 `docs/phase16_*`、`docs/phase13_*`、`docs/phase14_*`、`docs/phase15_*` 与 `DEPLOYMENT.md`，确认本子任务只覆盖证据清单、四类 parity matrix、差异分类与固定落位
  - [x] 子任务 1.2：确认 `server/lib/legacy-route-inventory.ts`、`src/minix/routes/*`、`src/app/**/page.tsx`、`src/app/api/**/route.ts`、`src/components/pwa/*`、`public/*`、部署脚本与 legacy 资产全部纳入盘点范围
  - [x] 子任务 1.3：确认本子任务不越界到正式业务 API 迁移、页面重设计、PWA 新方案重做或 legacy 资产删除

- [x] 任务 2：建立页面 parity matrix 与页面差异分类
  - [x] 子任务 2.1：以 `phase13` 已冻结的 `25` 个正式业务页面为基线，整理旧页面路径、新页面路径、页面类型、证据来源与差异说明字段
  - [x] 子任务 2.2：为每个页面给出 `已满足 parity`、`存在迁移遗漏，必须补齐`、`存在可接受宿主差异，可忽略` 三选一结论
  - [x] 子任务 2.3：明确旧 `src/app/**/page.tsx` 仍作为页面原型与只读参考的保留边界，避免把“文件仍存在”误判为 blocker

- [x] 任务 3：建立 API/query parity matrix 与 route 分类解释
  - [x] 子任务 3.1：以 `server/lib/legacy-route-inventory.ts` 为唯一真相源，输出 route path + method、inventory category、formal host、compat/bridge host、依赖面、退出条件与最终判定字段
  - [x] 子任务 3.2：把 `formal-host-owned`、`compat-wrapper`、`retained-legacy` 继续翻译为 `phase16` 的 blocker / acceptable / non-blocking 判断
  - [x] 子任务 3.3：保证治理/辅助 retained-legacy 不会被误判为正式业务 blocker，同时保证仍承担正式业务主职责的旧入口会被上调为 blocker

- [x] 任务 4：建立 PWA/runtime 与 deploy/cutover/rollback 两类 matrix
  - [x] 子任务 4.1：冻结 PWA/runtime matrix 的能力项、环境结果、差异分类与 cutover 影响字段
  - [x] 子任务 4.2：冻结 deploy/cutover/rollback matrix 的正式入口、legacy 入口、触发条件、验证证据、回滚窗口与最终状态字段
  - [x] 子任务 4.3：明确本地移动端 HTTP 无安装入口属于可接受适配差异，正式 HTTPS 环境结果才是最终 PWA 判断基线

- [x] 任务 5：固定证据产物落位并完成根级真相源一致性复核
  - [x] 子任务 5.1：把四类 parity matrix 的固定落位写入 `docs/phase16_parity_verification_cutover_and_legacy_exit_shared_baseline.md`
  - [x] 子任务 5.2：把自动化验证结果、人工验收、cutover 审核包、回滚演练与 legacy 退出判断的固定落位写入 `docs/phase16_parity_verification_cutover_and_legacy_exit_dev_plan.md`
  - [x] 子任务 5.3：复核 `README.md`、`AGENTS.md`、`project_rules.md`、`global_skills.md`、`project_skills.md`、`plan.md`、`architecture_map.md` 与 `DEPLOYMENT.md` 的 `phase16-01` 状态和边界一致

- [x] 任务 6：完成 `phase16-01` 的文档验收与交接
  - [x] 子任务 6.1：复核 `docs/phase16_*` 的互链、字段结构与引用路径存在性
  - [x] 子任务 6.2：确认 `phase16-01` 的产出可直接作为 `phase16-02-automated-verification-and-gap-triage` 的上游输入
  - [x] 子任务 6.3：确认本子任务仍只形成证据盘点与 matrix 规则，没有提前回写工程验证结果或 legacy 退出结论

# Task Dependencies
- 任务 2 依赖任务 1
- 任务 3 依赖任务 1
- 任务 4 依赖任务 1
- 任务 5 依赖任务 2、任务 3、任务 4
- 任务 6 依赖任务 5
