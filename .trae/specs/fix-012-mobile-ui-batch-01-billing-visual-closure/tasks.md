# Tasks
- [x] Task 1: 冻结账单链路首轮移动端视觉收口边界
  - [x] SubTask 1.1: 明确本批次只覆盖账单列表、账单详情、账单相关弹窗与共享展示模板
  - [x] SubTask 1.2: 明确本批次只优先处理字体层级、行高、卡片间距、弹窗宽高与滚动策略
  - [x] SubTask 1.3: 明确不在本批次范围内的页面和结构性重排内容

- [x] Task 2: 收口账单列表页与账单卡片的移动端视觉节奏
  - [x] SubTask 2.1: 调整账单列表页移动端容器与卡片密度
  - [x] SubTask 2.2: 调整 `BillCardCompact` 的标题、金额、辅助文案字体层级与卡片间距
  - [x] SubTask 2.3: 检查桌面账单卡与移动卡片的视觉关系，避免移动端优化引入新的口径分叉

- [x] Task 3: 收口账单详情页移动端信息层级
  - [x] SubTask 3.1: 调整账单详情页头部、金额区、状态区的移动端主次节奏
  - [x] SubTask 3.2: 调整 `BillBasicInfo` 等详情区块的文字大小、行高与区块间距
  - [x] SubTask 3.3: 确认不改变账单详情页原有业务信息顺序和事实语义

- [x] Task 4: 收口账单相关弹窗与共享展示模板的移动端宽高体验
  - [x] SubTask 4.1: 检查 `ContractBillDueSummaryDialog` 的移动端宽度、高度、滚动区域和底部操作区
  - [x] SubTask 4.2: 调整 `BillDueSummaryCard`、`AggregatedBillTemplateCard` 等共享展示模板的移动端字体与间距
  - [x] SubTask 4.3: 消除本批次内新增的横向溢出、内容裁切或操作遮挡

- [ ] Task 5: 验证批次 1 的移动端收口结果
  - [ ] SubTask 5.1: 逐项对照移动端列表、详情、弹窗的可读性目标进行人工复核
  - [x] SubTask 5.2: 运行 `npm run lint` 与 `npm run type-check`
  - [ ] SubTask 5.3: 补充至少一轮移动端前后对比或等价的可视化验收记录

- [ ] Task 6: 补充移动端运行态验收证据并复核未通过检查项
  - [ ] SubTask 6.1: 对账单列表、账单详情、支付确认弹窗、状态说明弹窗和本次应催缴汇总弹窗补一轮移动端运行态检查
  - [ ] SubTask 6.2: 记录是否存在横向溢出、内容裁切、底部操作遮挡或双滚动混乱
  - [ ] SubTask 6.3: 形成至少一轮前后对比截图或等价人工验收记录，并据此重新复核 checklist 第 4、10 项

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 2]
- [Task 5] depends on [Task 3]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 5]
