# Tasks
- [x] Task 1: 复核首页在新旧宿主中的最终对照输入，并冻结本轮首页验收边界。
  - [x] SubTask 1.1: 复核 `src/minix/routes/HomePage.tsx`、`src/minix/components/homepage/*` 与 `src/minix/layout/*` 的首页承接现状。
  - [x] SubTask 1.2: 复核旧 `src/components/pages/DashboardPage.tsx`、`DashboardPageWithStats.tsx` 的首页原型、入口语义与状态反馈结构。
  - [x] SubTask 1.3: 明确本轮仅处理首页页面 parity、高保真对照与最小修复，不切 dashboard retained-legacy API/query。

- [x] Task 2: 建立首页 parity gap 清单，并判定哪些问题构成阻断验收。
  - [x] SubTask 2.1: 逐项对照首页搜索入口、快捷入口、提醒面板、统计卡、个人入口与导航节奏。
  - [x] SubTask 2.2: 记录迁移说明卡、宿主标签、重复入口、技术态文案或其他显著 UI 漂移项。
  - [x] SubTask 2.3: 输出“已消除 / 需最小修复 / 仍阻断验收”三类 gap 结论。

- [x] Task 3: 对首页阻断项执行最小修复，并保持不越界到 `phase14`。
  - [x] SubTask 3.1: 仅修复首页高保真对照中阻断验收的差异项。
  - [x] SubTask 3.2: 确认修复不改变旧首页信息架构、导航骨架与主链语义。
  - [x] SubTask 3.3: 为任何保留的临时兼容或宿主适配写明存在原因与退出条件。

- [x] Task 4: 完成首页人工浏览器高保真复验，并收口首页最终迁移结论。
  - [x] SubTask 4.1: 按旧首页原型执行人工浏览器复验，覆盖搜索入口、快捷入口、提醒面板、统计卡与个人入口。
  - [x] SubTask 4.2: 将首页结论收口为“通过保真验收”或“仍阻断验收”，不再保留模糊状态。
  - [x] SubTask 4.3: 同步 `docs/phase13_*` 与相关 spec 资产中的首页状态描述。

- [x] Task 5: 指定独立子代理执行 `phase13-06` 终审，并仅在通过后才能标记完成。
  - [x] SubTask 5.1: 让独立子代理优先审查首页是否仍存在显著 UI 漂移或越界到 `phase14` 的问题。
  - [x] SubTask 5.2: 若终审失败，补充修复任务并重新复验。
  - [x] SubTask 5.3: 仅在独立子代理明确给出“通过”后，勾选本 spec 的完成状态。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 4
