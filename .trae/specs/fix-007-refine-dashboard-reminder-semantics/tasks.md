# Tasks
- [x] Task 1: 收口提醒模块语义与命名
  - [x] SubTask 1.1: 梳理 Dashboard 四个提醒的正式业务定义，明确房态信号、窗口型提醒和已逾期待处理事项的边界
  - [x] SubTask 1.2: 调整前端提醒标题与详情标题，使“离店提醒”“即将生效合同/待入住合同”“已到期合同/逾期合同”语义一致
  - [x] SubTask 1.3: 确认“合同到期”类提醒不再使用模糊命名，且不误导为窗口型提醒

- [x] Task 2: 接入即将生效合同提醒的统一窗口配置
  - [x] SubTask 2.1: 在全局设置真相源与前端设置类型中新增 `upcomingMoveInAlertDays`
  - [x] SubTask 2.2: 在设置页正式提醒配置中暴露 `upcomingMoveInAlertDays`
  - [x] SubTask 2.3: 将 Dashboard “30天搬入”查询与标题改为读取统一设置，而不是继续硬编码 30 天

- [x] Task 3: 保持合同结束链提醒的单一真相源
  - [x] SubTask 3.1: 确认 Dashboard 离店提醒继续统一读取 `contractExpiryAlertDays`
  - [x] SubTask 3.2: 确认已到期合同提醒保持“已到期未处理”的客观状态判断，不引入可调窗口
  - [x] SubTask 3.3: 对相关语义工具或辅助函数进行最小收口，避免同类判断散落

- [x] Task 4: 收口提醒模块的重复装配路径
  - [x] SubTask 4.1: 审计首页实际提醒链路与旧版 `getDashboardAlerts()` 的重叠点
  - [x] SubTask 4.2: 选择并收口为单一提醒装配真相源，避免首页标题、数量和窗口定义出现双重真相
  - [x] SubTask 4.3: 确认遗留提醒实现不会继续影响正式首页行为

- [x] Task 5: 保持提醒设置页边界稳定
  - [x] SubTask 5.1: 确认 `billReminderDays`、`readingReminderDays`、`enableNotifications` 不会被误开放为正式提醒配置
  - [x] SubTask 5.2: 更新设置页说明文案，使正式配置与暂未开放项边界清晰

- [x] Task 6: 验证与回归检查
  - [x] SubTask 6.1: 验证 Dashboard 四个提醒的标题、数量和详情语义一致且互不混淆
  - [x] SubTask 6.2: 验证 `upcomingMoveInAlertDays` 与 `contractExpiryAlertDays` 各自只作用于对应窗口提醒
  - [x] SubTask 6.3: 验证已到期合同提醒不被误并入窗口型提醒
  - [x] SubTask 6.4: 运行 `npm run lint` 与 `npm run type-check`

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 2
- Task 6 depends on Task 2
- Task 6 depends on Task 3
- Task 6 depends on Task 4
- Task 6 depends on Task 5
