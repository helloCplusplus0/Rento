# Tasks
- [x] Task 1: 抽取抄表写入与记录类型共享服务，建立抄表主链的正式承接位。
  - [x] SubTask 1.1: 基于 `src/app/api/meter-readings/route.ts` 与 `docs/fix/fix_003_analysis_meter-reading-replacement.md` 梳理抄表创建、周期判重与 `recordType` 语义。
  - [x] SubTask 1.2: 在 `src/lib/domain/meters/*` 中创建抄表写入、详情查询与结构化记录类型服务入口。
  - [x] SubTask 1.3: 让 `server/routes/meter-readings.ts` 为抄表写入与详情查询预留正式消费入口。

- [x] Task 2: 抽取抄表自动出账与相关账单追溯共享服务，冻结多仪表追溯主链。
  - [x] SubTask 2.1: 基于 `src/app/api/meter-readings/[id]/related-bills/route.ts` 与 `src/app/api/utility-readings/route.ts` 提炼自动出账、metadata 追溯和汇总语义。
  - [x] SubTask 2.2: 在 `src/lib/domain/meters/*` 中创建自动出账与相关账单追溯服务入口，但不迁入治理/辅助统计接口。
  - [x] SubTask 2.3: 让 `server/routes/meter-readings.ts` 或 compat 入口消费新的抄表出账与相关账单追溯服务，并保留 compat 边界说明。

- [x] Task 3: 抽取 `CHECKOUT_FINAL` 与抄表禁删共享语义，冻结历史保留边界。
  - [x] SubTask 3.1: 基于 `prisma/schema.prisma` 与现有抄表详情 API 梳理 `INITIAL_BASELINE / REGULAR_READING / CHECKOUT_FINAL` 的结构化语义边界。
  - [x] SubTask 3.2: 在 `src/lib/domain/meters/*` 中创建最终抄表语义与禁删策略服务入口。
  - [x] SubTask 3.3: 让 `server/routes/meter-readings.ts` 与旧 compat 入口对抄表禁删和最终抄表语义保持一致。

- [x] Task 4: 收口旧抄表宿主 compat wrapper，使旧入口不再独占抄表主链真相。
  - [x] SubTask 4.1: 更新 `src/app/api/meter-readings/route.ts` 与 `src/app/api/meter-readings/[id]/route.ts`，使其通过共享领域服务或正式宿主消费抄表写入、详情与禁删结果。
  - [x] SubTask 4.2: 更新 `src/app/api/meter-readings/[id]/related-bills/route.ts` 与 `src/app/api/utility-readings/route.ts`，使其通过共享服务消费相关账单追溯与自动出账结果。
  - [x] SubTask 4.3: 在旧入口中补足 compat wrapper 的存在原因与退出条件，不新增第二套抄表规则。

- [x] Task 5: 完成实现校验，确认抄表主链已由新主线正式承接且历史保留未被破坏。
  - [x] SubTask 5.1: 运行 `npm run lint`。
  - [x] SubTask 5.2: 运行 `npm run type-check`。
  - [x] SubTask 5.3: 复核多仪表抄表链、自动出账、相关账单追溯与最终抄表语义在共享服务层与正式宿主中均可解释。
  - [x] SubTask 5.4: 确认本子任务未迁移治理/辅助统计接口、完整观测能力或完整页面展示层。

- [x] Task 6: 修复 checklist 复核失败项，补齐旧 compat 入口收口与终抄页面提交链路。
  - [x] SubTask 6.1: 将 `src/app/api/meter-readings/[id]` 的旧 `PUT` 更新路径退化为 compat wrapper 或显式禁用，避免保留第二套抄表修改语义。
  - [x] SubTask 6.2: 让退租页面真实采集并提交 `finalMeterReadings`，打通 `CHECKOUT_FINAL` 终抄数据链路。
  - [x] SubTask 6.3: 重新运行 `npm run lint`、`npm run type-check` 并再次复核 checklist。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2, Task 3
- Task 5 depends on Task 2, Task 3, Task 4
- Task 6 depends on Task 5
