# Tasks
- [x] Task 1: 复核账单统计页在新旧宿主中的对照输入，并冻结本轮页面迁移边界。
  - [x] SubTask 1.1: 复核旧 `src/app/bills/stats/page.tsx`、`src/components/pages/BillStatsPage.tsx` 与 `src/lib/bill-stats.ts` 的页面原型、筛选结构与汇总语义。
  - [x] SubTask 1.2: 复核 `src/minix/routes/bills/*` 与当前 document fallback 入口，明确 `/bills/stats` 尚未有正式 route module 承接位。
  - [x] SubTask 1.3: 明确本轮仅处理页面 parity、宿主绑定拆分与最小 bridge 说明，不执行 `/api/bills/stats` 正式宿主切流或读模型重写。

- [x] Task 2: 建立账单统计页迁移 gap 清单，并设计最小承接方案。
  - [x] SubTask 2.1: 列出 `BillStatsPage` 当前对 `next/navigation`、旧页面协议和 retained-legacy API/query 的依赖点。
  - [x] SubTask 2.2: 设计 `BillStatsRoute` 的页面级 loader / pending / error 边界与页面主体装配顺序。
  - [x] SubTask 2.3: 输出 `/bills/stats` 从 document fallback 切到 `src/minix` 正式承接位所需的最小改动清单。

- [x] Task 3: 实现账单统计页在新宿主中的正式承接位，并完成宿主绑定拆分。
  - [x] SubTask 3.1: 新增 `/bills/stats` 的 `src/minix` route module 与正式注册。
  - [x] SubTask 3.2: 移除 `BillStatsPage` 对 `next/navigation` 的直接依赖，并清理经布局 barrel 间接带入的 `next/*` 宿主耦合，改为宿主无关的页面主体接口。
  - [x] SubTask 3.3: 确保统计页结构、筛选、汇总语义与旧原型保持一致，不重做页面信息架构。

- [x] Task 4: 收口 retained-legacy bridge 说明，并移除账单统计页的正式业务 document fallback 身份。
  - [x] SubTask 4.1: 更新 `route-navigation` 或相关页面跳转逻辑，使 `/bills/stats` 不再作为正式业务页面 fallback。
  - [x] SubTask 4.2: 更新 `server/lib/legacy-route-inventory.ts`、`server/routes/bills.ts` 或相关文档，写明 `/bills/stats` 当前 retained-legacy API/query 的 bridge 口径、静态 `/api/bills/stats` 归属与 `phase14` 退出条件。
  - [x] SubTask 4.3: 同步 `docs/phase13_*` 与相关 spec 资产中的 `/bills/stats` 状态描述。

- [x] Task 5: 完成工程验证、人工浏览器复验与独立子代理终审。
  - [x] SubTask 5.1: 执行最小工程验证，确认统计页迁移未引入 lint/type-check 失败。
  - [x] SubTask 5.2: 执行 `/bills/stats` 的人工浏览器复验，覆盖页面结构、筛选、汇总与错误边界；结论为页面成功态、筛选切换、汇总展示与 route-level 错态符合 `phase13-07` 预期。
  - [x] SubTask 5.3: 指定独立子代理终审，优先检查 UI 漂移、越界到 `phase14`、以及 `/bills/stats` 是否已脱离正式业务页面 document fallback；结论为 Pass。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 depends on Task 3
- Task 5 depends on Task 4
