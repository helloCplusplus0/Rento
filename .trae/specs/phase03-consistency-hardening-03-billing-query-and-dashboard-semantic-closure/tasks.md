# Tasks

- [x] Task 1: 冻结账务字段与状态语义基线
  - [x] SubTask 1.1: 审视 `optimized-queries.ts`、`dashboard-queries.ts`、`queries.ts` 中当前金额字段与状态判断的实际口径
  - [x] SubTask 1.2: 对照 `schema.prisma` 与 `phase03_consistency_hardening_shared_baseline.md`，明确 `pendingAmount`、`receivedAmount` 与 `BillStatus` 的统一解释
  - [x] SubTask 1.3: 记录需要淘汰的历史漂移字段引用与替换目标

- [x] Task 2: 修复账务查询层字段漂移
  - [x] SubTask 2.1: 修复 `src/lib/optimized-queries.ts` 中与 schema 不一致的字段引用
  - [x] SubTask 2.2: 必要时同步修正 `src/lib/queries.ts` 中与账务语义直接相关的聚合或映射逻辑
  - [x] SubTask 2.3: 保证查询结果字段仍能被现有调用方稳定消费

- [x] Task 3: 收口仪表盘统计与状态分布语义
  - [x] SubTask 3.1: 修正 `src/lib/dashboard-queries.ts` 中待收、已收、趋势和状态分布的聚合口径
  - [x] SubTask 3.2: 必要时补强 `src/app/api/dashboard/stats/route.ts` 的服务端返回语义
  - [x] SubTask 3.3: 确保 `PENDING / PAID / OVERDUE / COMPLETED` 在统计与查询层口径一致

- [x] Task 4: 收口账单状态接口语义
  - [x] SubTask 4.1: 必要时检查并修正 `src/app/api/bills/[id]/status/route.ts` 的状态变更语义
  - [x] SubTask 4.2: 必要时检查账单详情或相关 API 是否仍返回模糊金额或状态解释

- [x] Task 5: 验证账务主链语义一致性
  - [x] SubTask 5.1: 执行 `npm run lint`
  - [x] SubTask 5.2: 执行 `npm run type-check`
  - [x] SubTask 5.3: 提供至少一条覆盖账单状态、待收金额或仪表盘统计的可执行验证路径
    - 验证路径：在已登录会话下调用 `POST /api/validation`，其会进入 `BusinessFlowValidator.validateAllFlows()` 并执行 `validateBillGenerationFlow()`；该流程会生成账单后执行“验证账单支付流程”，把账单更新为 `PAID`，同时校验 `receivedAmount` 与 `pendingAmount` 的账务语义

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 2
- Task 5 depends on Task 3
- Task 5 depends on Task 4
