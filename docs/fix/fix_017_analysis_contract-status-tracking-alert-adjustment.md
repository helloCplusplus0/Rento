# Fix 017 Analysis - 合同状态跟踪提示调整

## 1. 问题摘要
- 对应问题：`fix_017`
- 问题级别：`P1`
- 是否阻断修复：是

## 2. 根因结论
- 根因一：续租完成后，旧合同的服务端事实状态被错误固化为 `EXPIRED`，而不是“已完成状态切换”的 `TERMINATED`。
  - 正式续租主链在 [renewContract()](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L738-L898) 中创建新合同后，会把原合同更新为 `status: 'EXPIRED'`、`isExtended: true`，见 [contracts/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L873-L884)。
  - 这意味着系统把“已有新合同承接、旧合同不再需要管理员继续跟进”的场景，仍然保留为“到期待处理”的状态语义。
  - 结果就是你指出的问题会稳定复现：一旦续租完成，旧合同卡片依旧展示“到期”，并持续计算“已过期 X 天”。
- 根因二：合同卡片的“状态指示”和“状态跟踪提示”没有形成统一语义层级，列表页和详情页各自实现，位置与文案都不一致。
  - 列表卡片在 [contract-card.tsx](file:///home/dell/Projects/Rento/src/components/business/contract-card.tsx#L45-L110) 中把 [ContractStatusBadge](file:///home/dell/Projects/Rento/src/components/ui/status-badge.tsx#L107-L124) 放在右上角，而“已过期 X 天 / 30 天内到期”则放在卡片底部右侧，形成了两块分离的状态信息。
  - 详情页 Hero 卡在 [EnhancedContractDetail.tsx](file:///home/dell/Projects/Rento/src/components/business/EnhancedContractDetail.tsx#L237-L303) 中只在“即将到期”时展示横幅，不展示“已过期 X 天”，也没有与状态徽标形成并列关系。
  - 因此同一合同在列表页、详情页、dashboard 提醒里的状态表达节奏并不一致，管理员无法快速把“当前状态”和“是否需要立即跟进”合成一个稳定心智。
- 根因三：合同到期提醒算法和阈值在多个位置重复实现，导致“什么时候提示、提示什么、提示几天”并不统一。
  - 统一语义工具在 [contract-alert-semantics.ts](file:///home/dell/Projects/Rento/src/lib/contract-alert-semantics.ts#L23-L70)，支持用系统设置 `contractExpiryAlertDays` 计算“几天后到期”。
  - 但列表卡片没有复用这套配置，而是直接用 [calculateOverdueDays()](file:///home/dell/Projects/Rento/src/lib/format.ts#L95-L110) + 硬编码 `30` 天窗口，见 [contract-card.tsx](file:///home/dell/Projects/Rento/src/components/business/contract-card.tsx#L37-L40)。
  - 旧查询层与 dashboard 又把“已过期但未处理”解释为 `status='ACTIVE' && endDate < today`，见 [queries.ts](file:///home/dell/Projects/Rento/src/lib/queries.ts#L946-L991)。这和卡片完全依赖 `status === 'EXPIRED'` 再展示“已过期 X 天”的规则并不一致。
- 根因四：当前实现把“到期”混用了两种语义，没有明确区分“待管理员跟进的切换临界态”和“已经完成续租/退租收口的历史态”。
  - 退租主链完成后会把合同更新为 `TERMINATED`，见 [contracts/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L1185-L1205)，所以退租后的展示效果符合预期。
  - 续租主链却把旧合同保留在 `EXPIRED`，导致“真正需要跟踪的到期合同”和“已完成续租承接的旧合同”混在同一状态桶里。
  - 这不仅影响卡片提示，也会让合同统计、过期提醒和后续治理都持续把已完成承接的旧合同当成未处理对象。

## 3. 证据链
- 页面预展示链路：
  - 合同列表页入口在 [ContractListRoute.tsx](file:///home/dell/Projects/Rento/src/minix/routes/contracts/ContractListRoute.tsx#L76-L93) -> [ContractListPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/ContractListPage.tsx#L48-L166) -> [ContractGrid.tsx](file:///home/dell/Projects/Rento/src/components/business/ContractGrid.tsx#L14-L65) -> [ContractCard](file:///home/dell/Projects/Rento/src/components/business/contract-card.tsx#L32-L115)。
  - 列表卡片当前只要 `status === 'EXPIRED' && overdueDays > 0` 就在底部右侧展示“已过期 X 天”，见 [contract-card.tsx](file:///home/dell/Projects/Rento/src/components/business/contract-card.tsx#L98-L109)。
  - 合同详情页入口在 [ContractDetailPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/ContractDetailPage.tsx#L29-L202)，主体卡片在 [EnhancedContractDetail.tsx](file:///home/dell/Projects/Rento/src/components/business/EnhancedContractDetail.tsx#L223-L304)；当前详情页只显示“X 天后到期”的横幅，不显示“已过期 X 天”，也没有把跟踪提示放到状态徽标左侧。
- 服务端实际创建链路：
  - 正式续租入口在 [contracts.ts](file:///home/dell/Projects/Rento/server/routes/contracts.ts#L682-L739)。
  - 续租业务真相在 [renewContract()](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L738-L898)，其中原合同被写为 `EXPIRED` 见 [contracts/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L873-L884)。
  - 正式退租入口在 [checkout.ts](file:///home/dell/Projects/Rento/server/routes/checkout.ts#L127-L191)。
  - 退租业务真相在 [checkoutContract()](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L938-L1257)，其中合同被写为 `TERMINATED` 见 [contracts/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L1185-L1205)。
- 数据模型映射：
  - 当前合同状态主字段是 `Contract.status`，状态徽标直接以它为真相源，见 [status-badge.tsx](file:///home/dell/Projects/Rento/src/components/ui/status-badge.tsx#L107-L124)。
  - `Contract.isExtended` 目前只表示“旧合同已发生续租”，但没有独立承担“旧合同应进入何种展示状态”的完整语义。
  - 旧查询层在过期提醒中把 `status='ACTIVE' && endDate < today` 也视为“已到期待处理”，见 [queries.ts](file:///home/dell/Projects/Rento/src/lib/queries.ts#L946-L991)，说明当前系统已经存在“落库状态”和“业务提醒状态”两套并行判断。
- 关键代码位置：
  - 合同列表卡片状态与提示：[contract-card.tsx](file:///home/dell/Projects/Rento/src/components/business/contract-card.tsx#L45-L110)
  - 合同详情 Hero 状态与提醒：[EnhancedContractDetail.tsx](file:///home/dell/Projects/Rento/src/components/business/EnhancedContractDetail.tsx#L237-L303)
  - 状态徽标映射：[status-badge.tsx](file:///home/dell/Projects/Rento/src/components/ui/status-badge.tsx#L21-L64)
  - 到期提醒统一语义工具：[contract-alert-semantics.ts](file:///home/dell/Projects/Rento/src/lib/contract-alert-semantics.ts#L23-L70)
  - 列表卡片逾期天数计算：[format.ts](file:///home/dell/Projects/Rento/src/lib/format.ts#L95-L110)
  - 续租旧合同状态更新：[contracts/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L873-L884)
  - 退租旧合同状态更新：[contracts/index.ts](file:///home/dell/Projects/Rento/src/lib/domain/contracts/index.ts#L1185-L1205)
  - 旧查询层统计与过期提醒：[queries.ts](file:///home/dell/Projects/Rento/src/lib/queries.ts#L884-L992)
- 是否存在历史脏数据：
  - 是，高概率已经存在。
  - 因为当前正式续租服务明确会把旧合同写成 `EXPIRED`，所以所有已完成续租且走过这条链路的旧合同，都可能持续被卡片和统计当作“已过期待处理”。
  - 这类问题不是 UI 纯展示 bug，而是“服务端事实状态已经落错”的存量数据偏差。

## 4. 影响面分析
- 合同列表：
  - 直接受影响。
  - 续租完成的旧合同会持续展示“到期 + 已过期 X 天”，误导管理员继续跟进一个实际上已经完成状态切换的合同。
  - “状态跟踪提示”当前放在卡片底部右侧，也削弱了它作为状态临界提醒的优先级。
- 合同详情：
  - 直接受影响。
  - 详情页 Hero 只展示状态徽标和“即将到期”提醒，没有把“已过期 X 天”的临界提醒与状态徽标形成统一布局，导致状态表达不完整。
- 续租：
  - 直接受影响，且是主根因入口。
  - 当前续租完成后旧合同被写成 `EXPIRED`，所以会持续落入“待跟进”的到期提醒逻辑。
- 退租：
  - 当前主链基本正确。
  - 退租完成后合同被写成 `TERMINATED`，因此卡片不会再展示“已过期 X 天”；这也反过来证明续租分支和退租分支的状态收口不一致。
- 历史数据：
  - 受影响。
  - 既有续租旧合同如果已经被写成 `EXPIRED`，即使前端提示位置调整了，仍会继续进入错误状态桶。
- 统计 / 仪表盘：
  - 受影响。
  - 旧查询层 `expiredCount` 只统计 `status='EXPIRED'`，见 [queries.ts](file:///home/dell/Projects/Rento/src/lib/queries.ts#L894-L933)；这会把“已完成续租承接的旧合同”混进到期统计，污染运营判断。
  - dashboard/提醒又把 `ACTIVE + endDate<today` 也视为到期，说明系统整体状态口径已经存在分叉。
- 其他入口：
  - 是。
  - 任何复用 `ContractStatusBadge`、合同统计、到期提醒或列表卡片的页面，都可能受到这套状态口径不一致的连带影响。

## 5. 候选方案对比
### 方案 A
- 做法：
  - 仅调整前端卡片展示，把“已过期 X 天”移到状态徽标左侧，并在续租旧合同上额外隐藏该提示。
- 优点：
  - 改动最小，能快速改善你当前肉眼看到的 UI 问题。
- 风险：
  - 只修了展示，没有修服务端事实状态。
  - 旧合同依旧会保留 `EXPIRED`，统计、筛选、提醒和其他入口仍然会继续误判。
  - 需要前端靠额外条件猜测“这个 EXPIRED 其实已经续租完成”，长期不可维护。

### 方案 B
- 做法：
  - 保留续租后旧合同为 `EXPIRED`，但新增一个更复杂的衍生展示状态，例如“EXPIRED_BUT_EXTENDED”，专门用于卡片和详情页隐藏跟踪提示。
- 优点：
  - 不直接动历史 `Contract.status`，对已有数据库写路径冲击较小。
- 风险：
  - 会引入第二套展示状态真相，进一步放大“落库状态”和“页面状态”分裂。
  - 统计、筛选、提醒仍需同步维护一套复杂映射，复杂度高，且容易遗漏。
  - 与“合同状态应该能直接表达当前业务事实”的最佳实践相违背。

### 方案 C
- 做法：
  - 把“状态指示”和“状态跟踪提示”拆成两层稳定语义：
    - `状态指示` 负责表达合同事实状态：`生效 / 到期 / 终止`
    - `状态跟踪提示` 只在“仍需管理员跟进的临界态”出现
  - 服务端续租主链完成后，把旧合同从 `EXPIRED` 改为 `TERMINATED`，与退租完成态保持一致。
  - 前端卡片统一把“状态跟踪提示”收口到状态徽标水平左侧，并只在“真正处于临界态”的合同上显示。
  - 到期提示统一复用一套到期语义工具与设置口径，不再在卡片中硬编码 `30` 天窗口。
- 优点：
  - 同时修正服务端事实、页面表达和统计口径，能从根上消除“续租旧合同仍被当成待处理到期合同”的问题。
  - 符合真实业务语义：一旦旧合同已经由新合同承接，它就不再属于“临界待处理”，而属于“已收口历史合同”。
  - 便于统一列表页、详情页和提醒组件的状态表达。
- 风险：
  - 需要同步修改续租服务、卡片布局、详情 Hero 与到期提示工具，改动面比纯 UI 调整更大。
  - 需要定义历史 `EXPIRED + isExtended=true` 合同的修复边界，否则新旧数据会混用。

## 6. 推荐方案
- 推荐原因：
  - 推荐采用 **方案 C：把“状态事实收口 + 提示语义收口 + 布局位置收口”一起完成**。
  - 这是当前最符合最佳实践的方案，因为问题根源不只在 UI 位置，而在于“续租旧合同被错误保留为 `EXPIRED`”这一本体事实已经落错。
  - 如果不先修正服务端状态事实，只挪动提示位置，系统仍会继续把已完成续租承接的旧合同当作“待跟进到期合同”。
- 实施边界：
  - 服务端事实层：
    - 续租完成后，旧合同状态应与退租完成态一样收口为 `TERMINATED`，同时保留 `isExtended=true` 和续租备注，作为“终止原因是被续租承接”的历史证据。
    - 旧合同不再继续落在 `EXPIRED` 桶中。
  - 前端状态表达层：
    - 合同卡片顶部保留现有右上角 `状态指示`。
    - 新增或重组一个紧邻状态徽标左侧的 `状态跟踪提示` 区块。
    - `状态跟踪提示` 只在“确实处于切换临界点”的合同上出现：
      - `ACTIVE` 且接近到期：如“X 天后到期”
      - `EXPIRED` 且尚未处理：如“已过期 X 天”
      - `TERMINATED`：不再显示跟踪提示
  - 统一语义工具层：
    - 抽离统一的合同状态提示 view-model 或 helper，集中生成：
      - 是否显示状态跟踪提示
      - 提示文案
      - 提示颜色
      - 提示位置使用的布局数据
    - 列表页、详情页、提醒组件统一复用，不再各自用 `calculateOverdueDays`、`isContractExpiringSoon`、硬编码 30 天窗口拼装。
  - 统计与查询层：
    - 核查 `expiredCount`、到期提醒、`expiring_soon` 筛选是否要同步修正，避免继续把“已续租承接旧合同”计入到期待处理统计。
  - UI 布局层：
    - 按你的建议，把“状态跟踪提示”移到“状态指示”水平左侧，使状态事实与状态提醒形成同一阅读起点。
- 明确不在本次修复范围内的内容：
  - 不重构整个合同列表页的视觉体系。
  - 不在本次 fix 中重写 dashboard 全部提醒模块，只收口与合同状态提示直接相关的部分。
  - 不扩大为合同模块全面状态机重构或新的 phase。

## 7. 数据修复策略
- 是否需要修历史数据：需要。
- 若需要，修复范围：
  - 所有“已完成续租承接”的旧合同样本中，当前仍被写成 `status='EXPIRED'` 的合同。
  - 优先盘点同时满足以下条件的样本：
    - `isExtended = true`
    - `status = 'EXPIRED'`
    - remarks 中存在“续租至合同”或“续租记录”标记
  - 如条件允许，再结合同租客/同房间/衔接日期的新合同样本做二次校验，避免误伤真正“已到期但尚未处理”的合同。
- 修复原则：
  - 不能把全部 `EXPIRED` 合同批量改为 `TERMINATED`。
  - 必须区分：
    - 真实已到期待处理合同
    - 已完成续租承接、但历史上被错误保留为 `EXPIRED` 的旧合同
  - 只有后者才属于本次 fix 的历史修复对象。
- 若暂时不能立即修复全部历史数据：
  - 至少先冻结新规则，阻止新的续租旧合同继续落成 `EXPIRED`。
  - 同时输出一份盘点清单，供后续补做存量修复。

## 8. 验收标准
- 服务端事实层满足：
  - 续租完成后，旧合同状态切换为 `TERMINATED`，不再保留为 `EXPIRED`。
  - 退租完成后，旧合同继续保持 `TERMINATED`，不得被本次 fix 误伤。
- 合同卡片展示层满足：
  - 合同状态为 `ACTIVE` 时，继续展示当前卡片主体信息。
  - 合同状态为 `EXPIRED` 且仍未处理时，状态跟踪提示显示在状态徽标左侧，并正确展示“已过期 X 天”。
  - 合同完成续租承接或退租收口后，状态指示为 `TERMINATED`，不再展示状态跟踪提示。
- 详情页展示层满足：
  - 合同详情 Hero 的状态事实与列表页保持一致。
  - 若合同仍处于临界待处理态，详情页应使用与列表页一致的跟踪提示语义，不再只在部分场景展示。
- 统一语义层满足：
  - 列表页、详情页与到期提醒组件使用同一套到期提示窗口和文案算法。
  - 不再在卡片中硬编码 `30` 天窗口；应以系统设置 `contractExpiryAlertDays` 为准。
- 统计 / 筛选层满足：
  - 合同统计中的 `expiredCount` 不再把“已续租承接旧合同”计入到期待处理合同。
  - `expiring_soon` 与到期提醒结果应和合同卡片语义保持一致。
- 工程校验层满足：
  - `npm run lint` 通过。
  - `npm run type-check` 通过。
  - 至少完成一轮人工复核：
    - 合同列表页：`ACTIVE`、真实 `EXPIRED`、续租后旧合同、退租后旧合同四类样本
    - 合同详情页：上述样本对应详情卡片
    - 续租完成后旧合同状态切换与列表提示复核

## 9. 回滚条件
- 若修复后真实“已到期但尚未处理”的合同不再显示“已过期 X 天”跟踪提示，应立即停止并回滚。
- 若修复后续租完成的旧合同虽然隐藏了提示，但服务端状态仍保留为 `EXPIRED`，应停止并回滚，因为这只是掩盖事实而不是修正事实。
- 若修复误伤退租主链，导致退租完成合同不再显示 `TERMINATED`，应立即停止并回滚。
- 若历史数据修复采用批量硬改全部 `EXPIRED` 合同，导致真实待处理到期合同被误终止，应立即停止并回滚。
