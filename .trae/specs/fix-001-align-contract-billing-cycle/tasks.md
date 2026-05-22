# Tasks
- [x] Task 1: 冻结统一支付周期真相源：抽离合同支付周期标准化与 RENT 账单计算共享工具，兼容中文值与历史英文值。
  - [x] SubTask 1.1: 统一内部周期值与兼容输入映射，明确 `MONTHLY | QUARTERLY | SEMI_YEARLY | YEARLY` 作为内部标准
  - [x] SubTask 1.2: 抽离共享的账期切分和每期金额计算逻辑，禁止各入口继续各自解释支付周期
  - [x] SubTask 1.3: 明确共享工具的边界，只覆盖支付周期标准化、账期切分和 RENT 每期金额计算

- [x] Task 2: 收口合同主链生成路径：让合同创建预展示、合同创建落库、续租、手工重新生成账单与缺失账单补齐全部复用共享工具。
  - [x] SubTask 2.1: 修改合同创建页账单预展示，复用共享支付周期与 RENT 账单计算逻辑
  - [x] SubTask 2.2: 修改 `auto-bill-generator` 中的 RENT 账单生成与缺失账单补齐逻辑，统一改用共享工具
  - [x] SubTask 2.3: 确认续租与 `/api/contracts/[id]/generate-bills` 复用链路自动继承修复结果

- [x] Task 3: 设计历史错误账单识别与安全修复边界：补一条只针对安全范围的历史修复策略与验证路径。
  - [x] SubTask 3.1: 定义历史错误 RENT 账单识别规则，至少覆盖 `paymentMethod`、理论条数、理论金额与现有账单状态
  - [x] SubTask 3.2: 将自动修复严格限制在“全部 `PENDING` 且 `receivedAmount = 0`”的安全范围
  - [x] SubTask 3.3: 对已支付、部分支付、已完成或人工修改账单，仅输出审计清单或明确人工处理策略

- [x] Task 4: 验证并收口回归风险：补充主链验证，确认一次性费用账单未被误伤，且各生成入口结果一致。
  - [x] SubTask 4.1: 验证 `12` 个月 `半年付` 合同生成 `2` 条 RENT 账单、每条金额为 `monthlyRent * 6`
  - [x] SubTask 4.2: 验证 `季付` 或 `年付` 的账单条数与金额正确
  - [x] SubTask 4.3: 验证押金、钥匙押金、清洁费账单未被误伤
  - [x] SubTask 4.4: 运行 `npm run lint` 与 `npm run type-check`

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2
- Task 4 depends on Task 3
