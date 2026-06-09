# Tasks
- [x] Task 1: 拆分账务 shared 与 server-only 边界，阻断 `bill-semantics` 到 Prisma 的运行时泄漏。
  - [x] SubTask 1.1: 盘点 `src/lib/bill-semantics.ts` 当前对前端实际提供的纯 shared 能力，明确哪些导出必须保留给客户端复用
  - [x] SubTask 1.2: 将前端可复用的账单展示语义拆到纯 shared 模块，并让 `BillListPage`、账单统计等客户端页面改为依赖该 shared 模块
  - [x] SubTask 1.3: 让 `src/lib/domain/billing/index.ts` 继续作为服务端账务真相源，但前端运行时不再通过 compat wrapper 间接导入

- [x] Task 2: 重构退租结算共享逻辑，去除客户端可达链路中的 Prisma 依赖。
  - [x] SubTask 2.1: 梳理 `src/lib/checkout-settlement.ts` 对 `bill-semantics` 与 `@prisma/client` 的依赖，冻结前端真正需要的 shared 输入输出结构
  - [x] SubTask 2.2: 让 `CheckoutContractPage` 及相关退租页面只依赖 shared 账务语义与本地 DTO，不再依赖 Prisma 类型或服务端实现
  - [x] SubTask 2.3: 复核退租结算预览、调整校验与结算后状态推导语义在重构后保持稳定

- [x] Task 3: 清理前端可达模块中的 Prisma 类型直连，收口客户端 DTO / view-model 边界。
  - [x] SubTask 3.1: 梳理 `src/types/database.ts` 与前端页面/组件中 `@prisma/client` 的直接类型引用
  - [x] SubTask 3.2: 用面向前端的 DTO / view-model 类型替换客户端可达链路中的 Prisma 生成类型
  - [x] SubTask 3.3: 复核账单页、房源页、退租页等高风险页面在类型替换后不引入新的展示或交互回归

- [x] Task 4: 收口路由首包装载边界，确保首页启动不再被高风险模块污染。
  - [x] SubTask 4.1: 复核 `src/minix/router/index.tsx` 的首包装载风险，确认本轮至少实现首页首包不再受 server-only 模块影响
  - [x] SubTask 4.2: 如有必要，以最小边界调整高风险 route module 的装载方式，但不得用懒加载替代源码层边界修复
  - [x] SubTask 4.3: 确认访问 `/` 时不会因为账单页或退租页的共享逻辑再触发浏览器级崩溃

- [x] Task 5: 完成工程验证与浏览器验收，证明 `fix_014` 已达到收口条件。
  - [x] SubTask 5.1: 运行 `npm run lint`
  - [x] SubTask 5.2: 运行 `npm run type-check`
  - [x] SubTask 5.3: 运行 `npm run build:minix:pwa`
  - [x] SubTask 5.4: 进行浏览器或等价部署复核，确认 `/`、`/bills`、`/contracts/:id/checkout` 不再触发 `.prisma/client/index-browser` 相关错误

# Task Dependencies
- `Task 2` depends on `Task 1`
- `Task 3` depends on `Task 1`
- `Task 4` depends on `Task 1`, `Task 2`
- `Task 5` depends on `Task 2`, `Task 3`, `Task 4`
