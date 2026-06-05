# Tasks
- [x] Task 1: 抽取合同生命周期共享服务，建立合同激活与状态流转的正式承接位。
  - [x] SubTask 1.1: 基于 `src/lib/contract-activation.ts` 梳理 `PENDING -> ACTIVE` 的事务边界、房态联动和异常语义。
  - [x] SubTask 1.2: 在 `src/lib/domain/contracts/*` 中创建合同生命周期服务入口，但不迁入续租、退租或账单生成逻辑。
  - [x] SubTask 1.3: 让 `server/routes/contracts.ts` 预留合同激活与状态流转的正式消费入口。

- [x] Task 2: 抽取合同删除门禁共享服务，冻结“窄场景允许删除、历史事实优先保留”的规则。
  - [x] SubTask 2.1: 基于 `src/lib/validation.ts` 与 `src/app/api/contracts/[id]/route.ts` 提炼合同删除阻断条件、错误码和建议语义。
  - [x] SubTask 2.2: 在 `src/lib/domain/delete-guards/*` 或等价共享目录中创建合同删除门禁服务入口。
  - [x] SubTask 2.3: 让 `server/routes/contracts.ts` 对合同删除请求消费共享门禁结果，并保留 compat 边界说明。

- [x] Task 3: 抽取房间删除门禁共享服务，冻结房间删除与终止/归档/解绑流程的关系。
  - [x] SubTask 3.1: 基于 `src/lib/validation.ts` 与 `src/app/api/rooms/[id]/route.ts` 提炼房间删除阻断条件、替代建议和物理删除窄场景。
  - [x] SubTask 3.2: 在 `src/lib/domain/delete-guards/*` 或等价共享目录中创建房间删除门禁与受控删除服务入口。
  - [x] SubTask 3.3: 让 `server/routes/rooms.ts` 对房间删除请求消费共享门禁结果，并明确楼栋计数等联动责任归属。

- [x] Task 4: 收口旧宿主 compat wrapper，使旧合同/房间入口不再独占删除与激活真相。
  - [x] SubTask 4.1: 更新 `src/app/api/contracts/[id]/route.ts`，使其通过共享领域服务或正式宿主消费合同激活/删除结果。
  - [x] SubTask 4.2: 更新 `src/app/api/rooms/[id]/route.ts`，使其通过共享领域服务或正式宿主消费房间删除结果。
  - [x] SubTask 4.3: 在旧入口中补足 compat wrapper 的存在原因与退出条件，不新增第二套删除规则。

- [x] Task 5: 完成实现校验，确认合同锚点与删除门禁已由新主线正式承接且未破坏历史保留。
  - [x] SubTask 5.1: 运行 `npm run lint`。
  - [x] SubTask 5.2: 运行 `npm run type-check`。
  - [x] SubTask 5.3: 复核合同激活、合同删除门禁、房间删除门禁在共享服务层与正式宿主中均可解释。
  - [x] SubTask 5.4: 确认本子任务未迁移退租结算、账单生成、抄表自动出账与完整页面逻辑。

- [x] Task 6: 修复 checklist 复核失败项，补齐删除关系解释与删除前事务内复核。
  - [x] SubTask 6.1: 为房间“仅合同历史”等阻断场景补充明确替代建议，保证删除与终止、归档、解绑关系可解释。
  - [x] SubTask 6.2: 将合同/房间“安全检查 + 物理删除”收口到同一事务内复核，避免 schema 级联关系在并发场景下破坏历史保留。
  - [x] SubTask 6.3: 重新运行 `npm run lint`、`npm run type-check` 并再次复核 checklist。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2, Task 3
- Task 5 depends on Task 2, Task 3, Task 4
- Task 6 depends on Task 5
