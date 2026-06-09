# Fix 014 Analysis - 前端浏览器包误引入 Prisma 的系统性边界泄漏

## 1. 问题摘要
- 对应问题：`fix_014`
- 问题级别：`P0`
- 是否阻断修复：是

本问题不是单点页面逻辑错误，也不是正式部署链本身失效，而是前端浏览器运行时、共享语义层与服务端领域模块之间的边界被打穿，最终导致 Prisma 进入浏览器依赖图并在首页首屏阶段触发白屏。  
由于当前问题直接阻断真实云服务器上的根路径访问，已经构成 `phase16` 下的 cutover blocker，不能以局部热修或“只修某个页面”方式处理，必须先按 fix 工作流系统性收口。

## 2. 根因结论
- 根因一：账务兼容包装层把 server-only 账务域模块以运行时导出形式暴露给前端页面。
  - `src/lib/bill-semantics.ts` 当前不是纯 shared helper，而是直接运行时 re-export `src/lib/domain/billing`，导致客户端页面一旦引用账单展示语义，就会把服务端账务域一并拉入浏览器模块图。
- 根因二：服务端账务域模块在顶层直接绑定 Prisma、事务层和数据库单例。
  - `src/lib/domain/billing/index.ts` 顶层直接导入 `@prisma/client`、`prisma` 单例和事务管理器，因此只要该模块进入浏览器构建图，Prisma 就会被 Vite 按浏览器条件导出解析。
- 根因三：退租结算共享逻辑继续依赖账务兼容层，形成第二条前端到 Prisma 的运行时链路。
  - `src/lib/checkout-settlement.ts` 被客户端退租页面运行时引用，同时又依赖 `bill-semantics`，导致退租页与账务页都存在同类边界泄漏。
- 根因四：前端路由采用静态全量导入策略，放大了单点污染的影响范围。
  - `src/minix/router/index.tsx` 顶层静态导入所有 route module，使得账单页或退租页中的错误依赖链不是“进入该页面才触发”，而是在首页首包启动时就被整体装入。
- 根因五：部分前端可达模块仍直接接触 Prisma 类型，持续放大边界模糊风险。
  - `src/types/database.ts` 与多个页面/组件仍直接引用 `@prisma/client` 类型，虽然不一定是此次白屏的首要运行时触发点，但它们证明当前前后端共享边界并未真正收口。

