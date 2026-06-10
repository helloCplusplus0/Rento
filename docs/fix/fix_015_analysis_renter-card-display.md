# Fix 015 Analysis - 租客卡片显示与租客详情当前状态表达不清

## 1. 问题摘要
- 对应问题：`fix_015`
- 问题级别：`P1`
- 是否阻断修复：否

## 2. 根因结论
- 根因一：租客列表卡片当前把“租客基础资料”和“当前生效合同快照”混合展示，但查询层没有稳定提供对应合同字段。
  - [RenterCard.tsx](file:///home/dell/Projects/Rento/src/components/business/RenterCard.tsx#L54-L69) 会在卡片中展示“当前房间”和“月租金”，这两个字段都来自 `ACTIVE` 合同而不是租客实体本身。
  - 但 [optimized-queries.ts](file:///home/dell/Projects/Rento/src/lib/optimized-queries.ts#L377-L400) 的列表优化查询没有选出 `monthlyRent`、`deposit`、`totalRent` 等金额字段，导致后续序列化和前端标准化只能把缺失值回退为 `0`。
- 根因二：详情页“当前状态”区块只保留了 badge + 房间文本，表达粒度过低，无法准确传达“当前租住事实”。
  - [RenterBasicInfo.tsx](file:///home/dell/Projects/Rento/src/components/business/RenterBasicInfo.tsx#L139-L154) 当前只展示“在租/空闲”与“当前房间”，没有状态解释、合同时间或当前租住摘要。
  - [renter-detail-mobile-styles.ts](file:///home/dell/Projects/Rento/src/components/business/renter-detail-mobile-styles.ts#L26-L27) 也把该区块压成了单行对齐样式，视觉上弱于房间详情中的状态表达。
- 根因三：组件层大量使用 `any`，让“字段未返回但界面仍继续渲染”的问题在开发期没有暴露。
  - [RenterCard.tsx](file:///home/dell/Projects/Rento/src/components/business/RenterCard.tsx#L11-L14)、[RenterBasicInfo.tsx](file:///home/dell/Projects/Rento/src/components/business/RenterBasicInfo.tsx#L10-L12)、[RenterContractHistory.tsx](file:///home/dell/Projects/Rento/src/components/business/RenterContractHistory.tsx#L11-L14) 都没有显式约束到 `RenterWithContractsForClient`。
- 根因四：当前没有冻结“租客卡片应展示什么”的领域边界，导致界面语义模糊。
  - 租客是人，合同是租住事实主锚点；因此卡片若展示租金、房间，就必须明确这属于“当前生效合同快照”，而不是租客固定属性。

## 3. 证据链
- 页面预展示链路：
  - 租客列表页由 [RenterListRoute.tsx](file:///home/dell/Projects/Rento/src/minix/routes/renters/RenterListRoute.tsx) 装配，最终渲染 [RenterListPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/RenterListPage.tsx#L103-L139) 和 [RenterCard.tsx](file:///home/dell/Projects/Rento/src/components/business/RenterCard.tsx#L16-L110)。
  - 租客详情页由 [RenterDetailRoute.tsx](file:///home/dell/Projects/Rento/src/minix/routes/renters/RenterDetailRoute.tsx) 装配，最终渲染 [RenterDetailPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/RenterDetailPage.tsx#L86-L111) 与 [RenterBasicInfo.tsx](file:///home/dell/Projects/Rento/src/components/business/RenterBasicInfo.tsx#L14-L168)。
- 服务端实际取数链路：
  - 列表 loader 走 [primary-route-data.ts](file:///home/dell/Projects/Rento/src/minix/lib/primary-route-data.ts#L1370-L1393)，底层调用 `/renters`。
  - `/renters` 正式宿主最终走 [renters-route-service.ts](file:///home/dell/Projects/Rento/server/lib/renters-route-service.ts#L132-L164)，查询底层是 [optimized-queries.ts](file:///home/dell/Projects/Rento/src/lib/optimized-queries.ts#L317-L418)。
  - 详情页 loader 走 [primary-route-data.ts](file:///home/dell/Projects/Rento/src/minix/lib/primary-route-data.ts#L1396-L1405)，详情底层是 [queries.ts](file:///home/dell/Projects/Rento/src/lib/queries.ts#L510-L524)。
- 数据模型映射：
  - `RenterWithContractsForClient` 明确要求合同项带有 `monthlyRent`、`deposit`、`totalRent` 等数值字段，见 [database.ts](file:///home/dell/Projects/Rento/src/types/database.ts#L205-L223)。
  - 但列表查询只返回了合同 `id/status/startDate/endDate/room`，未满足该 DTO 的实际展示需要，见 [optimized-queries.ts](file:///home/dell/Projects/Rento/src/lib/optimized-queries.ts#L379-L400)。
- 关键代码位置：
  - 卡片月租展示：[RenterCard.tsx](file:///home/dell/Projects/Rento/src/components/business/RenterCard.tsx#L64-L68)
  - 当前状态展示：[RenterBasicInfo.tsx](file:///home/dell/Projects/Rento/src/components/business/RenterBasicInfo.tsx#L139-L154)
  - 金额序列化：[renters-route-service.ts](file:///home/dell/Projects/Rento/server/lib/renters-route-service.ts#L94-L103)
  - 前端数值回退为 `0`：[primary-route-data.ts](file:///home/dell/Projects/Rento/src/minix/lib/primary-route-data.ts#L311-L332) 与 [primary-route-data.ts](file:///home/dell/Projects/Rento/src/minix/lib/primary-route-data.ts#L528-L548)
- 旧原型与当前实现关系：
  - 旧 `src/app` 与新 `src/minix` 复用了同一套共享页面组件，说明“卡片展示哪些字段”本身就是当前原型真相，而不是新宿主单独引入的漂移，见 [旧列表页入口](file:///home/dell/Projects/Rento/src/app/renters/page.tsx) 与 [新列表路由](file:///home/dell/Projects/Rento/src/minix/routes/renters/RenterListRoute.tsx)。
- 是否存在历史脏数据：
  - 不存在。
  - 当前问题是展示边界与查询字段不匹配，不涉及合同、账单、房间或租客历史记录修复。

## 4. 影响面分析
- 租客列表页：
  - 有生效合同的租客卡片会展示错误的 `月租金 = 0`，造成“合同未联动”或“租金为零”的误判。
- 租客详情页：
  - “当前状态”区块信息量不足，用户需要额外阅读合同历史才能理解当前租住事实。
- 合同关联认知：
  - 如果不先明确“租客卡片是否允许展示合同快照”，后续新增租客标签、风险提示或账务摘要时会继续出现语义混写。
- 类型与回归风险：
  - 由于组件使用 `any`，后续即使再遗漏字段，也可能继续以 `0`、空字符串或空态悄悄落到页面上。
- 历史数据：
  - 不受影响。

## 5. 候选方案对比
### 方案 A
- 做法：
  - 只做最小修补：给列表查询补回 `monthlyRent`，并对详情“当前状态”做局部样式优化。
- 优点：
  - 改动面小，能尽快修复“月租金显示 0”。
- 风险：
  - 没有回答“租客卡片到底应展示什么”这个核心问题。
  - 未来再加字段时，仍可能继续混淆租客资料与合同快照边界。

### 方案 B
- 做法：
  - 把卡片中的“当前房间”“月租金”全部移除，只保留租客基础资料；合同相关信息全部下沉到详情页或合同历史区。
- 优点：
  - 租客实体语义最纯粹，边界非常清晰。
- 风险：
  - 偏离当前原型和既有操作习惯，降低列表页的业务判断效率。
  - 不符合当前项目“优先承接旧 UI 原型与信息结构”的迁移约束。

### 方案 C
- 做法：
  - 明确把租客卡片定义为“租客身份摘要 + 当前生效合同快照”。
  - 补齐列表查询需要的合同字段，确保卡片展示真实月租金。
  - 把详情页“当前状态”升级为同类基线的三段式表达：状态 badge、当前房间/合同摘要、状态说明。
  - 同步收紧相关组件类型，避免同类缺字段问题再次静默发生。
- 优点：
  - 既保留当前列表页的业务价值，也把语义边界说清楚。
  - 最符合“合同是租务事实主锚点 + 旧原型优先承接”的项目约束。
  - 能同时解决数据显示错误与状态表达不清两个问题。
- 风险：
  - 改动面比纯样式修补稍大，需要同步调整查询层、序列化层、组件层和视觉表达。

## 6. 推荐方案
- 推荐原因：
  - 推荐采用 **方案 C：把租客卡片明确为“租客身份摘要 + 当前生效合同快照”，并同步补齐查询字段、状态表达与类型约束**。
  - 从业务语义上，租客卡片最应该帮助操作者快速判断三件事：`是谁`、`当前是否在租`、`如果在租，租住在哪个房间、按什么月租执行`。
  - 从迁移约束上，当前共享组件已经是旧原型真相源，直接删除合同快照信息会造成 UI 信息结构倒退，不符合“默认承接旧页面原型”的规则。
- 实施边界：
  - 卡片语义层：
    - 保留 `姓名 / 手机号 / 在租状态 / 当前房间 / 月租金 / 入住日期 / 历史合同数`。
    - 但要把“当前房间”“月租金”明确定义为 **当前生效合同快照**，只在存在 `ACTIVE` 合同时展示真实值。
  - 查询与序列化层：
    - 列表查询补齐 `monthlyRent`，必要时一并补 `contractNumber`、`deposit`、`totalRent` 这类当前快照可能用到的稳定字段。
    - 避免前端把“字段缺失”静默归零后直接展示。
  - 详情状态层：
    - 当前状态区块对齐房间状态类组件的表达方式，至少展示：
      - 状态 badge
      - 当前房间
      - 当前合同时间范围或当前月租金中的一项主摘要
      - 一条解释文本，例如“当前存在生效合同，租客处于正常在租状态”
    - 若没有活跃合同，则清晰表达“当前无生效合同，租客处于空闲状态”。
  - 类型收口层：
    - 优先把 `RenterCard`、`RenterBasicInfo`、`RenterGrid`、`RenterContractHistory` 的 `any` 收紧到 `RenterWithContractsForClient` 或对应裁剪后的 view-model。
  - UI 保真层：
    - 不重做整页信息架构，不新增第二套视觉体系，只做同类基线对齐和最小信息层级优化。
- 明确不在本次修复范围内的内容：
  - 不重开租客列表“服务端搜索/筛选全面重构”议题。
  - 不调整租客详情页的整体分栏结构和操作流。
  - 不修改租客、合同、账单、房间的历史业务事实。
  - 不在本次 fix 中重构 compat 写路径或扩大到新的 API phase。

## 7. 数据修复策略
- 是否需要修历史数据：不需要。
- 若不需要，原因：
  - 当前问题来自列表查询字段缺失与前端展示边界不清，不涉及数据库中租客或合同事实错误。

## 8. 验收标准
- 卡片展示层满足：
  - 对存在 `ACTIVE` 合同的租客，列表卡片展示的月租金必须与该活跃合同真实 `monthlyRent` 一致，不再错误显示 `0`。
  - 对不存在 `ACTIVE` 合同的租客，卡片不得展示误导性的房间或月租快照。
- 状态表达层满足：
  - 租客详情页“当前状态”区块应具备清晰的状态 badge、关联房间/合同摘要与状态说明，视觉层级对齐同类状态卡基线。
- 领域语义层满足：
  - 页面文案与结构能清楚区分“租客基础资料”和“当前生效合同快照”，不把合同快照误表述成租客固定属性。
- 工程校验层满足：
  - `npm run lint` 通过。
  - `npm run type-check` 通过。
  - 至少完成一轮人工页面复核：
    - `/renters`
    - `/renters/:id`
    - 至少覆盖“有生效合同租客”和“无生效合同租客”两类样例。

## 9. 回滚条件
- 若修复后列表卡片改为展示历史合同而不是当前 `ACTIVE` 合同，应停止并回滚。
- 若为了修复 `0` 值显示而删除当前原型中的关键业务信息，导致列表页失去快速判断租住状态的能力，应停止并回滚。
- 若详情页“当前状态”优化引入新的 UI 漂移，明显偏离现有同类组件基线，应停止并回滚。
- 若类型收口或查询调整导致租客列表/详情页运行失败、空白或合同历史异常缺失，应停止并回滚。
