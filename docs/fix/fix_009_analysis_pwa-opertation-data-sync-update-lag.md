# Fix 009 Analysis - 通过 PWA 入口执行操作后数据同步展示滞后

## 1. 问题摘要
- 对应问题：`fix_009`
- 问题级别：`P1`
- 是否阻断修复：是

## 2. 根因结论
- 根因一：问题主因不在 PWA / Service Worker，而在 `Next.js App Router` 生产模式下的客户端路由缓存未被正确失效。`/contracts`、`/bills` 等列表页虽然已声明 `dynamic = 'force-dynamic'`，但用户是在客户端导航返回列表，命中的是已访问或已预取的 RSC 路由缓存，而不是重新请求最新数据。
- 根因二：执行合同创建、退租等写操作的 Route Handler 在数据库事务成功后，没有调用 `revalidatePath` / `revalidateTag` 去标记相关页面为 stale，导致列表页、详情页、账单页仍沿用旧快照。根据 Next.js 官方文档，这类 mutation 后应在 Server Action 或 Route Handler 中显式调用 `revalidatePath`。
- 根因三：前端成功链路主要依赖 `router.push()` / `router.replace()` 跳转，但没有对受影响的列表页做显式刷新；同时列表页组件只消费服务端注入的 `initialContracts` / `initialBills` 快照，没有客户端二次拉取逻辑，因此一旦返回到旧缓存页面，就只能等待路由缓存自然过期或用户手动地址栏刷新。

