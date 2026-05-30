# Fix 013 PC 与移动端功能入口一致性 Spec

## Why
`fix_012` 在移动端视觉收口过程中，暴露出 PC 与移动端在正式功能入口、搜索与通知表达、以及批量抄表信息辅助上的不一致。  
当前项目已明确禁止 PC/移动端出现功能入口集合差异，因此需要以 `fix_013` 收口这些跨端不一致，而不是继续把问题混在纯视觉优化里。

## What Changes
- 统一 PC 与移动端对正式业务主链入口的暴露方式，消除“主导航缺失后由工作台补偿”的状态
- 将移动端底部导航中的 `设置` 替换为 `账单`
- 将 `设置` 新增到工作台快捷宫格，作为移动端的正式设置入口
- 将 PC 端顶部搜索图标升级为正式搜索框，并移除与其重复的 PC 工作台搜索区
- 收口通知入口的占位状态，避免继续存在“桌面占位、移动缺席”的伪入口
- 让批量抄表页 PC 端补齐与移动端一致的关键业务判断信息
- 清理未被正式路径采用的 `MobileSearchBar.tsx`
- **BREAKING** 移动端底部导航不再直接暴露 `设置`，改由工作台快捷宫格承担设置入口

## Impact
- Affected specs:
  - 全局导航一致性
  - 工作台快捷入口一致性
  - 搜索 / 通知入口一致性
  - 批量抄表页跨端信息一致性
  - 过时移动端专用组件治理
- Affected code:
  - `src/lib/navigation-config.ts`
  - `src/components/layout/UnifiedNavigation.tsx`
  - `src/components/pages/DashboardPageWithStats.tsx`
  - `src/components/business/FunctionGrid.tsx`
  - `src/components/business/SearchBar.tsx`
  - `src/components/pages/BatchMeterReadingPage.tsx`
  - `src/components/business/MobileSearchBar.tsx`

## ADDED Requirements
### Requirement: 移动端账单入口与设置入口重新归位
系统 SHALL 让移动端底部导航重新提供 `账单` 一级入口，并将 `设置` 迁移为工作台快捷宫格中的正式入口。

#### Scenario: 移动端查看一级导航
- **WHEN** 管理者在移动端查看底部导航
- **THEN** 底部导航应包含 `账单`
- **AND** 底部导航不再直接显示 `设置`
- **AND** 管理者仍可在工作台快捷宫格中进入 `设置`

### Requirement: PC 端搜索入口升级为正式搜索框
系统 SHALL 将 PC 端顶部搜索图标替换为正式搜索框，并移除与之重复的 PC 工作台搜索区。

#### Scenario: PC 端执行全局搜索
- **WHEN** 管理者在 PC 端查看顶部导航
- **THEN** 顶部应提供可输入、可提交的正式搜索框
- **AND** 不再仅显示无行为的搜索图标
- **AND** 工作台页面不再额外重复渲染同一搜索入口

### Requirement: 通知入口不得继续保持占位状态
系统 SHALL 让通知入口退出“占位未落地”的状态，在两端形成可解释的一致表达。

#### Scenario: 管理者寻找通知入口
- **WHEN** 管理者在任一端寻找通知入口
- **THEN** 不应看到仅视觉存在但不可执行的伪入口
- **AND** 若通知保留为顶级入口，则应在该端可真实进入目标页
- **AND** 若本轮不保留顶级入口，则两端都不应继续暴露顶级占位按钮

### Requirement: 批量抄表页 PC 端补齐关键业务信息
系统 SHALL 在保留桌面表格布局的前提下，使 PC 端批量抄表页具备与移动端一致的关键判断信息。

#### Scenario: PC 端录入抄表数据
- **WHEN** 管理者在 PC 端批量抄表页查看某个仪表记录
- **THEN** 可见合同编号、租客姓名和完整 warning / error 信息
- **AND** 不需要切换到移动端才能获得完整判断线索
- **AND** 桌面端表格录入效率不应明显退化

### Requirement: 清理过时的移动端专用入口组件
系统 SHALL 移除未被正式路径采用的过时移动端专用组件，避免未来重新引入双轨实现。

#### Scenario: 代码库检查搜索入口实现
- **WHEN** 开发者审查搜索入口相关组件
- **THEN** 不应再存在未接入但语义仍指向正式移动端入口的废弃组件
- **AND** 当前正式搜索入口应以现行主路径为唯一真相源

## MODIFIED Requirements
### Requirement: 全局导航一致性
系统在 PC 与移动端之间只允许保留展示方式差异，不允许正式业务主链入口集合不一致。

#### Scenario: 用户在不同设备切换
- **WHEN** 管理者从 PC 切换到移动端，或从移动端切换到 PC
- **THEN** 房源、合同、账单等正式主链能力都应有可解释的正式入口
- **AND** 不得依赖“只在工作台补偿出现”的方式弥补主导航缺失

### Requirement: 工作台快捷入口边界
工作台快捷入口 SHALL 作为正式入口补充，而不是用来掩盖主导航应有能力的缺失。

#### Scenario: 工作台显示快捷入口
- **WHEN** 工作台渲染快捷宫格
- **THEN** 它可以提供常用能力的直达入口
- **AND** 不能成为修补主导航不一致的临时替代方案

## REMOVED Requirements
### Requirement: 移动端底部导航直接暴露设置
**Reason**: 当前已决定让移动端底部导航恢复 `账单` 一级入口，`设置` 迁移到工作台快捷宫格，以消除与 PC 端账单入口不一致的问题。  
**Migration**: 将 `设置` 从移动端底部导航移出，并在工作台快捷宫格中新增等价入口。

### Requirement: 桌面端搜索与通知占位图标
**Reason**: 占位按钮会制造“入口存在但功能未落地”的伪一致性。  
**Migration**: 搜索改为正式搜索框；通知改为真实入口或两端同时退出顶级显式入口。
