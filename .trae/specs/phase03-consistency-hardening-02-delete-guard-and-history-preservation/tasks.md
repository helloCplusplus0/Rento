# Tasks

- [x] Task 1: 收紧共享删除安全检查
  - [x] SubTask 1.1: 调整 `src/lib/validation.ts`，补强房间删除安全检查，覆盖合同链、账务链、仪表链和抄表链
  - [x] SubTask 1.2: 调整 `src/lib/validation.ts`，补强合同删除安全检查，明确哪些状态、账单和抄表事实禁止删除
  - [x] SubTask 1.3: 明确删除失败时的业务错误码、建议动作和服务端判断口径

- [x] Task 2: 收紧查询层默认删除路径
  - [x] SubTask 2.1: 调整 `src/lib/queries.ts` 中房间、合同、账单、仪表、抄表的默认删除能力
  - [x] SubTask 2.2: 确保查询层不再被当作普通无条件物理删除入口

- [x] Task 3: 修正房间、合同、账单、仪表详情 API 的删除行为
  - [x] SubTask 3.1: 调整 `src/app/api/rooms/[id]/route.ts`，去掉默认清空合同和账单历史的路径
  - [x] SubTask 3.2: 调整 `src/app/api/contracts/[id]/route.ts`，避免通过删除合同清空未支付账单和抄表记录
  - [x] SubTask 3.3: 调整 `src/app/api/meters/[meterId]/route.ts`，优先停用或解绑而不是硬删除
  - [x] SubTask 3.4: 调整 `src/app/api/bills/[id]/route.ts`，补强账单删除状态门禁

- [x] Task 4: 完成验证与验收回写
  - [x] SubTask 4.1: 执行 `npm run lint`
  - [x] SubTask 4.2: 执行 `npm run type-check`
  - [x] SubTask 4.3: 补并执行至少一条覆盖 `rooms/contracts/bills/meters` 删除门禁的可执行验证路径，且不依赖宿主机数据库
  - [x] SubTask 4.4: 回写 `tasks.md` 与 `checklist.md`

# Task Dependencies

- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]
