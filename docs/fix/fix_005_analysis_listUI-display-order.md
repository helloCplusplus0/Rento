# Fix 005 Analysis - 列表UI展示顺序问题

## 1. 问题摘要
- 对应问题：`fix_005`
- 问题级别：`P1 / fix-now`
- 是否阻断修复：否

本问题不是账单金额或状态事实错误，而是“账单列表展示顺序语义”没有被系统统一冻结，导致不同入口对同一批账单给出不同的视觉顺序：
- 第一类：合同详情页账单历史 Tab 由前端本地按 `createdAt` 倒序排序。
- 第二类：账单列表页由查询层按 `dueDate` 倒序返回，前端只做筛选不做二次排序。
- 第三类：你期望的“在时间由近及远前提下，未完结账单优先于已完结账单”这一规则，当前代码里根本没有真正落到任何一个列表排序器中。

## 2. 根因结论
- 根因一：合同详情页账单历史 Tab 的排序真相源在前端组件本地，而不是查询层。它直接把 `contract.bills` 按 `createdAt desc` 排序，没有使用共享排序工具，也没有按账单状态做二级优先级排序。
- 根因二：账单列表页的排序真相源在查询层 `billQueries.findAll()`，当前默认规则是 `dueDate desc`；页面本身只做搜索和状态筛选，不做二次排序，因此与合同详情页天然分叉。
- 根因三：系统虽然已经有统一的账单展示状态语义 `OPEN / OVERDUE / SETTLED`，但这套语义目前主要用于统计和筛选，不用于列表排序；因此“待处理账单优先展示”只存在于业务期望中，没有被实现成统一排序规则。
- 根因四：账单查询层内部本身也存在排序口径不完全一致的问题：SSR 列表页走 `billQueries.findAll()` 只按 `dueDate desc`，而 `/api/bills` 的优化查询又是 `dueDate desc + createdAt desc`。即使账单列表页未来接 API，也可能与当前 SSR 结果不同。