## 3. 证据链
- 页面预展示链路：
  - [UnifiedNavigation](file:///home/dell/Projects/Rento/src/components/layout/UnifiedNavigation.tsx#L156-L160) 与 [UnifiedNavigation](file:///home/dell/Projects/Rento/src/components/layout/UnifiedNavigation.tsx#L225-L229) 对导航链接显式启用了 `prefetch={true}`。
  - 项目存在全局 [loading.tsx](file:///home/dell/Projects/Rento/src/app/loading.tsx#L1-L8)，说明这些页面在生产环境下具备 App Router 预取与客户端缓存条件。
  - [ContractListPage](file:///home/dell/Projects/Rento/src/components/pages/ContractListPage.tsx#L132-L238) 仅消费 `initialContracts`、`initialStats`、`initialExpiryAlerts` 作为静态输入，不会在页面重新获得焦点或重新进入时主动拉最新数据。
  - [BillListPage](file:///home/dell/Projects/Rento/src/components/pages/BillListPage.tsx#L122-L212) 同样仅消费 `initialBills`，没有任何成功后主动重拉或 cache busting 机制。
- 服务端实际创建链路：
  - [POST /api/contracts](file:///home/dell/Projects/Rento/src/app/api/contracts/route.ts#L121-L440) 在成功创建合同、更新房间并触发账单生成后，直接返回成功响应，没有调用 `revalidatePath` / `revalidateTag`。
  - [POST /api/contracts/[id]/checkout](file:///home/dell/Projects/Rento/src/app/api/contracts/[id]/checkout/route.ts#L99-L558) 在事务内同步完成合同状态、账单状态、房间状态、最终抄表等更新后，也没有任何路由失效动作。
  - 由于退租链路本身没有“延迟提交数据库”的异步收尾，这一链路仍出现列表状态延迟，能够反证“主因不是数据库写入慢，而是更新后页面没拿到新快照”。
- 数据模型映射：
  - 合同列表页的数据源是 [contracts/page.tsx](file:///home/dell/Projects/Rento/src/app/contracts/page.tsx#L26-L80) 中的 `contractQueries.findAll()`、`getContractStats()`、`getExpiryAlerts()` 服务端结果。
  - 账单列表页的数据源是 [bills/page.tsx](file:///home/dell/Projects/Rento/src/app/bills/page.tsx#L17-L53) 中的 `billQueries.findAll()` 服务端结果。
  - 只要客户端导航继续复用旧的 RSC payload，合同状态、账单状态、统计卡片都会一起滞后。
- 关键代码位置：
  - 列表页动态声明： [contracts/page.tsx](file:///home/dell/Projects/Rento/src/app/contracts/page.tsx#L18-L20) 、 [bills/page.tsx](file:///home/dell/Projects/Rento/src/app/bills/page.tsx#L9-L10)
  - 创建合同成功后跳转： [CreateContractPage](file:///home/dell/Projects/Rento/src/components/pages/CreateContractPage.tsx#L84-L104)
  - 退租成功后跳转： [CheckoutContractPage](file:///home/dell/Projects/Rento/src/components/pages/CheckoutContractPage.tsx#L265-L285)
  - 当前工程中 API Route Handler 下没有任何 `revalidatePath` / `revalidateTag` 使用：`src/app/api/**` 全局检索为空。
  - Service Worker 明确排除了动态接口与 RSC 请求缓存： [sw.js](file:///home/dell/Projects/Rento/public/sw.js#L12-L15) 、 [sw.js](file:///home/dell/Projects/Rento/public/sw.js#L61-L79) 、 [sw.js](file:///home/dell/Projects/Rento/public/sw.js#L160-L168)
- 是否存在历史脏数据：
  - 当前证据不支持“历史数据被错误写入”的判断。
  - 现象更符合“数据库已完成更新，但客户端继续展示旧快照”；用户手动地址栏刷新后即可恢复，进一步证明问题主要在展示同步层，而不是数据事实被写坏。

## 4. 影响面分析
- 新创建合同：
  - 受影响。
  - 创建后跳到合同详情页通常可见成功结果，但再回合同列表或账单列表时，容易复用旧缓存，导致新合同状态、房间占用状态、关联账单展示滞后。
  - 另外 [POST /api/contracts](file:///home/dell/Projects/Rento/src/app/api/contracts/route.ts#L357-L423) 的账单生成存在“快速等待最多 2 秒，超时则后台继续”的实现，这会放大用户对“列表状态还没更新”的感知，但它不能解释退租链路同样滞后，因此不是本问题的单一根因。
- 续租：
  - 高概率受影响。
  - 续租本质同样会改变合同列表、账单列表、房间状态或新旧合同关系；如果仍沿用当前“写后不失效页面缓存”的模式，会复现同类问题。
- 手工生成账单：
  - 高概率受影响。
  - 任何新增/编辑/支付账单后，如果回到 `bills` 列表仍使用旧的客户端路由缓存，同样会看到旧状态。
- 历史已生成账单：
  - 不直接影响历史账务事实。
  - 影响的是“用户对历史账单最新状态的即时感知”，不是账单记录本身被回退或改坏。
- 统计 / 仪表盘：
  - 受影响。
  - 因为合同统计、账单统计、到期提醒等都来自服务端聚合结果，一旦列表与工作台页共享旧快照，它们会一起表现出“明明操作成功但统计数字没变”的滞后感。

## 5. 候选方案对比
### 方案 A
- 做法：
  - 在合同创建、退租、续租、账单状态变更等写操作 Route Handler 成功后，对受影响路径显式调用 `revalidatePath`。
  - 最小首批路径至少包括：`/contracts`、`/contracts/[id]`、`/bills`，视实际链路补充 `/rooms`、`/`（工作台）等聚合入口。
  - 对关键成功跳转页，补充 `router.refresh()` 或成功后重定向到新路径并刷新当前 route tree，避免用户立刻返回旧缓存页面时看到旧快照。
  - 对导航中最容易引发旧快照复用的关键列表页，审慎评估是否关闭 `prefetch`，或只对这些高频写后返回页面关闭。
- 优点：
  - 与 Next.js App Router 官方建议一致，保持单一 Web/PWA 主线，不需要引入新的状态管理体系。
  - 修复边界最小，重点解决“写后页面失效”而不是重写整个前端数据层。
  - Web 与 PWA 会同时受益，因为问题根因不是 PWA 特有实现。
- 风险：
  - 需要梳理每个 mutation 影响哪些页面；若漏掉路径，仍会有局部滞后。
  - 若为了图省事一次性对 `/` layout 级做过大范围失效，会增加不必要的刷新成本。

### 方案 B
- 做法：
  - 为合同列表、账单列表、工作台、详情页统一引入客户端数据层（例如 React Query / SWR / 自定义轮询刷新），所有变更后通过客户端主动重新拉取最新数据。
  - 甚至进一步引入 BroadcastChannel、轮询、WebSocket 或更复杂的实时同步设计。
- 优点：
  - 理论上可获得更强的即时同步控制。
  - 可以支持跨标签页、跨入口更复杂的实时更新体验。
- 风险：
  - 复杂度显著上升，与当前项目“单一 Web 主线、低复杂度、PWA 只做渐进增强”的治理原则不符。
  - 会把当前 fix 从“修 App Router 缓存失效缺口”升级成“重建前端数据同步体系”，明显超出局部修复边界。
  - 当前问题并没有证据表明必须上实时同步架构才能解决。

## 6. 推荐方案
- 推荐原因：
  - 推荐 `方案 A`。
  - 当前问题已经由三条证据收口：`PWA 与普通生产 Web 都能复现`、`SW 明确不缓存动态接口/RSC`、`Route Handler 成功后没有任何路径失效动作`。因此最合理的修复路径是补齐 App Router 的缓存失效与成功后刷新策略，而不是否定 PWA 主线本身。
  - Next.js 官方文档明确指出：写操作后应在 Server Action 或 Route Handler 中调用 `revalidatePath`；同时 `Link` 预取是 production-only，可按需要关闭。当前项目的行为与官方建议正好存在缺口。
- 实施边界：
  - 只修“写后最新状态不能及时展示”的同步问题。
  - 首批聚焦合同创建、退租，以及它们必然影响的合同列表、合同详情、账单列表、工作台/房间状态入口。
  - 以“最小可解释失效路径 + 必要的客户端刷新”完成收口，不引入 React Query、WebSocket、离线写队列或复杂跨页状态总线。
- 明确不在本次修复范围内的内容：
  - 不重构 PWA 架构，不暂停 `phase05` 已完成的 PWA 主线。
  - 不新增完整实时同步基础设施。
  - 不把所有页面都改成客户端主动轮询刷新。
  - 不修改 Service Worker 缓存边界，因为当前证据已表明它不是主因。

## 7. 数据修复策略
- 是否需要修历史数据：不需要
- 若需要，修复范围：无
- 若不需要，原因：
  - 当前问题是写后展示滞后，不是数据事实落库错误。
  - 退租、创建合同等主链操作在服务端事务内已完成，手动刷新后页面可恢复正确状态，说明数据库真相源未被系统性写坏。

## 8. 验收标准
- 在生产模式下（包含普通浏览器入口与已安装 PWA 入口），执行“创建合同”后，进入合同详情并返回 `/contracts`、`/bills`、工作台时，相关状态与统计应立即反映最新结果，不需要等待自然过期，也不需要手动地址栏刷新。
- 在生产模式下执行“退租”后，合同详情、合同列表、账单列表、房间状态与相关统计应在一次成功操作后的下一次页面进入中立即显示最新状态。
- Web 与 PWA 两种入口表现一致；不得出现“普通 Web 已更新、PWA 仍旧滞后”的分叉。
- Service Worker 继续保持“只缓存静态壳，不缓存动态接口 / RSC / 预取请求”的既定边界，不因为修复同步问题而引入新的业务真相源分叉。

## 9. 回滚条件
- 修复后若出现大范围误失效，导致关键页面每次导航都整页抖动、性能明显退化或频繁重复请求，需要回滚到最小影响边界并重新评估失效路径。
- 修复后若导致合同、账单、工作台之间出现新的不一致，例如某些页面刷新了、某些页面没有刷新，且无法通过明确路径补齐收口，需要暂停实现并回到 `/spec` 重新冻结受影响页面集合。
