# Tasks
- [x] Task 1: 盘点 rooms / contracts / checkout / bills 主链当前运行时调用方向与 retained-legacy 残留，确认本波次的真实 cutover 范围。
  - [x] SubTask 1.1: 核对 `server/routes/rooms.ts`、`contracts.ts`、`checkout.ts`、`bills.ts` 与对应 `src/app/api/**/route.ts` 的主链职责映射
  - [x] SubTask 1.2: 核对 `/rooms*`、`/add/contract`、`/contracts*`、`/bills*`、`/bills/stats` 的页面/API 调用方向
  - [x] SubTask 1.3: 列出必须从旧 Next API 迁出的 retained-legacy 主路径与允许保留的 compat/rollback-only 路径

- [x] Task 2: 完成 rooms / contracts / checkout / bills 的第一波真实 API cutover。
  - [x] SubTask 2.1: 把 rooms 主链中仍承担正式职责的目标路径切到统一 Hono 宿主
  - [x] SubTask 2.2: 把 contracts 主链读写、生命周期操作与 checkout 路径切到统一 Hono 宿主
  - [x] SubTask 2.3: 把 bills 列表、详情、明细、统计与相关主链读取切到统一 Hono 宿主
  - [x] SubTask 2.4: 保持 checkout 路由优先级、delete-guards、合同锚点与账单语义不变

- [x] Task 3: 降级旧 Next API 并同步 route inventory。
  - [x] SubTask 3.1: 将旧 `src/app/api/rooms*`、`src/app/api/contracts*`、`src/app/api/bills*` 的对应主链路径降级为 `compat-wrapper`、`rollback-only` 或明确退出候选
  - [x] SubTask 3.2: 更新 `server/lib/legacy-route-inventory.ts`，使分类结果与真实 cutover 后的运行时真相一致
  - [x] SubTask 3.3: 复核不再保留“双主宿主”描述

- [x] Task 4: 完成验证与验收材料。
  - [x] SubTask 4.1: 补一组覆盖 `rooms -> contract -> checkout -> bill` 的主链 smoke 或人工验证路径
  - [x] SubTask 4.2: 运行必要的 lint / type-check / 定向验证，确认没有引入新的错误
  - [x] SubTask 4.3: 准备独立审核所需的变更说明、风险点与验证结论

- [x] Task 5: 修正独立验收指出的真相源与验证缺口。
  - [x] SubTask 5.1: 更新 `src/lib/domain/contracts/index.ts` 中主链一致性矩阵，使正式宿主与 cutover 结果一致
  - [x] SubTask 5.2: 更新 `server/routes/bills.ts` 中过时的迁移阶段说明，避免 fallback 继续输出旧状态
  - [x] SubTask 5.3: 将主链 smoke 从“仅打印命令模板”升级为可作为本轮验收依据的真实执行或明确断言输出

- [x] Task 6: 收口运行拓扑适配与高保真终审结论。
  - [x] SubTask 6.1: 修正 `server/routes/*` 在独立 Hono runtime 下仍默认依赖 `next/cache` 的鲜度处理假设，明确区分 Next Route Handler 与 Hono runtime 的路径鲜度策略
  - [x] SubTask 6.2: 补齐 contracts / checkout / bills 的账单缓存失效链与 legacy 成功响应契约，使切流后行为继续以旧 `Rento` 业务逻辑为原型高保真适配新路线
  - [x] SubTask 6.3: 在修复后再次执行 `type-check`、`lint`、`smoke:phase09:all` 与独立子代理终审，确认当前审查范围内已无阻断 `100%` 高保真还原的剩余偏离
  - [x] Completion Note: 已完成 `revalidateMutationPaths()` 的运行拓扑适配，Hono 正式宿主不再把 `next/cache` 视为默认刷新方案；本轮高保真专项审查、双子代理复核与终审均已收口到 `acceptance.md`，当前可将 `phase14-05` 视为“运行拓扑适配 + 高保真终审通过”。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 2
- Task 5 depends on Task 4
- Task 6 depends on Task 5
