# Tasks
- [x] Task 1: 建立 `phase13` 正式业务页面全量清单与迁移状态审计。
  - [x] SubTask 1.1: 基于旧 `src/app/**/page.tsx`、`docs/phase12_*` 与 `page-governance` 规则，冻结正式业务页面总量、页面路径与页面类型分组。
  - [x] SubTask 1.2: 基于 `src/minix/router/index.tsx`、`src/minix/routes/*` 与 `route-navigation`，逐页标注“已迁移 / 部分迁移 / 未迁移 / 仍依赖 legacy document fallback”状态。
  - [x] SubTask 1.3: 单独列出全部未迁移或部分迁移页面清单，并写明当前状态、未迁移原因与是否阻断 `phase13` 完成判定。

- [x] Task 2: 产出 `phase13` 页面 parity 验收矩阵与人工浏览器操作基线。
  - [x] SubTask 2.1: 为首页、列表页、详情页、编辑/新建页与流程动作页分别定义最小验收矩阵，写清参考页面、核心验收点与页面级风险。
  - [x] SubTask 2.2: 为每类页面编写可直接执行的人工浏览器操作链，包含入口路径、关键操作、预期结果、失败回退方式与数据前提。
  - [x] SubTask 2.3: 明确哪些页面已经达到接近 `100%` 的旧 `Rento` 保真度，哪些页面仍存在 parity gap，避免笼统宣称“整体已完成”。

- [x] Task 3: 收口页面与 retained-legacy API/query 的交接关系，为 `phase14` 提供直接输入。
  - [x] SubTask 3.1: 结合 `server/lib/legacy-route-inventory.ts`、当前 route module 与旧页面依赖，梳理页面到 API/query 的依赖关系。
  - [x] SubTask 3.2: 对每类页面说明 retained-legacy API/query 当前保留原因、兼容桥接状态与 `phase14` 的优先清退关注点。
  - [x] SubTask 3.3: 明确本子任务只做交接说明，不新增 `phase14` 阶段文档正文，也不执行 route drain。

- [x] Task 4: 同步 `phase13-05` 文档轮次最小验证要求与顶层真相源一致性。
  - [x] SubTask 4.1: 在 `docs/phase13_*` 中写明本轮仅文档变更时的最小验证要求、互链复核与被引用路径存在性复核要求。
  - [x] SubTask 4.2: 复核 `docs/phase13_*`、`plan.md`、`docs/phase12_*` 与本 spec 对 `phase13` 职责边界的表述保持一致。
  - [x] SubTask 4.3: 明确 `phase13-05` 的输出是“验收基线与迁移完成度审计”，不是继续直接实施页面迁移。

- [x] Task 5: 修正 `phase12` 页面映射表命名残留。
  - [x] SubTask 5.1: 将 `docs/phase12_frontend_parity_and_shell_cutover_dev_plan.md` 中残留的 `phase12-02-page-to-minix-route-mapping` 统一修正为当前页面映射表命名，并同步更新顺序清单引用。

- [x] Task 6: 更新 `route-manifest` 的实际承接描述。
  - [x] SubTask 6.1: 在 `docs/phase13_frontend_page_parity_implementation_architecture_plan.md` 中明确 `route-manifest.tsx` 当前仅承接导航与治理元数据说明，正式业务页面实际承接以 `src/minix/router/index.tsx` 与已落地的 `*Route.tsx` 为准。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1, Task 2, and Task 3
- Task 5 depends on Task 4
- Task 6 depends on Task 4