## 3. 证据链
- 页面预展示链路：
  - 合同详情页 `src/app/contracts/[id]/page.tsx` 通过 `contractQueries.findById(id)` 取回合同和关联账单，再传给 [ContractDetailPage](file:///home/dell/Projects/Rento/src/components/pages/ContractDetailPage.tsx) 和 [EnhancedContractDetail](file:///home/dell/Projects/Rento/src/components/business/EnhancedContractDetail.tsx)。
  - 合同详情页账单历史 Tab 在 [EnhancedContractDetail.tsx](file:///home/dell/Projects/Rento/src/components/business/EnhancedContractDetail.tsx#L214-L217) 中显式执行本地排序：
    - `sortedBills = [...contract.bills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))`
    - 这说明该列表当前按“创建时间由近及远”排序，而不是按到期时间，也没有状态优先级。
  - 账单列表页 `src/app/bills/page.tsx` 直接调用 `billQueries.findAll()` 获取初始数据，再交给 [BillListPage](file:///home/dell/Projects/Rento/src/components/pages/BillListPage.tsx) 渲染。
  - [BillListPage](file:///home/dell/Projects/Rento/src/components/pages/BillListPage.tsx#L127-L151) 只做状态筛选和搜索筛选，没有再调用 `.sort()`，因此页面展示顺序完全继承查询层返回结果。
- 服务端实际创建链路：
  - 合同详情查询 [contractQueries.findById](file:///home/dell/Projects/Rento/src/lib/queries.ts#L685-L696) 对 `bills` 只是 `bills: true`，没有嵌套 `orderBy`，说明合同详情页并没有从服务端获得稳定账单顺序，而是由前端兜底排序。
  - 账单列表页查询 [billQueries.findAll](file:///home/dell/Projects/Rento/src/lib/queries.ts#L914-L927) 明确按 `orderBy: { dueDate: 'desc' }` 返回。
  - `/api/bills` 对应的优化查询 [optimized-queries.ts](file:///home/dell/Projects/Rento/src/lib/optimized-queries.ts#L710-L750) 又采用 `orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }]`，与 SSR 查询层并不完全一致。
- 数据模型映射：
  - 账单已有统一展示状态语义工具 [bill-semantics.ts](file:///home/dell/Projects/Rento/src/lib/bill-semantics.ts#L112-L149)：
    - `OPEN`
    - `OVERDUE`
    - `SETTLED`
  - 这套语义已经能判断“待后续处理”与“已完结沉默账单”，但当前没有独立的“账单排序工具”把该语义用于列表展示顺序。
  - 账单列表页状态筛选按钮 [BillStatusFilter.tsx](file:///home/dell/Projects/Rento/src/components/business/BillStatusFilter.tsx#L18-L23) 只是 UI 过滤项顺序，不等于列表实际排序优先级。
- 关键代码位置：
  - 合同详情页账单历史排序：[EnhancedContractDetail.tsx](file:///home/dell/Projects/Rento/src/components/business/EnhancedContractDetail.tsx#L214-L217)
  - 合同详情查询：[queries.ts](file:///home/dell/Projects/Rento/src/lib/queries.ts#L685-L696)
  - 账单列表页查询：[queries.ts](file:///home/dell/Projects/Rento/src/lib/queries.ts#L914-L927)
  - 账单列表页前端筛选：[BillListPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/BillListPage.tsx#L127-L151)
  - 账单 API 默认排序：[optimized-queries.ts](file:///home/dell/Projects/Rento/src/lib/optimized-queries.ts#L748-L750)
  - 统一状态语义：[bill-semantics.ts](file:///home/dell/Projects/Rento/src/lib/bill-semantics.ts#L134-L149)
- 是否存在历史脏数据：
  - 不存在账单事实脏数据的直接证据。
  - 当前问题属于“同一份账单数据在不同页面的展示顺序不一致”，本质是展示语义漂移，不需要回写历史账单数据。

## 4. 影响面分析
- 新创建合同：
  - 新账单一旦生成，合同详情页与账单列表页就可能因为排序真相源不同而出现展示顺序分叉。
- 续租：
  - 续租生成的新账单同样会进入这两类页面，因此会继承相同问题。
- 手工生成账单：
  - 手工新建账单只要进入合同详情页或账单列表页，也会受当前排序不一致影响。
- 历史已生成账单：
  - 影响已经存在的全部账单集合，尤其是在“同一到期日、多种状态混排”的场景下最明显。
- 统计 / 仪表盘：
  - 不直接影响账单金额统计，但会影响用户对“当前优先待处理账单”的感知，降低操作效率。

## 5. 候选方案对比
### 方案 A
- 做法：
  - 只在合同详情页和账单列表页各自补一段本地 `.sort()` 逻辑。
  - 规则写成“未完结优先，再按时间倒序”。
- 优点：
  - 改动快，能较快修复你当前看到的两个页面。
  - 风险集中在 UI 层，短期验证简单。
- 风险：
  - 仍然保留“排序规则分散在多个页面”的老问题。
  - 后续若新增第三个账单入口，很容易再次出现排序语义漂移。
  - 若 SSR 查询层和前端本地排序口径不一致，仍可能出现页面刷新/筛选后结果跳动。

### 方案 B
- 做法：
  - 抽离统一的账单展示排序工具，例如独立的 `compareBillsForDisplay()` 或 `sortBillsForDisplay()`。
  - 在该工具中冻结统一规则：
    - 第一层：未完结账单优先于已完结账单
    - 第二层：在同一结算阶段内按“业务时间”由近及远排序
    - 第三层：若主排序字段相同，再用 `createdAt desc` 做稳定兜底
  - 合同详情页、账单列表页、未来账单相关入口统一复用同一排序工具。
  - 视实施成本，查询层与 API 层也同步收口到同一排序口径，避免 SSR 和 API 分叉。
- 优点：
  - 能真正解决“共享展示排序语义未冻结”的主因。
  - 与已有 `bill-semantics.ts` 的统一状态语义方向一致，利于长期维护。
  - 后续若新增账单看板、搜索页、租客账单侧栏等入口，可直接复用。
- 风险：
  - 改动面会触及查询层、页面层，验证面比局部补丁更大。
  - 需要先明确“时间由近及远”到底优先看 `dueDate` 还是 `createdAt`，否则共享排序工具会在需求层继续摇摆。

## 6. 推荐方案
- 推荐原因：
  - 推荐采用 **方案 B 的“统一账单展示排序工具 + 页面/查询层同步收口”**。
  - 当前问题已经不是单页 bug，而是“合同详情页排序真相源”和“账单列表页排序真相源”天然分叉。
  - 既然项目已经在 `fix_002` 里建立了统一账单展示状态语义，那么 `fix_005` 最合理的方向就是继续把“展示顺序语义”也收口成共享能力。
- 实施边界：
  - 先冻结排序语义：
    - 未完结账单（如 `PENDING / OVERDUE / 部分支付仍有待收余额`）优先展示
    - 已完结账单（如 `PAID / COMPLETED / pendingAmount≈0`）后置展示
    - 在各自分组内按“时间由近及远”排列
  - 时间字段建议优先使用：
    - `dueDate` 作为业务时间主键
    - `createdAt` 作为同日稳定兜底
  - 页面范围优先收口：
    - 合同详情页账单历史 Tab
    - 账单列表页
  - 查询层范围建议收口：
    - `billQueries.findAll()`
    - `/api/bills` 对应优化查询
    - 必要时补合同详情页的账单 include 排序，而不是继续完全依赖前端本地排序
- 明确不在本次修复范围内的内容：
  - 不修改账单状态机或账单金额事实
  - 不重构全部账单筛选 UI
  - 不顺手开发新的账单优先级配置中心
  - 不扩展到仪表盘、租客详情侧栏等其他未在 issue 中明确提到的列表入口

## 7. 数据修复策略
- 是否需要修历史数据：不需要。
- 若需要，修复范围：
  - 不适用。本问题不是账单事实错误，不需要对数据库中的历史账单做回写修复。
- 若不需要，原因：
  - 当前问题只涉及页面与查询层展示顺序不一致，修复共享排序逻辑后即可改善全部历史账单的展示结果。

## 8. 验收标准
- 合同详情页账单历史 Tab 与账单列表页必须遵守同一套账单展示排序规则。
- 未完结账单必须稳定排在已完结账单之前。
- 在同一展示分组内，账单必须按业务时间由近及远展示。
- 当两条账单业务时间相同时，排序结果必须稳定，不能因刷新或入口不同而随机变化。
- 合同详情页不再单独手写一套与账单列表页不同的排序逻辑。
- `billQueries.findAll()` 与 `/api/bills` 的默认排序口径必须一致，避免 SSR 和 API 两套顺序。
- 状态筛选和搜索筛选不能破坏统一排序结果。

## 9. 回滚条件
- 若修复后出现以下任一情况，必须立即回滚：
  - 未完结账单反而被排到已完结账单之后
  - 同一页面刷新前后排序结果不稳定
  - 合同详情页和账单列表页排序分叉更加严重
  - 账单筛选后顺序异常跳变，影响基础可用性
- 若在需求确认阶段发现：
  - “时间由近及远”在业务上并非指 `dueDate`
  - “部分支付”与“已完结”归类边界仍不明确
  - 其他未列出的账单入口也必须同步收口
  则必须先补齐排序语义定义，再推进实现，避免继续在代码层硬猜业务规则。
