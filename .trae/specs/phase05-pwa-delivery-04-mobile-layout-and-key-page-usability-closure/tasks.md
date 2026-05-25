# Tasks

- [x] Task 1: 审计并收口移动端布局主边界
  - [x] SubTask 1.1: 审核 `phase05_pwa_delivery_architecture_plan.md`、`phase05_pwa_delivery_dev_plan.md`、`phase05_pwa_delivery_shared_baseline.md` 中与移动端布局、视口、`safe-area`、软键盘和关键页面可用性相关的口径是否一致
  - [x] SubTask 1.2: 盘点当前 `AppLayout`、`MobileLayout`、`UnifiedNavigation`、`globals.css` 与关键业务页面的移动端现状、职责和明显风险
  - [x] SubTask 1.3: 明确本子任务只收口移动端布局与关键页面可用性，不提前进入第二套路由、视觉重构或无关功能扩写

- [x] Task 2: 冻结布局切换、视口与 `safe-area` 口径
  - [x] SubTask 2.1: 明确安装态与浏览器态必须复用同一套业务 UI 主线
  - [x] SubTask 2.2: 明确视口、`safe-area`、底部导航与内容区的统一约束
  - [x] SubTask 2.3: 明确客户端判屏、安装态识别与初始渲染跳变的最小化目标

- [x] Task 3: 冻结关键页面移动端可用性标准
  - [x] SubTask 3.1: 明确首页 / Dashboard、列表、表单、详情、搜索与提醒相关页的最小可用性验收口径
  - [x] SubTask 3.2: 明确“无严重横向溢出”“主操作可达”“关键信息可读”的统一标准
  - [x] SubTask 3.3: 明确表单输入、搜索与编辑场景下软键盘遮挡的处理边界

- [x] Task 4: 冻结最小交互优化与不在范围内的边界
  - [x] SubTask 4.1: 明确允许做的不改变视觉语言的最小信息架构与交互优化
  - [x] SubTask 4.2: 明确不允许做整套视觉重构、第二套路由树或顺手扩写无关功能
  - [x] SubTask 4.3: 明确后续实现如何在统一布局主线内落地，而不是继续追加页面级零散补丁

- [x] Task 5: 完成文档级验收
  - [x] SubTask 5.1: 检查 `phase05-04` 的 spec 是否可直接作为实现与后续验收的上游输入
  - [x] SubTask 5.2: 检查 `phase05` 三份阶段文档与本子任务 spec 是否不存在越界到视觉重构、第二套路由或无关功能扩写的冲突
  - [x] SubTask 5.3: 完成本子任务 `spec.md`、`tasks.md`、`checklist.md` 的收口

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 1, Task 2, Task 3, Task 4
