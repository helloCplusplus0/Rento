# Phase13-06 首页高保真收口 Spec

## Why
`phase13-01` 已把首页 `/` 从说明性承接页升级为真实工作台页面壳，但 `phase13-05` 的全量审计仍把首页冻结为“部分迁移”。需要通过独立的 `phase13-06` 子任务，把首页对旧 `Rento` 原型的高保真复验、差异清单与最终验收结论收口为单一真相源。

## What Changes
- 对照旧 `DashboardPage.tsx` / `DashboardPageWithStats.tsx`，重新审查 `src/minix/routes/HomePage.tsx` 与 `src/minix/components/homepage/*` 的信息结构、入口语义、状态反馈与导航节奏
- 产出首页 parity gap 清单，并仅对阻断验收的首页问题执行最小修复
- 固定首页人工浏览器高保真对照步骤、通过标准与未通过判定条件
- 在首页通过高保真复验后，把首页迁移状态从“部分迁移”更新为可验收的单一结论
- 明确首页收口仅限页面 parity，不切 dashboard retained-legacy API/query，不扩写通知中心、个人资料、治理入口或 PWA runtime

## Impact
- Affected specs: `phase13-frontend-page-parity-implementation`, `phase13-05-page-parity-acceptance-baseline`, `phase12-frontend-parity-and-shell-cutover`
- Affected code: `src/minix/routes/HomePage.tsx`, `src/minix/components/homepage/*`, `src/components/pages/DashboardPage.tsx`, `src/components/pages/DashboardPageWithStats.tsx`, `docs/phase13_*`

## ADDED Requirements
### Requirement: 首页必须完成高保真浏览器对照
系统 SHALL 对首页 `/` 执行基于旧 `Rento` 原型的人工浏览器高保真对照，并形成单一可复核的验收结论。

#### Scenario: 首页浏览器复验通过
- **WHEN** 对照旧 `DashboardPage.tsx` / `DashboardPageWithStats.tsx` 复验首页的搜索入口、快捷入口、提醒面板、统计卡与个人入口
- **THEN** 首页在除最小技术适配外应保持接近 `100%` 的信息结构、组件表达、导航节奏、状态反馈与主链语义保真度

### Requirement: 首页 parity gap 必须显式记录并最小收口
系统 SHALL 在 `phase13-06` 中列出首页当前的 parity gap，并仅对阻断验收的 gap 执行最小修复或明确阻断结论。

#### Scenario: 首页仍存在显著漂移
- **WHEN** 首页仍保留迁移说明卡、宿主标签、重复入口、技术态文案或其他不属于旧原型的结构
- **THEN** 这些差异必须被记录为阻断项，且首页不得被标记为通过保真验收

### Requirement: 首页迁移状态必须从“部分迁移”收口为单一结论
系统 SHALL 在 `phase13-06` 完成后，把首页 `/` 的迁移状态收口为“已通过保真验收”或“仍阻断验收”的单一结论。

#### Scenario: 首页收口结论输出
- **WHEN** `phase13-06` 完成独立验收
- **THEN** 首页不再仅以“部分迁移”作为模糊状态保留，而是具备明确的通过或阻断结论

### Requirement: 首页收口不得越界到 phase14
系统 SHALL 将 `phase13-06` 严格限制在首页页面 parity 与高保真验收范围内，不得提前切 dashboard retained-legacy API/query 或引入 `phase14` 的 drain 职责。

#### Scenario: 首页收口时审查边界
- **WHEN** 实施首页差异修复或验收收口
- **THEN** 变更不得被解释为 dashboard 正式 API/query 宿主切流、retained-legacy drain、通知中心扩写或 PWA runtime 迁移

## MODIFIED Requirements
### Requirement: 首页迁移完成标准
首页在 `phase13` 中的完成标准不再只看“真实页面壳是否已落位”，还必须额外满足：已基于旧 `Rento` 首页原型完成高保真浏览器对照、首页 parity gap 已被收口为单一结论、且未越界到 `phase14` API/query parity。

## REMOVED Requirements
- 无
