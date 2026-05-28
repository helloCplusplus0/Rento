# Tasks
- [x] Task 1: 冻结“本次应催缴”默认筛选边界
  - [x] SubTask 1.1: 明确候选账单范围仅来自同一合同下的原始独立账单
  - [x] SubTask 1.2: 定义“本次催缴时间窗口”的默认预选规则，避免把未来期账单自动纳入
  - [x] SubTask 1.3: 明确管理者手动调整后的最终账单集合规则

- [x] Task 2: 在合同详情页接入汇总入口与选择流程
  - [x] SubTask 2.1: 在合同详情页新增“本次应催缴账单汇总”入口
  - [x] SubTask 2.2: 提供候选账单列表与默认预选状态
  - [x] SubTask 2.3: 支持管理者勾选/取消并实时更新汇总结果

- [x] Task 3: 抽象并复用水电聚合账单展示模板
  - [x] SubTask 3.1: 识别当前水电聚合账单 UI 中可复用的摘要与分项结构
  - [x] SubTask 3.2: 为“本次应催缴账单汇总”适配共享展示模板
  - [x] SubTask 3.3: 在页面文案中明确该视图为只读汇总，不是新的正式账单

- [x] Task 4: 保持账单事实与历史视图边界
  - [x] SubTask 4.1: 确认汇总页不生成新账单、不写入账单历史、不修改原账单状态
  - [x] SubTask 4.2: 确认账单历史 tab、账单详情页与统计主链继续基于原始账单事实

- [x] Task 5: 验证与回归检查
  - [x] SubTask 5.1: 验证分期租金场景下不会默认选中未来期账单
  - [x] SubTask 5.2: 验证管理者可手动调整候选账单并看到实时汇总结果
  - [x] SubTask 5.3: 验证汇总页视觉结构与当前水电聚合账单保持一致或高度一致
  - [x] SubTask 5.4: 运行 `npm run lint` 与 `npm run type-check`

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 2
- Task 5 depends on Task 3
- Task 5 depends on Task 4
