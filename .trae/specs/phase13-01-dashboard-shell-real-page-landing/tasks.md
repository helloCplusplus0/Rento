# Tasks
- [x] Task 1: 盘点首页在新旧宿主中的真实承接输入。
  - [x] SubTask 1.1: 复核 `src/minix/routes/HomePage.tsx`、`src/minix/layout/*` 与 `src/minix/router/index.tsx` 的当前首页承接方式。
  - [x] SubTask 1.2: 复核 `src/components/pages/DashboardPage.tsx`、`DashboardPageWithStats.tsx` 与 `src/components/business/dashboard-home.tsx` 的表达层与宿主绑定现状。
  - [x] SubTask 1.3: 明确首页中哪些内容可直接复用，哪些需要先拆宿主绑定后再承接。

- [x] Task 2: 把 `/` 从说明性承接页升级为真实工作台页面壳。
  - [x] SubTask 2.1: 为首页建立新宿主页面装配结构，替换当前说明性内容。
  - [x] SubTask 2.2: 冻结首页快捷入口、搜索入口与设置入口的承接方式，保持旧导航节奏与 UI 原型。
  - [x] SubTask 2.3: 确保首页不引入第二套导航骨架，也不越界扩写通知中心、个人资料或 PWA runtime。

- [x] Task 3: 为首页建立可复用的页面级状态边界。
  - [x] SubTask 3.1: 为首页明确 loader / pending / error 同类边界的最小实现口径。
  - [x] SubTask 3.2: 确保首页状态边界进入新宿主 route module，而不是继续停留在旧说明页逻辑。
  - [x] SubTask 3.3: 复核首页实现未越界到 retained-legacy API/query parity。

- [x] Task 4: 回退 `phase13-01` 的错误验收结论，并按旧首页原型重新建立通过门槛。
  - [x] SubTask 4.1: 复核 `/` 已不再只是阶段说明页，而是具备真实工作台页面壳与装配结构。
  - [x] SubTask 4.2: 对照旧 `DashboardPage.tsx` / `DashboardPageWithStats.tsx`，逐项确认首页信息结构、组件表达、导航节奏、表单交互、状态反馈与主链语义已接近 `100%` 还原。
  - [x] SubTask 4.3: 清理迁移说明文案、宿主标签、开发态状态卡、验收辅助卡片、占位交互、重复快捷入口与其他显著结构漂移项。
  - [x] SubTask 4.4: 指定独立子代理重新执行终审，并仅在子代理明确给出“通过”结论后，才允许将 Task 4 标记完成。

- [x] Task 5: 按首页迁移缺口清单修复 `HomePage` 与旧 `Rento` 首页原型的严重差异。
  - [x] SubTask 5.1: 以旧 `DashboardPageWithStats.tsx` 为直接原型，回收当前 `HomePage` 中新增的说明性 hero、侧栏说明卡与开发态状态卡。
  - [x] SubTask 5.2: 重新承接旧首页的功能入口、提醒/个人入口语义与告警/统计结构，避免用新说明卡替代旧原型模块。
  - [x] SubTask 5.3: 修复重复 `设置` 快捷入口与技术态错误文案，确保首页达到生产级工作台展示质量。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 2 and Task 3
- Task 5 depends on Task 4
