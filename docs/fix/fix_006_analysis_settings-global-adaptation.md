# Fix 006 Analysis - 设置页全局配置项适配

## 1. 问题摘要
- 对应问题：`fix_006`
- 问题级别：`P1 / design-review`
- 是否阻断修复：否

本问题本质上不是单点 bug，而是一次“全局配置真相源”设计排查。当前设置页承担了“全局配置入口”的产品定位，但页面里展示的很多配置项并没有真正进入业务兜底链路，导致设置页同时存在三类语义混杂：
- 第一类：真正参与业务兜底的配置，例如水电单价。
- 第二类：只在前端局部提示或文案中消费、没有进入服务端主链的配置，例如抄表异常阈值和自动生成账单。
- 第三类：完全未被业务使用、只是停留在设置页表单上的配置，例如自动备份、通知、主题、默认租金周期等。

如果不收口，设置页就会继续表现为“看起来像全局真相源，实际上很多配置改了也不会影响系统”的设计孤岛。

## 2. 根因结论
- 根因一：设置页的保存链路是通的，但“可保存”被误当成了“已接入业务”。当前 `/api/settings`、`useSettings()`、`GlobalSettingsManager` 能把设置写进数据库和 localStorage，但这并不代表业务主链真的会读取这些值。
- 根因二：设置页中的配置项与全局设置真相源已经发生漂移。`global-settings.ts` 的默认项里存在 `gasPrice`，且业务计算代码会真实消费它，但设置页和 `AppSettings` 类型并没有暴露它，形成“业务在用、管理界面不可见”的断层。
- 根因三：抄表相关配置虽然出现在设置页，但服务端主流程没有读取它们。`usageAnomalyThreshold`、`autoGenerateBills`、`requireReadingApproval` 在抄表 API 中仍由服务端硬编码默认值控制，因此设置页修改不能真实影响主链。
- 根因四：一批配置项只存在于设置页自身或设置模型中，根本没有真实适配场景，例如 `defaultRentCycle`、`autoBackup`、`theme`、`enableNotifications`、`readingCycle`、`readingReminderDays` 等，它们没有进入任何业务兜底逻辑。
- 根因五：设置页当前同时承载了“真实业务兜底配置”“运维治理入口”“纯展示信息”“未接线开关”四种性质不同的项，但没有在产品层明确区分哪些是有效配置、哪些是工具入口、哪些只是待建设占位，导致用户会自然理解为“页面上所有项都已生效”。

