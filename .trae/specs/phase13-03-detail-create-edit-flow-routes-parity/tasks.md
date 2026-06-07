# Tasks
- [x] Task 1: 盘点 `phase13-03` 范围内主链详情/新建/编辑/流程页的新旧宿主输入与高保真参考源。
  - [x] SubTask 1.1: 复核 `src/app/rooms/[id]/**`、`src/app/contracts/**`、`src/app/bills/**` 中页面级 `generateMetadata()`、`notFound()`、`dynamic = 'force-dynamic'`、server query 与 Decimal 转换现状。
  - [x] SubTask 1.2: 复核旧 `Rento` 页面主体、既有 `src/components/pages/*` 与 `src/components/business/*` 的可复用部分，明确哪些内容可直接承接，哪些内容必须先拆除 `next/*` 宿主协议。
  - [x] SubTask 1.3: 明确 `phase13-02` 当前 legacy document fallback 中哪些路径属于本轮收回范围，哪些路径仍应留到后续子任务。

- [x] Task 2: 为房源详情/编辑/新增页建立真实 route module 与页面级数据边界。
  - [x] SubTask 2.1: 为 `/rooms/:id`、`/rooms/:id/edit`、`/add/room` 建立新宿主 route module、loader、pending、error、not-found 与提交后回跳策略。
  - [x] SubTask 2.2: 高保真复用旧房源详情/表单表达，不新增第二套 UI 结构或迁移说明模块。
  - [x] SubTask 2.3: 确保房源编辑与新增页未放宽删除门禁、房态语义、仪表历史保留或合同关联边界。

- [x] Task 3: 为合同详情/编辑/新建/续租/退租页建立真实 route module 与流程承接。
  - [x] SubTask 3.1: 为 `/add/contract`、`/contracts/new`、`/contracts/:id`、`/contracts/:id/edit`、`/contracts/:id/renew`、`/contracts/:id/checkout` 建立新宿主 route module、loader、pending、error、not-found 与提交后回跳策略。
  - [x] SubTask 3.2: 拆离旧页面中的合同详情查询、续租/退租动作装配与 Decimal 转换，收口到新宿主可解释的数据装配层。
  - [x] SubTask 3.3: 确保合同主链语义、账单联动、历史保留和流程反馈保持与旧原型一致，不因迁移放宽服务端业务边界。

- [x] Task 4: 为账单新建/详情/编辑页建立真实 route module 与页面装配层。
  - [x] SubTask 4.1: 为 `/bills/create`、`/bills/:id`、`/bills/:id/edit` 建立新宿主 route module、loader、pending、error、not-found 与提交后回跳策略。
  - [x] SubTask 4.2: 拆离旧页面中的页面级查询、账单金额字段转换与错误出口，保持 `monthlyRent`、`totalRent`、`amount`、`receivedAmount`、`pendingAmount` 等账务语义稳定。
  - [x] SubTask 4.3: 确保账单详情与编辑页继续高保真复用旧 UI 表达，不引入新的视觉分层或重设计。

- [x] Task 5: 收缩 `phase13-02` fallback 边界并补齐兼容项说明。
  - [x] SubTask 5.1: 将 `phase13-03` 范围内已完成迁移的路由从 legacy document fallback 中移出，避免新旧宿主双入口并存。
  - [x] SubTask 5.2: 对仍需保留的兼容桥接写明存在原因、适用范围与退出条件，避免兼容逻辑重新成为默认真相源。
  - [x] SubTask 5.3: 确认本子任务未越界到租客、抄表、retained-legacy API/query、PWA runtime 或 cutover 逻辑。

- [x] Task 6: 以旧 `Rento` 为直接原型完成高保真验收与工程验证。
  - [x] SubTask 6.1: 对照旧页面源码逐项复核房源、合同、账单详情/表单/流程页的信息结构、组件表达、导航节奏、表单交互和状态反馈。
  - [x] SubTask 6.2: 清理迁移说明文案、宿主标签、额外辅助卡片、开发态占位元素与其他显著 UI 漂移项，确保当前前端展示效果高保真还原。
  - [x] SubTask 6.3: 完成最小工程验证，至少执行 `npm run lint`、`npm run type-check`，并在条件允许时执行 `npm run build:minix` 与最小浏览器验收。

- [x] Task 7: 指定独立子代理执行 `phase13-03` 终审，并仅在通过后才能提交推送。
  - [x] SubTask 7.1: 由独立子代理复核范围未越界到 `phase13-04 ~ phase16`。
  - [x] SubTask 7.2: 由独立子代理复核详情页、表单页、流程动作页是否保持旧 `Rento` 原型与 UI 保真边界。
  - [x] SubTask 7.3: 仅在独立子代理明确给出“通过”结论后，才允许标记完成、提交并推送远程仓库。

- [x] Task 8: 修复独立终审发现的范围、错误语义与加载边界阻断项。
  - [x] SubTask 8.1: 收口 `/api/buildings*` 的范围说明与真相源同步，明确其属于 `/add/room` 内嵌 `BuildingSelector` 的最小正式承接，并把旧 `src/app/api/buildings*` 降级为薄 compat wrapper 或显式回滚基线，消除双实现并存。
  - [x] SubTask 8.2: 统一房源删除、合同详情动作、合同编辑、续租、退租结算等失败链路对 Hono 错误包的读取，优先透出 `error`、`details.code`、`details.suggestion` 与 `blockingReasons`，保持页面级错误出口可解释。
  - [x] SubTask 8.3: 为合同新建、详情、编辑、续租、退租页补齐与 spec 一致的 route-level pending 边界，确保 loader / pending / error / not-found 结论真实成立。
  - [x] SubTask 8.4: 复核 `/contracts/new` 与账单域 legacy 回落等尾项，确认 `/bills/stats` 仍属 `phase13` 已冻结的 P2 延后页，当前继续保留 legacy document fallback，已在路由注释中显式收口。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 1
- Task 5 depends on Task 2, Task 3, and Task 4
- Task 6 depends on Task 2, Task 3, Task 4, and Task 5
- Task 8 depends on Task 7
- Task 7 depends on Task 6 and Task 8
