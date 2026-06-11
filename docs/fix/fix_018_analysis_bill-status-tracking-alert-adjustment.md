# Fix 018 Analysis - 账单卡片状态跟踪提示调整

## 1. 问题摘要
- 对应问题：`fix_018`
- 问题级别：`P1`
- 是否阻断修复：是

## 2. 根因结论
- 根因一：当前账单卡片只有“状态徽标”，没有像合同卡片那样独立建模的“状态跟踪提示”层，导致逾期提醒只是一个局部文案，而不是稳定的状态语义组件。
  - 正式账单列表卡片当前使用 [BillCardCompact](file:///home/dell/Projects/Rento/src/components/business/BillCardCompact.tsx#L26-L225)。
  - 卡片右上角只展示 [BillStatusBadge](file:///home/dell/Projects/Rento/src/components/ui/status-badge.tsx)，见 [BillCardCompact.tsx](file:///home/dell/Projects/Rento/src/components/business/BillCardCompact.tsx#L74-L77)。
  - “已逾期 X 天”只在底部以 `bill.status === 'OVERDUE'` 条件临时拼接，见 [BillCardCompact.tsx](file:///home/dell/Projects/Rento/src/components/business/BillCardCompact.tsx#L31-L36) 与 [BillCardCompact.tsx](file:///home/dell/Projects/Rento/src/components/business/BillCardCompact.tsx#L198-L203)。
  - 这意味着账单列表当前不是“缺少一点 UI”，而是缺少一层类似合同 `ContractStatusTrackingHint` 的共享语义承接。
- 根因二：账单排序虽然已经做了“未结清优先 + 到期日升序”，但排序规则仍然依赖账单展示态的局部分组，没有明确冻结为“距到期日最近优先，已结清后置”的统一业务定义。
  - 当前共享排序函数在 [bill-semantics.shared.ts](file:///home/dell/Projects/Rento/src/lib/bill-semantics.shared.ts#L117-L136)，规则是：
    - `SETTLED` 后置
    - 其余按 `dueDate asc`
    - 再按 `createdAt desc`
  - 前端列表页在 [BillListPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/BillListPage.tsx#L138-L165) 复用该排序，后端分页查询也在 [optimized-queries.ts](file:///home/dell/Projects/Rento/src/lib/optimized-queries.ts#L756-L775) 用 SQL `CASE` 复刻。
  - 这套实现与“已支付 / 已完成后置、距到期日越近越靠前”的目标接近，但没有把“状态跟踪提示设计”和“列表排序设计”作为一个整体冻结下来，后续仍容易再次分叉。
- 根因三：账单提醒窗口当前没有独立语义工具，只能借用现有逾期状态和到期日期计算，尚未像合同那样显式收口到统一 helper。
  - 合同侧已经有 [contract-alert-semantics.ts](file:///home/dell/Projects/Rento/src/lib/contract-alert-semantics.ts#L1-L170) 统一承接“窗口阈值清洗、几天后到期、已过期 X 天、提示文案”。
  - 账单侧当前没有对应的 `bill-alert-semantics`；逾期天数直接在 [BillCardCompact.tsx](file:///home/dell/Projects/Rento/src/components/business/BillCardCompact.tsx#L31-L36) 里用 `Date.now() - dueDate` 计算。
  - 结果就是：账单卡片即使要看齐合同卡片，也缺少一个“稳定的状态提示 view-model 生成器”，只能继续在组件里散落硬编码。
- 根因四：设置页当前正式开放的全局窗口阈值只有 `contractExpiryAlertDays` 与 `upcomingMoveInAlertDays`，并没有账单独立阈值；若直接把账单窗口阈值硬绑定到“合同到期提醒窗口”，需要先明确这是“跨域复用的治理决策”，而不是默认合理前提。
  - 设置页可见配置项在 [SettingsPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/SettingsPage.tsx#L129-L154)，其中“合同到期提醒窗口”对应 `contractExpiryAlertDays`。
  - 正式设置读取由 [global-settings.ts](file:///home/dell/Projects/Rento/src/lib/global-settings.ts#L573-L634) 收口；当前该接口只定义“合同提醒窗口”和“待入住提醒窗口”。
  - 因此，`fix_018` 不是简单复用一个现成值，而是需要显式决定：本次是否允许账单跟踪提示先复用 `contractExpiryAlertDays` 作为统一窗口兜底，还是应该新增账单独立配置键。

## 3. 证据链
- 页面预展示链路：
  - 正式账单列表入口是 [BillListRoute.tsx](file:///home/dell/Projects/Rento/src/minix/routes/bills/BillListRoute.tsx#L29-L100) -> [loadBillListRouteData()](file:///home/dell/Projects/Rento/src/minix/lib/primary-route-data.ts#L1580-L1592) -> [BillListPage](file:///home/dell/Projects/Rento/src/components/pages/BillListPage.tsx#L125-L242) -> [BillCardCompact](file:///home/dell/Projects/Rento/src/components/business/BillCardCompact.tsx#L26-L225)。
  - 列表卡片当前固定展示 `BillStatusBadge`，见 [BillCardCompact.tsx](file:///home/dell/Projects/Rento/src/components/business/BillCardCompact.tsx#L74-L77)。
  - 逾期提示只在卡片底部条件展示“已逾期 X 天”，见 [BillCardCompact.tsx](file:///home/dell/Projects/Rento/src/components/business/BillCardCompact.tsx#L198-L203)。
- 服务端实际创建 / 查询链路：
  - 正式账单列表 API 在 [server/routes/bills.ts](file:///home/dell/Projects/Rento/server/routes/bills.ts#L405-L444)。
  - API 实际分页查询使用 [optimizedBillQueries.findWithPagination()](file:///home/dell/Projects/Rento/src/lib/optimized-queries.ts#L664-L789)。
  - 旧 SSR/兼容链路 `billQueries.findAll()` 在 [queries.ts](file:///home/dell/Projects/Rento/src/lib/queries.ts#L1071-L1089)，也会在取回 Prisma 数据后复用共享排序。
- 数据模型映射：
  - 账单原始状态仍然是 `PENDING / PAID / OVERDUE / COMPLETED` 四态，徽标展示由 [status-badge.tsx](file:///home/dell/Projects/Rento/src/components/ui/status-badge.tsx) 映射。
  - 列表筛选和统计使用的是“展示态” `OPEN / OVERDUE / SETTLED`，定义在 [bill-semantics.shared.ts](file:///home/dell/Projects/Rento/src/lib/bill-semantics.shared.ts#L19-L20) 与 [bill-semantics.shared.ts](file:///home/dell/Projects/Rento/src/lib/bill-semantics.shared.ts#L92-L107)。
  - 这说明账单模块当前已经存在“原始状态”和“展示态”两层语义，但尚未进一步抽出“状态跟踪提示”这一第三层统一语义。
- 关键代码位置：
  - 账单列表页筛选与排序：[BillListPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/BillListPage.tsx#L138-L165)
  - 账单卡片状态徽标与逾期文案：[BillCardCompact.tsx](file:///home/dell/Projects/Rento/src/components/business/BillCardCompact.tsx#L31-L36) 、 [BillCardCompact.tsx](file:///home/dell/Projects/Rento/src/components/business/BillCardCompact.tsx#L74-L77) 、 [BillCardCompact.tsx](file:///home/dell/Projects/Rento/src/components/business/BillCardCompact.tsx#L198-L203)
  - 账单展示态与排序共享语义：[bill-semantics.shared.ts](file:///home/dell/Projects/Rento/src/lib/bill-semantics.shared.ts#L62-L136)
  - 设置页窗口阈值配置：[SettingsPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/SettingsPage.tsx#L129-L154)
  - 合同提醒窗口读取回退：[global-settings.ts](file:///home/dell/Projects/Rento/src/lib/global-settings.ts#L573-L634)
- 是否存在历史脏数据：
  - 当前没有证据表明 `fix_018` 必然需要修账单历史主数据。
  - 现阶段问题主要落在“展示层/排序层/统一语义层未收口”，不是像 `fix_017` 那样已确认存在服务端事实状态写错。
  - 但若后续排查发现有大量“到期已过但仍停留 `PENDING` 且未进入 `OVERDUE`”的旧账单，则需要另开数据治理项，不能在本次 analysis 中默认混入。

## 4. 影响面分析
- 账单列表：
  - 直接受影响。
  - 当前用户需要同时看右上角状态徽标和卡片底部“已逾期 X 天”，状态信息分裂，无法像合同卡片一样在右上角完成统一阅读。
- 账单卡片排序：
  - 直接受影响。
  - 虽然现有规则已经把未结清账单排前面，但业务目标没有被正式冻结为“距到期日最近优先 + 已支付/已完成后置”，后续实现仍可能再次漂移。
- 设置 / 提醒治理：
  - 受影响。
  - 若本次要把账单提示阈值统一到“合同到期提醒窗口”，必须同步更新说明与实现，避免配置名、配置用途和实际消费方不一致。
- 账单详情 / 统计：
  - 间接受影响。
  - 若仅调整列表卡片而不抽共享提示语义，详情页、统计页、后续提醒组件仍可能继续各写一套文案和阈值算法。
- 历史数据：
  - 当前初判不直接受影响。
  - 除非后续证据表明账单状态落库和业务事实已经长期错位，否则本次应以“设计收口 + 展示收口 + 查询排序收口”为主，不主动扩写为账单状态历史修复专项。

## 5. 候选方案对比
### 方案 A
- 做法：
  - 只在 `BillCardCompact` 中把底部“已逾期 X 天”挪到状态徽标左侧，其他逻辑不动。
- 优点：
  - 改动最小，能快速让账单卡片视觉上更接近合同卡片。
- 风险：
  - 只调整位置，没有抽共享提示语义。
  - 阈值、文案、排序和其他入口仍然各自为政，后续极易再次分叉。
  - 不能回答“为什么账单用合同提醒窗口”和“哪些状态应该展示跟踪提示”这两个核心问题。

### 方案 B
- 做法：
  - 新增账单独立提醒配置，例如 `billDueAlertDays`，再为账单单独构建一套卡片提示和排序逻辑。
- 优点：
  - 语义边界最清晰，账单域拥有自己的阈值和提示定义，不借用合同配置。
- 风险：
  - 超出本次 issue 已明确的预期结果。
  - 需要新增设置项、读写链、页面说明和治理文档，实施面更大。
  - 若当前真实业务只是要求“先看齐合同体验”，则会造成不必要的配置膨胀。

### 方案 C
- 做法：
  - 参照 `fix_017` 的合同卡片机制，为账单新增共享 `bill` 状态跟踪提示语义 helper 与通用提示组件复用位。
  - 保留当前账单右上角 `BillStatusBadge` 作为“事实状态指示”，把“状态跟踪提示”放到其左侧。
  - 提示语义先收口为：
    - 开放账单且仍在窗口内：如“X 天后到期 / 今日到期”
    - 逾期账单：如“已逾期 X 天”
    - `PAID / COMPLETED`：不显示状态跟踪提示
  - 列表排序冻结为“未结清优先 + 到期日距今更近优先 + 已支付/已完成后置”，并继续由共享排序函数承接。
  - 在本次 fix 范围内，账单提示窗口先复用设置页 `contractExpiryAlertDays` 作为全局窗口兜底，并在 analysis/spec 中明确这是阶段性统一治理决策。
- 优点：
  - 与用户预期最一致，能直接看齐合同卡片体验。
  - 不新增第二个设置阈值，符合当前“最小边界修复”的 fix 模式。
  - 通过共享 helper，可以同时收口卡片文案、排序语义和设置读取口径。
- 风险：
  - 需要明确写清楚“账单暂复用合同提醒窗口”的边界，否则容易造成后续误解。
  - 若未来账单提醒确实需要独立窗口，则还要再做一次配置拆分。

## 6. 推荐方案
- 推荐原因：
  - 推荐采用 **方案 C：账单卡片对齐合同卡片的“状态事实 + 状态跟踪提示 + 窗口阈值 + 排序语义”四件套收口方案**。
  - 这最符合你在 issue 中提出的目标，也最符合当前项目“fix 模式优先最小边界、避免配置膨胀、优先统一已有表达”的最佳实践。
  - 当前账单页已有部分共享基础，例如 `bill-semantics.shared.ts` 和前后端一致排序；本次应在此基础上补齐“状态跟踪提示语义”这一缺口，而不是重做整页。
- 实施边界：
  - 共享语义层：
    - 新增账单状态跟踪提示 helper，例如 `getBillStatusTrackingHint(...)`，统一产出：
      - 是否显示提示
      - 提示文案
      - 提示 tone
      - 与排序共用的到期距离计算
    - 账单只把 `PENDING/OVERDUE` 且仍有待收金额的账单视为开放态候选。
    - `PAID/COMPLETED` 或 `pendingAmount <= 0.01` 的账单不显示跟踪提示。
  - 卡片表达层：
    - `BillCardCompact` 保留当前右上角 `BillStatusBadge`。
    - 新增与合同卡片一致的状态跟踪提示布局，放到状态徽标左侧。
    - 底部独立“已逾期 X 天”文案移除，避免同一信息重复出现两次。
  - 排序层：
    - 冻结共享规则为：
      - 未结清账单优先
      - 再按 `dueDate` 距今天数更近优先，本质可继续使用 `dueDate asc`，但在文档中明确为业务规则
      - `PAID/COMPLETED` 后置
    - 前端 `BillListPage` 与后端 `optimizedBillQueries` 保持同源规则。
  - 设置口径层：
    - 本次 fix 先复用设置页 `contractExpiryAlertDays` 作为“账单/合同统一窗口型提醒配置”的全局兜底。
    - 需要同步更新设置页说明、analysis/spec 验收口径，明确它已同时服务合同卡片和账单卡片。
    - 不在本次 fix 中新增 `billDueAlertDays`。
  - 查询与统计层：
    - 若账单列表统计或后续提醒页需要展示“即将到期账单”，必须复用同一 helper 和同一窗口阈值，避免再写死天数。
    - 本次至少应核查 `BillListPage` 的筛选与 `/bills` 的排序在修复后仍然一致。
- 明确不在本次修复范围内的内容：
  - 不重构账单状态机本身，不改变 `PENDING / PAID / OVERDUE / COMPLETED` 的主状态定义。
  - 不新增账单独立设置项。
  - 不在本次 fix 中把账单详情页、统计页、催收页全部扩写为完整合同式状态提示体系；仅收口与账单列表主路径直接相关的部分，必要时只补最小共享能力。

## 7. 数据修复策略
- 是否需要修历史数据：当前初判不需要。
- 若需要，修复范围：
  - 仅当后续证据明确发现存在“真实逾期账单仍长期停留 `PENDING` 且未结清”的历史样本时，才单独盘点。
  - 该类问题属于账单状态事实治理，不应默认包含在本次 `fix_018` 范围内。
- 若不需要，原因：
  - 当前 issue 的核心诉求是“排查并调整对齐”，本质上是页面设计与统一语义收口任务。
  - 现有证据尚未证明账单主数据已经像 `fix_017` 那样存在确定性的服务端事实写错。
  - 因此本次应优先修正共享语义、卡片布局、阈值复用和排序文档化，不主动混入历史数据改写。

## 8. 验收标准
- 账单卡片展示层满足：
  - 账单列表卡片在右上角继续保留当前账单状态标识（待付、已收款、逾期、已完成）。
  - 若账单处于开放跟踪态，状态跟踪提示显示在状态徽标左侧，而不是卡片底部。
  - 对逾期账单，卡片正确展示“已逾期 X 天”。
  - 对窗口内未到期的开放账单，卡片可正确展示“X 天后到期 / 今日到期”。
  - 对 `PAID / COMPLETED` 账单，不显示状态跟踪提示。
- 排序层满足：
  - 账单列表按“到期日距今更近优先”展示开放账单。
  - `PAID / COMPLETED` 账单整体后置。
  - 前端列表与 `/bills` API 返回顺序保持一致。
- 设置口径层满足：
  - 账单卡片状态跟踪提示使用设置页 `contractExpiryAlertDays` 作为全局窗口兜底。
  - 当设置缺失或异常时，回退到默认 `30` 天。
  - 设置页说明或文档已明确该窗口当前同时服务合同与账单的窗口型提醒。
- 统一语义层满足：
  - 账单卡片不再在组件内直接手写逾期天数与窗口判断，而是复用统一 helper。
  - 不再出现“卡片底部一套提示、右上角另一套提示、排序又是第三套规则”的分裂实现。
- 工程校验层满足：
  - `npm run lint` 通过。
  - `npm run type-check` 通过。
  - 至少完成一轮人工复核：
    - `PENDING` 且未到期账单
    - `PENDING/OVERDUE` 且进入窗口账单
    - `OVERDUE` 账单
    - `PAID` 账单
    - `COMPLETED` 账单

## 9. 回滚条件
- 若修复后 `PAID / COMPLETED` 账单仍显示状态跟踪提示，应停止并回滚。
- 若修复后账单列表排序不再保持“开放账单优先、已结清后置”，应停止并回滚。
- 若修复后账单卡片提示窗口没有走设置页 `contractExpiryAlertDays`，而重新出现局部硬编码天数，应停止并回滚。
- 若修复为引入账单提示而意外改动账单原始状态流转或结算语义，应停止并回滚。
