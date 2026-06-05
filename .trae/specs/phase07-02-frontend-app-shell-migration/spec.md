# Frontend App Shell Migration Spec

## Why
`phase07-01` 已为 `Rento-miniX` 建立新的前端工作区与最小路由落点，但当前 `src/minix/` 仍只是占位壳，尚未承接现有 `AppLayout`、`UnifiedNavigation`、主导航路径与基础错误/离线页面。若不在本阶段把统一前端宿主、导航壳和基础页面承接到 `React Router`，后续页面迁移仍会继续依附旧 `Next.js` 宿主，无法形成稳定的新前端主线。

## What Changes
- 迁移或适配现有 `AppLayout` 到 `src/minix/`，形成新前端壳的统一布局主线
- 迁移或适配现有 `UnifiedNavigation` 到 `src/minix/`，保留现有 UI 样式、图标和信息架构
- 建立面向 `React Router` 的正式路由骨架，覆盖主导航五个正式业务路径
- 为 `login`、`offline`、`404`、`error`、`loading` 建立基础承接位
- 固定新前端壳对旧导航元数据、页面治理口径与样式资产的复用边界
- 不迁移全量业务页面逻辑、完整查询与写操作、完整认证闭环

## Impact
- Affected specs: `phase07` 前端统一宿主、导航壳承接、React Router 路由骨架、基础错误与离线页面承接
- Affected code: `src/minix/layout/*`、`src/minix/router/*`、`src/minix/routes/*`、`src/components/layout/AppLayout.tsx`、`src/components/layout/UnifiedNavigation.tsx`、`src/lib/route-config.ts`、`src/lib/page-governance.ts`、必要的样式与图标复用文件

## ADDED Requirements
### Requirement: 新前端壳必须承接统一布局主线
系统 SHALL 在 `src/minix/` 中提供统一布局主线，承接旧 `AppLayout` 的导航位置、桌面/移动端壳结构与页面内容容器语义。

#### Scenario: 用户访问新前端壳主要路径
- **WHEN** 用户访问 `/`、`/rooms`、`/add`、`/contracts`、`/bills` 或 `/settings`
- **THEN** 用户应看到统一的前端壳布局
- **AND** 桌面端和移动端导航位置应与现有 UI 表达保持一致
- **AND** 后续页面不需要各自重复定义顶层壳结构

### Requirement: 新前端壳必须承接统一导航
系统 SHALL 在 `src/minix/` 中迁移或适配 `UnifiedNavigation`，继续沿用现有导航项、图标语义、激活态表达与信息架构。

#### Scenario: 用户查看主导航
- **WHEN** 用户在新前端壳中查看桌面端顶部导航或移动端底部导航
- **THEN** 用户应能看到与当前 `Rento` 基本一致的导航项顺序与图标表达
- **AND** 激活态应由 `React Router` 路由状态驱动
- **AND** 不应因为迁移到 `React Router` 而重做导航视觉体系

### Requirement: React Router 必须提供正式路由骨架
系统 SHALL 在 `src/minix/` 中建立正式的 `React Router` 路由骨架，至少承接五个正式业务路径以及 `login`、`offline`、`404`、`error`、`loading` 的基础页面位。

#### Scenario: 用户访问基础承接路径
- **WHEN** 用户访问 `React Router` 中的正式业务路径或基础承接页
- **THEN** 每个路径都应有正式可访问的页面壳
- **AND** 页面应明确说明当前仅承接壳层，不在本阶段迁移完整业务逻辑
- **AND** 不存在继续默认回落到旧 `src/app` 页面入口才能展示的情况

### Requirement: 主导航五个正式业务路径必须有基础壳
系统 SHALL 为 `/`、`/rooms`、`/add`、`/contracts`、`/bills` 与 `/settings` 提供可统一承接的基础页面壳，并保持现有信息架构语义。

#### Scenario: 用户点击主要导航项
- **WHEN** 用户从导航进入主要业务路径
- **THEN** 用户应能看到对应模块的标题、说明和后续迁移边界
- **AND** 页面应为后续业务页面迁移预留稳定挂载位
- **AND** 页面语义应与现有模块职责保持一致

### Requirement: 基础辅助页面必须有新宿主承接位
系统 SHALL 为 `login`、`offline`、`404`、`error`、`loading` 建立基础承接位，并说明它们在新前端宿主中的定位。

#### Scenario: 用户进入辅助页面或遇到路由异常
- **WHEN** 用户访问登录页、离线页、未知路由或路由渲染异常
- **THEN** 新前端壳应能展示对应基础页面或错误边界
- **AND** 页面应沿用现有视觉语言与信息结构，不重做设计体系

### Requirement: 旧资产复用边界必须明确
系统 SHALL 明确新前端壳优先复用现有样式、图标、路由元数据和页面治理口径，而不是在 `phase07-02` 重新发明第二套壳层设计。

#### Scenario: 开发者继续推进后续前端迁移
- **WHEN** 开发者查看 `src/minix/` 与相关共享资产
- **THEN** 开发者应能明确哪些布局、导航、图标和路由元数据来自旧实现复用
- **AND** 开发者不需要为新壳另起一套设计系统或导航元数据源

## MODIFIED Requirements
### Requirement: `phase07` 的前端壳职责
`phase07` 的前端壳职责修改为：不仅要在 `src/minix/` 中提供工作区与路由占位，还要承接统一布局、统一导航、正式路由骨架和基础辅助页面，使新主线具备统一前端宿主。

#### Scenario: 用户判断 `phase07-02` 是否达到 DoD
- **WHEN** 用户检查 `src/minix/` 的前端宿主能力
- **THEN** 用户应能确认新前端壳已具备统一布局、导航和路由骨架
- **AND** 用户不应再把 `phase07-02` 理解为只有若干占位页而没有正式壳层承接

### Requirement: 主导航路径的承接方式
主导航路径的承接方式修改为：主导航五个正式业务路径与设置页必须在 `React Router` 中具备正式承接位，并继续沿用现有 UI 风格、图标与信息架构。

#### Scenario: 用户在新壳中切换主要模块
- **WHEN** 用户通过统一导航在新前端壳中切换主要模块
- **THEN** 用户应能获得与旧壳一致的模块辨识和导航体验
- **AND** 页面切换应由 `React Router` 主导，而不是依赖 `next/link` 或 `next/navigation`

## REMOVED Requirements
### Requirement: `phase07-01` 的最小占位导航即可长期充当新前端宿主
**Reason**: `phase07-01` 的最小占位壳只用于建立工作区和入口表达，不足以承担后续业务页面迁移所需的统一布局、导航和基础页面承接职责。
**Migration**: 在 `phase07-02-frontend-app-shell-migration` 中把 `AppLayout`、`UnifiedNavigation`、正式路由骨架和基础辅助页面迁移到 `src/minix/`，并保留旧 `Next.js` 宿主作为参考基线。