## 3. 证据链
- 页面预展示链路：
  - 设置页配置项清单定义在 [page.tsx](file:///home/dell/Projects/Rento/src/app/settings/page.tsx#L47-L252)。
  - 当前页面分组为：
    - 基础设置：`electricityPrice`、`waterPrice`、`defaultRentCycle`、`reminderDays`
    - 抄表设置：`readingCycle`、`customReadingDays`、`readingReminderDays`、`usageAnomalyThreshold`、`autoGenerateBills`、`requireReadingApproval`
    - 系统设置：`autoBackup`、`enableNotifications`、`theme`
    - 数据管理：导出、备份按钮
    - 运维治理：`systemHealth`、`dataConsistency`
    - 应用信息：版本、构建日期
  - 页面展示上并没有区分“已真实生效的业务配置”和“尚未接入主链的配置”，用户看到的是统一层级的设置项。
- 服务端实际创建链路：
  - 设置 API [route.ts](file:///home/dell/Projects/Rento/src/app/api/settings/route.ts#L22-L84) 的 `GET / POST / DELETE` 都是正常可用的，说明设置读写不是问题本身。
  - 设置初始化 API [init/route.ts](file:///home/dell/Projects/Rento/src/app/api/settings/init/route.ts#L10-L35) 会把默认设置落库。
  - `useSettings()` [useSettings.ts](file:///home/dell/Projects/Rento/src/hooks/useSettings.ts#L61-L126) 会优先从数据库加载，失败时初始化，再回退到 localStorage；[useSettings.ts](file:///home/dell/Projects/Rento/src/hooks/useSettings.ts#L131-L237) 负责更新和重置。
  - 这条链路证明“设置系统本身可写可读”，但不能证明“业务主链已适配这些设置”。
- 数据模型映射：
  - Prisma `GlobalSetting` 模型定义在 [schema.prisma](file:///home/dell/Projects/Rento/prisma/schema.prisma#L13-L27)，结构是通用 `key/value/type/category/description`。
  - 全局默认设置真相源在 [global-settings.ts](file:///home/dell/Projects/Rento/src/lib/global-settings.ts#L21-L128)，其中包含：
    - `electricityPrice`
    - `waterPrice`
    - `gasPrice`
    - `defaultRentCycle`
    - `autoBackup`
    - `theme`
    - `enableNotifications`
    - `reminderDays`
    - `readingCycle`
    - `customReadingDays`
    - `readingReminderDays`
    - `usageAnomalyThreshold`
    - `autoGenerateBills`
    - `requireReadingApproval`
  - 但前端 `AppSettings` [useSettings.ts](file:///home/dell/Projects/Rento/src/hooks/useSettings.ts#L8-L29) 和设置页 UI 没有 `gasPrice`，已经出现模型与界面不一致。
- 实际消费点：
  - 真正进入业务兜底的配置：
    - `electricityPrice`、`waterPrice`、`gasPrice` 会被 [bill-calculations.ts](file:///home/dell/Projects/Rento/src/lib/bill-calculations.ts#L42-L91) 用作服务端水电气费计算回退值。
    - `electricityPrice`、`waterPrice`、`gasPrice` 也会被 [meter-utils.ts](file:///home/dell/Projects/Rento/src/lib/meter-utils.ts#L271-L344) 用于仪表默认单价回填。
  - 只被局部消费、未形成真实业务兜底的配置：
    - `usageAnomalyThreshold` 只在 [SingleMeterReadingModal.tsx](file:///home/dell/Projects/Rento/src/components/business/SingleMeterReadingModal.tsx#L118-L126) 前端异常提示里使用。
    - `autoGenerateBills` 只在 [BatchMeterReadingPage.tsx](file:///home/dell/Projects/Rento/src/components/pages/BatchMeterReadingPage.tsx#L323-L332) 中参与文案提示。
  - 被服务端硬编码绕过的配置：
    - 抄表 API [meter-readings/route.ts](file:///home/dell/Projects/Rento/src/app/api/meter-readings/route.ts#L16-L23) 直接定义了 `getServerSettings()`：
      - `usageAnomalyThreshold: 3.0`
      - `autoGenerateBills: true`
      - `requireReadingApproval: false`
    - 后续主流程使用的是这组硬编码值，而不是数据库里的全局设置。
  - 未被业务使用的配置：
    - `defaultRentCycle`：设置页里可改，但合同表单与合同流程没有读取该全局默认项。
    - `reminderDays`：提醒函数 [bill-calculations.ts](file:///home/dell/Projects/Rento/src/lib/bill-calculations.ts#L185-L236) 仍硬编码 `7` 天。
    - `readingCycle`、`customReadingDays`、`readingReminderDays`：仅设置页自身显示/切换，没有发现业务消费点。
    - `autoBackup`：设置页的“备份数据”按钮在 [page.tsx](file:///home/dell/Projects/Rento/src/app/settings/page.tsx#L40-L45) 仍是 TODO。
    - `enableNotifications`：未发现通知系统消费点。
    - `theme`：应用实际主题由 `next-themes` 等主题系统控制，而不是设置页里的这个全局字段。
- 关键代码位置：
  - 设置页：[page.tsx](file:///home/dell/Projects/Rento/src/app/settings/page.tsx)
  - 设置 Hook：[useSettings.ts](file:///home/dell/Projects/Rento/src/hooks/useSettings.ts)
  - 设置 API：[route.ts](file:///home/dell/Projects/Rento/src/app/api/settings/route.ts)
  - 全局设置真相源：[global-settings.ts](file:///home/dell/Projects/Rento/src/lib/global-settings.ts)
  - 抄表 API 硬编码设置：[meter-readings/route.ts](file:///home/dell/Projects/Rento/src/app/api/meter-readings/route.ts#L16-L23)
  - 账单计算回退全局价格：[bill-calculations.ts](file:///home/dell/Projects/Rento/src/lib/bill-calculations.ts#L42-L91)
- 是否存在历史脏数据：
  - 不存在典型的“历史数据被写坏”问题。
  - 当前问题更偏“全局设置设计语义漂移”和“配置未适配主链”，不需要像账单、抄表那样做历史事实修复。

## 4. 影响面分析
- 新创建合同：
  - 受影响。`defaultRentCycle` 作为设置页可配项，当前并没有进入合同创建的默认值链路，用户会误以为修改后能影响新合同。
- 续租：
  - 若未来复用默认租期、提醒或通知能力，当前未接线状态会继续扩散误解。
- 手工生成账单：
  - 水电气费计算的单价兜底已经真实接入，因此这部分设置是有效的；但提醒天数、通知等围绕账单的全局配置并未实际适配。
- 历史已生成账单：
  - 不会直接破坏历史账单事实，但会影响用户对“设置页修改后是否会影响后续业务”的预期。
- 统计 / 仪表盘：
  - 若未来统计提醒、通知或抄表周期，当前设置项未接入会导致统计和设置页继续脱节。
- 抄表主链：
  - 影响明显。设置页暴露了 `usageAnomalyThreshold`、`autoGenerateBills`、`requireReadingApproval`，但服务端主链未读取，导致配置页和主链双重真相。
- 运维治理：
  - `systemHealth` 与 `dataConsistency` 作为入口本身合理，但它们属于治理工具，不应与“真实业务兜底配置”混成同一产品语义层。

## 5. 候选方案对比
### 方案 A
- 做法：
  - 保留当前设置页结构不动。
  - 逐项把所有设置页配置全部接线进真实业务。
  - 包括默认租期、提醒、通知、抄表审批、备份、主题等全部补齐落地。
- 优点：
  - 表面上最完整，能让“设置页所有项都可生效”的承诺成立。
  - 后续若所有子系统都成熟，用户心智最统一。
- 风险：
  - 明显超出 `fix_006` 的合理边界，会把一次“设计适配排查”扩成多个独立子系统建设。
  - 通知、备份、主题、审批这些能力本身都不是小改动，短期内难以保证质量。
  - 容易把问题从“设置页设计收口”升级成“大量新功能开发”。

### 方案 B
- 做法：
  - 以“全局配置兜底真相源”为目标，严格收口设置页：
    - 保留已真实接入主链的配置项
    - 对高价值但未完全接线的配置进行补齐
    - 对尚无真实场景或明显未接线的配置暂时隐藏、禁用或降级为信息说明
  - 具体优先级：
    - 第一优先：补齐 `gasPrice` 的设置页暴露，因为业务已真实消费它
    - 第二优先：让抄表服务端读取数据库全局设置，而不是继续硬编码 `usageAnomalyThreshold / autoGenerateBills / requireReadingApproval`
    - 第三优先：明确区分“业务配置”“治理入口”“只读信息”，避免同层级误导
    - 第四优先：对 `defaultRentCycle / reminderDays / autoBackup / theme / enableNotifications / readingCycle` 等未接线项，选择暂时移除、标注“暂未启用”或降级为开发占位，不承诺其已生效
- 优点：
  - 最符合本次 issue 的真正目标：排查适配场景，消灭设计孤岛。
  - 改动边界清晰，先修复“看得见却不生效”的关键项。
  - 能让设置页重新回归“真正的全局兜底入口”，而不是功能样板间。
- 风险：
  - 需要接受一个现实：设置页短期内会变“更少”，而不是“更全”。
  - 若后续确实需要完整通知/备份/主题等配置，仍需单独立项建设。

## 6. 推荐方案
- 推荐原因：
  - 推荐采用 **方案 B 的“真相源收口方案”**。
  - `fix_006` 的核心不是“让设置页更大”，而是“让设置页里出现的配置项都具备真实业务意义”。
  - 对一个全局设置入口来说，最危险的不是功能少，而是“配置存在但不生效”，这会持续伤害用户对系统的信任。
- 实施边界：
  - 先把设置项分层：
    - `真实业务兜底配置`
    - `治理工具入口`
    - `只读信息`
    - `暂未启用/未接线配置`
  - 优先补齐：
    - `gasPrice` 设置页暴露与类型适配
    - 抄表服务端从数据库读取 `usageAnomalyThreshold / autoGenerateBills / requireReadingApproval`
  - 优先收口：
    - 对 `defaultRentCycle`、`reminderDays`、`autoBackup`、`enableNotifications`、`theme`、`readingCycle`、`customReadingDays`、`readingReminderDays` 等未进入主链的项，不再把它们继续包装成已生效全局配置
  - 页面语义收口：
    - 设置页保留为“全局兜底配置入口”
    - 治理工具入口继续存在，但要和业务配置区明确分层
    - 纯信息项保留为只读，不应与业务配置同义化
- 明确不在本次修复范围内的内容：
  - 不在本次 fix 中顺手实现完整通知系统
  - 不在本次 fix 中顺手实现自动备份调度系统
  - 不在本次 fix 中重做全局主题系统
  - 不在本次 fix 中扩展完整抄表审批流
  - 不在本次 fix 中把所有未来可能的设置项一次性全部接线

## 7. 数据修复策略
- 是否需要修历史数据：一般不需要，但需要做配置口径清理。
- 若需要，修复范围：
  - 若数据库中已有 `gasPrice` 等设置项，但设置页未暴露，只需做配置入口补齐，不涉及历史业务事实修复。
  - 若未来决定下线某些未启用设置项，可保留数据库记录但不再在 UI 暴露，避免直接删除历史配置。
- 若不需要，原因：
  - 当前问题不在于历史业务数据错误，而在于“配置存在但没有真实适配场景”。

## 8. 验收标准
- 设置页中保留的“业务配置项”必须都能在真实业务主链中找到明确消费点。
- `gasPrice` 若继续作为业务兜底项存在，设置页必须能够查看和维护它。
- 抄表相关设置若继续对外暴露，服务端抄表主链必须真实读取它们，而不是继续使用硬编码默认值。
- 治理工具入口、业务配置、只读信息必须在页面上有明确分层，不再让用户误认为它们都是同一语义级别的“全局配置”。
- 未接入主链、暂无真实适配场景的设置项不得继续以“已生效配置”姿态展示给用户。
- 修改设置后，对应业务主链必须表现出可验证的变化；若不能验证，则该项不应继续出现在正式设置区。

## 9. 回滚条件
- 若收口过程中出现以下任一情况，必须立即回滚：
  - 原本真实生效的水电气单价兜底能力被破坏
  - 抄表主链因接入全局设置而出现行为回退或账单生成异常
  - 设置页因为大规模删改导致已有治理入口不可达
- 若后续验证发现：
  - 某些看似“未接线”的配置实际上在隐藏流程中被依赖
  - 设置页分类收口会影响现有运维或开发治理路径
  - 用户对“暂未启用/治理入口”的分层表达仍然产生误解
  则必须补充更细粒度的配置分层设计，再推进实现，而不能直接粗暴删除设置项。

## 10. 实施收口补充
- 第一批实施已完成：
  - `gasPrice` 暴露到设置页与前端设置类型
  - 合同默认值进入真实合同创建主链
  - 抄表服务端主链改为读取数据库全局设置，而不是继续使用硬编码默认值
  - 设置页完成“业务配置 / 治理入口 / 只读信息 / 暂未开放项”的分层
- 第二批实施已完成：
  - `contractExpiryAlertDays` 进入真实主链，统一收口合同列表“即将到期”筛选、合同统计、合同详情提醒与 Dashboard 离店提醒
  - 离店提醒标题文案改为与统一窗口口径一致，不再继续固定写成 `30天离店`
  - `billReminderDays` 经源码核对后确认暂无真实账单提醒消费链，因此未进入正式设置区
- 当前建议：
  - `fix_006` 到此收口，不继续在同一 fix 中扩写更多设置项
  - `upcomingMoveInAlertDays` 若要继续推进，应作为后续独立 fix 候选
  - `billReminderDays` 若未来推进，应先形成真实账单提醒主链，再决定是否进入 settings
