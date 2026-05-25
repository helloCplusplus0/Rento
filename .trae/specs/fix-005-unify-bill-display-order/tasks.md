# Tasks
- [x] Task 1: 冻结统一账单展示排序规则
  - [x] SubTask 1.1: 明确未完结账单与已完结账单的展示分组边界，复用现有账单展示状态语义
  - [x] SubTask 1.2: 定义统一排序比较器，冻结 `未完结优先 -> dueDate asc -> createdAt desc` 规则
  - [x] SubTask 1.3: 为共享排序能力补充必要的类型约束与注释

- [x] Task 2: 收口合同详情页账单历史排序
  - [x] SubTask 2.1: 移除合同详情页本地 `createdAt desc` 手写排序
  - [x] SubTask 2.2: 改为复用统一账单展示排序能力
  - [x] SubTask 2.3: 确认账单历史 Tab 的统计与列表渲染不受影响

- [x] Task 3: 收口账单列表页默认排序
  - [x] SubTask 3.1: 让账单列表页在初始展示和筛选/搜索后都复用统一排序能力
  - [x] SubTask 3.2: 确认桌面网格与移动端列表顺序一致

- [x] Task 4: 收口查询层与 API 默认排序口径
  - [x] SubTask 4.1: 调整 `billQueries.findAll()` 默认排序口径
  - [x] SubTask 4.2: 调整 `/api/bills` 对应优化查询排序口径
  - [x] SubTask 4.3: 评估合同详情查询是否需要补充稳定的账单 include 排序

- [x] Task 5: 验证与回归检查
  - [x] SubTask 5.1: 覆盖“未完结优先 + 最早到期优先 + 同日兜底”的核心场景
  - [x] SubTask 5.2: 验证合同详情页与账单列表页展示顺序一致
  - [x] SubTask 5.3: 运行 `npm run lint` 与 `npm run type-check`

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 2
- Task 5 depends on Task 3
- Task 5 depends on Task 4
