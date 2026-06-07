# Tasks
- [x] Task 1: 盘点 `phase13-02` 范围内一级正式业务页的新旧宿主承接输入。
  - [x] SubTask 1.1: 复核 `src/minix/router/index.tsx`、`src/minix/routes/PlaceholderPage.tsx` 与现有 `minixPrimaryRoutes` 的挂载方式。
  - [x] SubTask 1.2: 复核旧 `Rento` 中 `/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 对应页面主体、布局表达与宿主绑定现状。
  - [x] SubTask 1.3: 明确哪些页面主体可直接复用，哪些内容必须先拆除 `next/*` 宿主协议后再迁入新宿主。

- [x] Task 2: 将 `/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 从 placeholder 升级为真实页面壳。
  - [x] SubTask 2.1: 为上述页面建立 route module 与页面装配层，替换现有 `PlaceholderPage` 承接。
  - [x] SubTask 2.2: 保持旧 `Rento` 一级页面的信息结构、导航节奏与主链语义，不新增第二套信息架构或说明性模块。
  - [x] SubTask 2.3: 确保该子任务不越界到 P1 详情/编辑/流程动作页、`/profile`、`/notifications`、治理页或 dev-only 页面。

- [x] Task 3: 为一级正式业务页建立页面级首屏数据边界与状态边界。
  - [x] SubTask 3.1: 为 `/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 明确首屏 loader、pending、error、not-found 同类边界。
  - [x] SubTask 3.2: 确保页面级返回、跳转、搜索与错误恢复路径具备单一解释。
  - [x] SubTask 3.3: 复核实现未越界到 retained-legacy API/query parity，仅做最小宿主适配。
  - [x] SubTask 3.4: 去除 `/rooms`、`/contracts`、`/bills` 首屏 loader 的静默分页截断，恢复旧页“全量列表 + 前端筛选/统计”语义的数据完整性。
  - [x] SubTask 3.5: 修正 `/rooms`、`/contracts` 首屏 loader，不再把 URL `search` 下推到列表 API，恢复“全量列表 + 前端筛选/统计”语义。
  - [x] SubTask 3.6: 修正 `/contracts` 到期提醒构造逻辑，保留“已过期但仍为 ACTIVE”的合同告警，恢复旧页提醒语义。

- [x] Task 4: 以旧 `Rento` 源代码为直接原型完成高保真验收收口。
  - [x] SubTask 4.1: 对照旧 `Rento` 对应页面源代码，逐项确认 `/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 已接近 `100%` 还原。
  - [x] SubTask 4.2: 清理迁移说明文案、宿主标签、开发态状态卡、验收辅助卡片、占位交互与其他显著结构漂移项。
  - [x] SubTask 4.3: 补齐最小工程验证，至少完成 `npm run lint`、`npm run type-check`，并在条件允许时执行 `npm run build:minix`。
  - [x] SubTask 4.4: 恢复 `/add` 旧页顶部引导卡与文案位置，避免因过度清理导致页面信息结构偏离旧原型。
  - [x] SubTask 4.5: 恢复 `/settings` 旧页范围说明与“暂未开放项”说明区，保留未开放范围边界表达与旧页面节奏。

- [x] Task 5: 指定独立子代理执行 `phase13-02` 终审，并仅在通过后才能标记完成。
  - [x] SubTask 5.1: 由独立子代理复核范围是否越界到 `phase14 ~ phase16`。
  - [x] SubTask 5.2: 由独立子代理复核页面是否仍保持旧 `Rento` 原型与 UI 保真边界。
  - [x] SubTask 5.3: 仅在独立子代理明确给出“通过”结论后，才允许提交并推送远程仓库。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 2 and Task 3
- Task 5 depends on Task 4
