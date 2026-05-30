# Tasks
- [x] Task 1: 收口全局导航与工作台入口一致性
  - [x] SubTask 1.1: 调整 `navigation-config.ts`，让移动端底部导航以 `账单` 替换 `设置`
  - [x] SubTask 1.2: 调整 `FunctionGrid.tsx`，将 `设置` 新增到工作台快捷宫格
  - [x] SubTask 1.3: 验证工作台快捷入口与主导航不再形成“补偿式补位”冲突

- [x] Task 2: 收口搜索与通知入口表达
  - [x] SubTask 2.1: 将 PC 端顶部搜索图标替换为正式搜索框
  - [x] SubTask 2.2: 移除与 PC 顶部搜索重复的 PC 工作台搜索区，同时保留移动端工作台搜索
  - [x] SubTask 2.3: 统一通知入口表达，消除“桌面占位、移动缺席”的伪入口状态

- [x] Task 3: 对齐批量抄表页 PC 与移动端关键信息
  - [x] SubTask 3.1: 梳理移动端已有而桌面端缺失的合同编号、租客姓名、warning / error 信息
  - [x] SubTask 3.2: 在桌面表格中补齐关键判断信息，同时保持表格录入效率
  - [x] SubTask 3.3: 验证桌面端未出现溢出、错位或操作不可达

- [x] Task 4: 清理废弃移动端专用入口组件并完成工程校验
  - [x] SubTask 4.1: 确认 `MobileSearchBar.tsx` 未被正式路径使用后移除
  - [x] SubTask 4.2: 运行 `npm run lint` 与 `npm run type-check`
  - [x] SubTask 4.3: 完成独立复核，确认未引入新的跨端功能分叉

# Task Dependencies
- Task 2 depends on Task 1
- Task 4 depends on Task 1
- Task 4 depends on Task 2
- Task 4 depends on Task 3
