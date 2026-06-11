# Tasks
- [x] Task 1: 冻结合同状态事实与状态跟踪提示的语义边界。
  - [x] SubTask 1.1: 明确 `ACTIVE / EXPIRED / TERMINATED` 在合同卡片与详情页中的事实语义。
  - [x] SubTask 1.2: 明确“状态跟踪提示”只在待管理员跟进的临界态显示。
  - [x] SubTask 1.3: 明确续租完成旧合同应收口为 `TERMINATED`，而不是继续保留为 `EXPIRED`。

- [x] Task 2: 修正续租完成后的旧合同状态收口规则。
  - [x] SubTask 2.1: 调整续租服务，使旧合同在续租成功后进入 `TERMINATED`。
  - [x] SubTask 2.2: 保留 `isExtended=true` 与续租备注作为历史承接证据。
  - [x] SubTask 2.3: 验证退租主链的 `TERMINATED` 收口不被误伤。

- [x] Task 3: 统一合同卡片、详情页与提醒组件的状态跟踪提示表达。
  - [x] SubTask 3.1: 把合同卡片中的状态跟踪提示移动到状态指示左侧。
  - [x] SubTask 3.2: 让详情页 Hero 使用与列表页一致的状态跟踪提示语义。
  - [x] SubTask 3.3: 清理硬编码 `30` 天窗口，统一复用 `contractExpiryAlertDays` 配置。

- [x] Task 4: 收口统计与筛选口径，避免已续租承接旧合同继续污染到期结果。
  - [x] SubTask 4.1: 修正 `expiredCount` 与到期提醒的口径，排除已续租承接旧合同。
  - [x] SubTask 4.2: 修正 `expiring_soon` 与相关筛选结果，使其与卡片语义一致。
  - [x] SubTask 4.3: 盘点历史 `isExtended=true && status='EXPIRED'` 样本的最小修复策略。
  - [x] SubTask 4.4: 为已通过审计证据的历史 `isExtended=true && status='EXPIRED'` 样本提供安全修复脚本，并在本地验收环境执行最小修复。

- [x] Task 5: 完成最小验证并确认 fix 范围未越界。
  - [x] SubTask 5.1: 执行 `npm run lint` 与 `npm run type-check`。
  - [x] SubTask 5.2: 人工复核合同列表页中的 `ACTIVE`、真实 `EXPIRED`、续租后旧合同、退租后旧合同四类样本。
  - [x] SubTask 5.3: 人工复核上述样本在合同详情页中的状态指示与状态跟踪提示。
  - [x] SubTask 5.4: 确认本次 fix 未扩写为合同模块全面状态机重构、dashboard 全量重构或新的 phase。

- [x] Task 6: 收口 fix_017 暴露出的排序回归与房态不同步问题。
  - [x] SubTask 6.1: 调整合同列表排序为“距到期日越近越靠前”，并把 `TERMINATED` 合同后置。
  - [x] SubTask 6.2: 抽取共享房间占用推导 helper，统一房间列表、房间详情与 API/route data 的房态快照口径。
  - [x] SubTask 6.3: 修正退租与旧查询层合同写链，避免存在 `ACTIVE` 合同时仍把房间误写为空房。
  - [x] SubTask 6.4: 提供房态快照 dry-run/安全修复脚本，并在本地验收环境执行最小修复。
  - [x] SubTask 6.5: 人工复核 `/contracts` 排序与 `/rooms`、`/rooms/:id` 房态同步结果。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2
- Task 5 depends on Task 2, Task 3, and Task 4
- Task 6 depends on Task 2, Task 3, Task 4, and Task 5
