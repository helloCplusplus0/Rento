# Tasks
- [x] Task 1: 抽取账单金额与状态共享服务，建立账务语义的正式承接位。
  - [x] SubTask 1.1: 基于 `src/lib/bill-semantics.ts` 梳理 `amount / receivedAmount / pendingAmount / BillStatus` 的统一语义与展示口径。
  - [x] SubTask 1.2: 在 `src/lib/domain/billing/*` 中创建账单金额与状态服务入口，保持旧 `src/lib/bill-semantics.ts` 退化为兼容包装或共享消费者。
  - [x] SubTask 1.3: 让 `server/routes/bills.ts` 为账单更新与账务语义查询预留正式消费入口。

- [x] Task 2: 抽取支付周期与基础自动出账共享服务，冻结合同支付周期到账单生成的统一规则。
  - [x] SubTask 2.1: 基于 `src/lib/auto-bill-generator.ts` 与 `docs/fix/fix_001_analysis_contract-billing-cycle.md` 提炼支付周期标准化、账期切分、每期金额和一次性费用生成规则。
  - [x] SubTask 2.2: 在 `src/lib/domain/billing/*` 中创建基础账单生成服务入口，但不迁入抄表自动出账细节。
  - [x] SubTask 2.3: 让 `server/routes/bills.ts` 或相关 compat 入口消费新的支付周期共享服务，并保留 compat 边界说明。

- [x] Task 3: 抽取账单删除门禁共享服务，冻结账单历史保留语义。
  - [x] SubTask 3.1: 基于 `src/app/api/bills/[id]/route.ts` 提炼账单删除阻断条件、错误码和建议语义。
  - [x] SubTask 3.2: 在 `src/lib/domain/billing/*` 中创建账单删除门禁与受控删除服务入口。
  - [x] SubTask 3.3: 让 `server/routes/bills.ts` 对账单删除请求消费共享门禁结果，并维持正式宿主优先。

- [x] Task 4: 收口旧账务宿主 compat wrapper，使旧入口不再独占账务真相。
  - [x] SubTask 4.1: 更新 `src/app/api/bills/[id]/route.ts`，使其通过共享领域服务或正式宿主消费账单更新与删除结果。
  - [x] SubTask 4.2: 更新与基础账单生成相关的旧入口，使其通过共享服务消费支付周期与账单生成结果。
  - [x] SubTask 4.3: 在旧入口中补足 compat wrapper 的存在原因与退出条件，不新增第二套账务语义。

- [x] Task 5: 完成实现校验，确认账务语义、支付周期与账单删除门禁已由新主线正式承接。
  - [x] SubTask 5.1: 运行 `npm run lint`。
  - [x] SubTask 5.2: 运行 `npm run type-check`。
  - [x] SubTask 5.3: 复核账单金额/状态语义、支付周期基础规则与账单删除门禁在共享服务层与正式宿主中均可解释。
  - [x] SubTask 5.4: 确认本子任务未迁移抄表自动出账细节、退租结算编排或数据访问主线。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2, Task 3
- Task 5 depends on Task 2, Task 3, Task 4