## 3. 证据链
- 页面预展示链路：
  - 浏览器访问 `https://rento2026.top/` 后首页白屏，说明问题发生在前端启动期而不是用户进入某个深层业务页之后。
  - 前端入口为 [main.tsx](file:///home/dell/Projects/Rento/src/minix/main.tsx) -> [App.tsx](file:///home/dell/Projects/Rento/src/minix/App.tsx) -> [router/index.tsx](file:///home/dell/Projects/Rento/src/minix/router/index.tsx)。
- 浏览器实际解析链路：
  - [router/index.tsx](file:///home/dell/Projects/Rento/src/minix/router/index.tsx) 顶层静态导入 [BillListRoute.tsx](file:///home/dell/Projects/Rento/src/minix/routes/bills/BillListRoute.tsx) 与 [ContractCheckoutRoute.tsx](file:///home/dell/Projects/Rento/src/minix/routes/contracts/ContractCheckoutRoute.tsx)。
  - [BillListRoute.tsx](file:///home/dell/Projects/Rento/src/minix/routes/bills/BillListRoute.tsx) 引入 [BillListPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/BillListPage.tsx)，而 [BillListPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/BillListPage.tsx#L6-L11) 在运行时导入 `buildBillPresentationStats`、`getBillPresentationStatus`、`sortBillsForDisplay` 等账单语义能力。
  - 这些能力来自 [bill-semantics.ts](file:///home/dell/Projects/Rento/src/lib/bill-semantics.ts#L1-L30)，而该文件当前运行时直接 re-export [domain/billing/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/billing/index.ts)。
  - [domain/billing/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/billing/index.ts#L5-L14) 顶层直接导入 `@prisma/client`、`prisma` 与事务管理器。
  - [ContractCheckoutRoute.tsx](file:///home/dell/Projects/Rento/src/minix/routes/contracts/ContractCheckoutRoute.tsx) 引入 [CheckoutContractPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/CheckoutContractPage.tsx)，该页面在运行时导入 [checkout-settlement.ts](file:///home/dell/Projects/Rento/src/lib/checkout-settlement.ts#L1-L9)，后者继续依赖 `bill-semantics`，形成第二条同类链路。
- Prisma 浏览器行为证据：
  - Prisma Client 在浏览器环境下不会正常提供数据库能力，而会命中 browser stub；当前线上错误信息正是 `.prisma/client/index-browser` 解析失败，这与“Prisma 被浏览器构建图误引用”的特征完全一致。
- 关键代码位置：
  - 前端入口：`src/minix/main.tsx`
  - 路由装载：`src/minix/router/index.tsx`
  - 客户端账单页：`src/components/pages/BillListPage.tsx`
  - 兼容包装层：`src/lib/bill-semantics.ts`
  - 服务端账务域：`src/lib/domain/billing/index.ts`
  - 客户端退租页：`src/components/pages/CheckoutContractPage.tsx`
  - 退租结算共享逻辑：`src/lib/checkout-settlement.ts`
  - Prisma 单例：`src/lib/prisma.ts`
- 是否存在历史脏数据：不存在。
  - 当前问题影响的是浏览器运行时边界，不涉及合同、账单、抄表、仪表等历史事实的数据库修复。

## 4. 影响面分析
- 首页 / 登录前入口：
  - 因为错误发生在前端首包启动期，所以即使用户尚未进入账单或退租页，根路径访问也会被整体阻断。
- 账单相关页面：
  - 账单列表、账单统计及可能复用账务展示语义的客户端页面都处于高风险范围。
- 退租相关页面：
  - 退租页通过 `checkout-settlement` 间接依赖账务兼容层，属于第二条明确风险链。
- 共享前端类型与组件：
  - 继续直接依赖 `@prisma/client` 类型的共享类型入口和前端组件会放大后续复发风险。
- 正式部署验收：
  - 当前问题直接阻断真实云服务器可用性验证，若不先修复，`phase16` 无法进入下一轮正式部署复判。

## 5. 候选方案对比
### 方案 A
- 做法：
  - 仅在 Vite 构建侧通过 `alias`、`external`、空模块替换等方式屏蔽 Prisma 进入浏览器包。
- 优点：
  - 落地快，短期可能迅速消除当前白屏。
- 风险：
  - 只是构建层止血，没有修复源码层 shared/server 边界混写。
  - 一旦未来新增其他共享文件或构建策略变化，同类问题仍可能再次出现。
  - 可能把真实运行时错误转化为更隐蔽的功能缺失或 silent failure。

### 方案 B
- 做法：
  - 从源码层拆分 shared 语义与 server-only 领域模块：
    - `bill-semantics` 只保留前端可复用的 shared 账单展示语义
    - `domain/billing` 明确收口为 server-only
    - `checkout-settlement` 改为只依赖 shared DTO / shared 语义，不再碰 Prisma 相关类型或服务端实现
    - 清理前端可达链路中的 `@prisma/client` 类型直连
    - 在完成源码层边界收口后，再视需要评估是否补充构建层守护
- 优点：
  - 能从根上修复“浏览器误接触 Prisma”问题。
  - 最符合当前项目“单一前端、单一真相源、前后端边界明确”的治理方向。
  - 更有利于后续继续推进 `phase16` 的真实部署和 cutover 复判。
- 风险：
  - 改动面会覆盖账单语义、退租结算和共享类型层，需要严谨回归验证。
  - 若拆分边界不彻底，容易出现“表面不报错，但仍残留第二条泄漏链”的假修复。

### 方案 C
- 做法：
  - 只做路由懒加载，把账单与退租页面延迟到访问时再加载，以避免首页首包立即触发 Prisma 链。
- 优点：
  - 能降低静态全量导入带来的放大效应，使首页短期恢复可访问。
- 风险：
  - 不能解决客户端页面本身仍在运行时依赖 server-only 模块的问题。
  - 用户进入账单或退租页时仍可能触发同类报错，只是把问题从首页挪到了二级页面。

## 6. 推荐方案
- 推荐原因：
  - 推荐采用 **方案 B：先从源码层系统性拆分 shared 与 server-only 边界，再按需补充构建层守护**。
  - 当前问题本质是共享模块边界设计错误，而不是单纯的打包器配置偏差；如果不先修复源码边界，任何构建层修补都只是临时止血。
  - 方案 B 既能解决本次线上白屏，也能减少同类问题在账单、退租和后续页面中的再次出现。
- 实施边界：
  - 账务语义层：
    - 将 `src/lib/bill-semantics.ts` 拆为纯 shared 账单展示语义，不再运行时 re-export `src/lib/domain/billing`。
    - 仅保留前端可复用的排序、展示状态、金额格式化与统计汇总等纯函数能力。
  - 服务端账务域：
    - `src/lib/domain/billing/index.ts` 继续作为正式账务服务端真相源，但明确禁止前端运行时直接引用。
    - 需要时补充更清晰的 server-only 落点或边界注释。
  - 退租结算层：
    - `src/lib/checkout-settlement.ts` 改为只依赖 shared 账单语义与本地 DTO，不再导入 Prisma 类型。
  - 共享类型层：
    - 清理 `src/types/database.ts` 及前端组件内对 `@prisma/client` 的直连，替换为面向前端的 DTO / view-model 类型。
  - 路由装载层：
    - 本轮至少完成首包不再受 Prisma 泄漏影响的收口。
    - 是否进一步改为 lazy route，可作为增强项评估，但不能替代源码层边界修复。
- 明确不在本次修复范围内的内容：
  - 不在 `fix_014` 中重开 `phase14` 或新增正式业务 API 迁移职责。
  - 不在 `fix_014` 中顺手重做整套路由信息架构或页面视觉表达。
  - 不在 `fix_014` 中修改合同、账单、抄表、仪表等数据库历史事实。
  - 不在 `fix_014` 中通过放宽部署边界或改回 legacy 运行线掩盖问题。

## 7. 数据修复策略
- 是否需要修历史数据：不需要。
- 若需要，修复范围：
  - 不适用。
- 若不需要，原因：
  - `fix_014` 处理的是浏览器构建与运行时边界问题，不涉及数据库记录修正、迁移链修复或历史账务事实补录。

## 8. 验收标准
- 浏览器首包层满足：
  - 访问 `/` 不再白屏，前端应用能正常进入登录页或工作台。
  - 浏览器控制台不再出现 `.prisma/client/index-browser` 相关报错。
- 依赖边界层满足：
  - 前端可达模块中不再存在把 `domain/billing`、`prisma` 单例或事务层直接带入浏览器运行时的链路。
  - 前端关键共享模块不再运行时依赖 `@prisma/client`。
- 页面主链层满足：
  - `/bills` 与 `/contracts/:id/checkout` 在前端可正常加载，不因 Prisma 浏览器依赖再触发运行时崩溃。
  - 修复后不破坏账单展示语义、退租结算预览语义与相关页面基础交互。
- 工程校验层满足：
  - `npm run lint` 通过。
  - `npm run type-check` 通过。
  - `npm run build:minix:pwa` 通过。
  - 至少完成 1 轮浏览器复核或等价的真实部署复核，确认首页不再白屏。

## 9. 回滚条件
- 若实施过程中出现以下任一情况，必须停止并回滚本轮：
  - 为绕过 Prisma 报错而把账单或退租正式能力改造成静默缺失、伪成功或被错误降级。
  - 账务 shared/server 拆分后导致账单状态、金额语义或退租结算主链出现明显行为回归。
  - 为解决首页白屏而重新引入第二套前端宿主、第二套共享类型真相源或新的临时兼容层。
  - 构建层虽不再报 Prisma 错误，但前端业务页进入后仍稳定触发同类运行时崩溃。
