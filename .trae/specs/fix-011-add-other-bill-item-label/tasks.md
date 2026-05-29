# Tasks
- [x] Task 1: 冻结 `OTHER` 账单结构化条目名字段与兼容边界
  - [x] SubTask 1.1: 明确 `Bill.type / itemLabel / remarks` 的职责边界
  - [x] SubTask 1.2: 为 `Bill` 增加可选条目名字段，并保持现有正式类型体系不变
  - [x] SubTask 1.3: 设计历史 `OTHER` 账单的安全回填与降级兼容策略

- [x] Task 2: 接入合同自动生成与手工建账单入口
  - [x] SubTask 2.1: 让合同自动生成的钥匙押金、卫生费账单写入默认条目名
  - [x] SubTask 2.2: 让手动新增账单页在 `type='OTHER'` 时提供条目名输入入口
  - [x] SubTask 2.3: 让编辑账单页在 `type='OTHER'` 时提供条目名编辑入口

- [x] Task 3: 统一 OTHER 账单展示与图标口径
  - [x] SubTask 3.1: 更新账单列表页桌面与移动卡片，展示 `OTHER` 条目名与对应图标
  - [x] SubTask 3.2: 更新账单详情页与合同账单预览，复用统一展示口径
  - [x] SubTask 3.3: 更新 `fix_010` 本次应催缴汇总，复用同一条目名与图标映射

- [x] Task 4: 处理历史兼容与默认命名收口
  - [x] SubTask 4.1: 将清洁费的默认展示名统一收口为“卫生费”
  - [x] SubTask 4.2: 为可安全识别的历史自动生成 `OTHER` 账单回填条目名
  - [x] SubTask 4.3: 为无法可靠识别的历史 `OTHER` 账单保留降级展示兼容

- [x] Task 5: 验证 fix_011 主链不被误伤
  - [x] SubTask 5.1: 验证 `OTHER` 条目名不影响正式类型、统计口径和结算逻辑
  - [x] SubTask 5.2: 运行 `npm run lint` 与 `npm run type-check`
  - [x] SubTask 5.3: 补充至少一条合同自动生成路径与一条手动创建路径的人工验证记录

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 2]
- [Task 5] depends on [Task 3]
- [Task 5] depends on [Task 4]
