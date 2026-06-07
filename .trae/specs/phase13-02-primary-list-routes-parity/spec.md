# Phase13-02 一级正式列表页高保真迁移 Spec

## Why
当前 `src/minix` 中 `/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 仍由 `PlaceholderPage` 承接，用户虽然能进入新宿主，但无法浏览真实一级正式业务页。需要把这些 P0 页面迁入 `src/minix`，作为后续详情页、动作页与 `phase14` API/query parity 的稳定前置输入。

## What Changes
- 把 `/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 从 `PlaceholderPage` 升级为真实页面壳与页面装配层
- 在新宿主中为上述页面建立 route module、首屏数据边界、页面级 loading/error/not-found 同类边界
- 以旧 `Rento` 源代码为直接原型，高保真复用既有 `src/components/pages/*`、`src/components/business/*` 表达层
- 仅做退出 `next/*` 宿主协议所需的最小技术适配，不切 retained-legacy API，不补 P1 详情/编辑/流程动作页

## Impact
- Affected specs: `phase13-frontend-page-parity-implementation`, `phase12-frontend-parity-and-shell-cutover`
- Affected code: `src/minix/router/index.tsx`, `src/minix/routes/PlaceholderPage.tsx`, `src/minix/routes/*`, `src/components/pages/RoomListPage.tsx`, `src/components/pages/ContractListPage.tsx`, `src/components/pages/BillListPage.tsx`, `src/app/add/page.tsx`, `src/app/settings/page.tsx`

## ADDED Requirements
### Requirement: 一级正式业务页必须替换 Placeholder 承接
系统 SHALL 将 `/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 从 `PlaceholderPage` 替换为真实正式页面壳，并继续以 `src/minix` 作为正式前端宿主。

#### Scenario: 访问一级正式业务页
- **WHEN** 用户访问 `/rooms`、`/add`、`/contracts`、`/bills` 或 `/settings`
- **THEN** 页面展示真实页面壳与首屏内容，而不是说明性占位页或 placeholder 内容

### Requirement: 一级正式业务页必须以旧 Rento 源代码为直接原型高保真承接
系统 SHALL 以旧 `Rento` 对应页面源代码为直接迁移原型；除已批准的最小技术适配外，`/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 必须接近 `100%` 还原旧页面的信息结构、组件表达、导航节奏、表单交互、状态反馈与主链语义。

#### Scenario: 对照旧原型验收一级正式业务页
- **WHEN** 对照旧 `Rento` 对应页面源代码审查新宿主中的一级正式业务页
- **THEN** 不得保留说明性迁移文案、宿主标签、开发态状态卡、验收辅助卡片、占位交互或其他不属于旧页面原型的结构漂移项

### Requirement: 一级正式业务页必须具备单一解释的 route module 与页面级状态边界
系统 SHALL 为 `/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 建立 route module、页面装配层与首屏数据边界，并确保页面级 loading/error/not-found/返回/跳转/搜索/恢复路径具备单一解释。

#### Scenario: 一级正式业务页进入加载或异常状态
- **WHEN** 用户访问一级正式业务页且首屏加载中、数据异常或需要恢复
- **THEN** 新宿主通过 route module 提供统一的页面级状态边界，而不是继续依赖 `PlaceholderPage` 或旧 `src/app/**/page.tsx` 的宿主协议

## MODIFIED Requirements
### Requirement: P0 一级正式页面成为 `phase14` API/query parity 的直接上游输入
`phase13-02` 完成后，`/rooms`、`/add`、`/contracts`、`/bills`、`/settings` 不再只是路由占位，而是成为 `phase14` retained-legacy API/query drain 的直接页面上游输入；但该变更仅限页面 parity，不等于在本子任务内切换 retained-legacy API 宿主。

## REMOVED Requirements
- 无
