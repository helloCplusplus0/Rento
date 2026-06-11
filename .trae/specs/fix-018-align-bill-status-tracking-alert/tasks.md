# Tasks
- [x] Task 1: 冻结账单状态事实、状态跟踪提示与全局窗口阈值的语义边界。
  - [x] SubTask 1.1: 明确 `PENDING / PAID / OVERDUE / COMPLETED` 继续作为账单事实状态，不在本次 fix 中重构状态机。
  - [x] SubTask 1.2: 明确账单状态跟踪提示只服务于未结清且进入窗口或已逾期的账单。
  - [x] SubTask 1.3: 明确本次 fix 复用设置页 `contractExpiryAlertDays` 作为账单/合同统一窗口型提醒配置，不新增账单独立设置项。

- [x] Task 2: 为账单列表抽取共享状态跟踪提示语义。
  - [x] SubTask 2.1: 新增账单状态跟踪提示 helper，统一计算“X 天后到期 / 今日到期 / 已逾期 X 天 / 不显示提示”。
  - [x] SubTask 2.2: 统一提示 tone、文案与默认阈值回退规则，避免在卡片组件内继续手写日期差值逻辑。
  - [x] SubTask 2.3: 明确 `PAID / COMPLETED` 或无待收金额账单不显示状态跟踪提示。

- [x] Task 3: 对齐账单列表卡片展示。
  - [x] SubTask 3.1: 在 `BillCardCompact` 中保留当前账单状态徽标，并把状态跟踪提示放到其左侧。
  - [x] SubTask 3.2: 移除卡片底部独立“已逾期 X 天”文案，避免提示重复。
  - [x] SubTask 3.3: 保持现有账单卡片 UI 基调不变，只做最小技术适配与信息结构收口。

- [x] Task 4: 收口账单列表排序与查询口径。
  - [x] SubTask 4.1: 冻结共享排序语义为“未结清优先、到期更近优先、已支付/已完成后置”，并在同距离时让逾期账单优先于未来到期账单。
  - [x] SubTask 4.2: 让 `BillListPage`、`/bills` API 与旧兼容查询共用同一排序规则。
  - [x] SubTask 4.3: 确认筛选结果、分页返回顺序和卡片提示语义保持一致，不引入新的列表回归。

- [x] Task 5: 收口设置说明与最小验证。
  - [x] SubTask 5.1: 同步更新设置页或相关说明，使“合同到期提醒窗口”当前兼容服务账单与合同窗口型提醒的边界可解释。
  - [x] SubTask 5.2: 执行 `npm run lint` 与 `npm run type-check`。
  - [x] SubTask 5.3: 人工复核 `PENDING` 未到期、窗口内待跟进、`OVERDUE`、`PAID`、`COMPLETED` 五类账单样本。
  - [x] SubTask 5.4: 人工确认账单列表排序符合“开放账单优先、已结清后置、到期更近优先”。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 1 and Task 2
- Task 5 depends on Task 2, Task 3, and Task 4
