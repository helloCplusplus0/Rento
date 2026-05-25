# Tasks
- [x] Task 1: 收口设置页中的真实业务配置项
  - [x] SubTask 1.1: 梳理设置页现有配置项，区分业务配置、治理入口、只读信息和暂未启用项
  - [x] SubTask 1.2: 在设置页和 `AppSettings` 类型中补齐 `gasPrice`
  - [x] SubTask 1.3: 对未接线配置项选择隐藏、禁用或降级说明，避免继续以已生效配置展示

- [x] Task 2: 收口抄表服务端对全局设置的读取
  - [x] SubTask 2.1: 移除抄表服务端对 `usageAnomalyThreshold`、`autoGenerateBills`、`requireReadingApproval` 的硬编码默认值依赖
  - [x] SubTask 2.2: 改为从数据库全局设置读取对应配置
  - [x] SubTask 2.3: 确认抄表主链在读取失败时仍有可控回退路径

- [x] Task 3: 收口设置页语义分层
  - [x] SubTask 3.1: 明确区分业务配置区、治理入口区和只读信息区
  - [x] SubTask 3.2: 确认页面描述与实际行为一致，不再误导用户认为全部设置都已生效

- [x] Task 4: 验证与回归检查
  - [x] SubTask 4.1: 验证 `gasPrice` 在设置页可见且可维护
  - [x] SubTask 4.2: 验证抄表服务端真正读取数据库全局设置
  - [x] SubTask 4.3: 验证未接线配置项不再以正式生效配置姿态展示
  - [x] SubTask 4.4: 运行 `npm run lint` 与 `npm run type-check`

- [x] Task 5: 收口合同到期提醒窗口配置
  - [x] SubTask 5.1: 在全局设置真相源与前端设置类型中补齐 `contractExpiryAlertDays`
  - [x] SubTask 5.2: 将合同列表、详情、统计和“即将到期”筛选统一改为读取 `contractExpiryAlertDays`
  - [x] SubTask 5.3: 将 Dashboard 离店提醒查询与文案统一改为读取 `contractExpiryAlertDays`

- [x] Task 6: 保持未接线提醒配置的隐藏边界
  - [x] SubTask 6.1: 明确 `billReminderDays` 当前无真实消费点，不作为正式业务配置开放
  - [x] SubTask 6.2: 更新设置页暂未开放说明，避免继续把账单提醒描述成已生效设置

- [x] Task 7: 第二批回归验证
  - [x] SubTask 7.1: 验证设置页可维护 `contractExpiryAlertDays`
  - [x] SubTask 7.2: 验证合同页与 Dashboard 的到期窗口口径一致
  - [x] SubTask 7.3: 运行 `npm run lint` 与 `npm run type-check`

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 1
- Task 6 depends on Task 1
- Task 7 depends on Task 5
- Task 7 depends on Task 6
