# Fix 009 全局写后同步收口 Spec

## Why
`fix_009` 已确认不是单个 PWA 页面缺陷，而是生产模式下 `Next.js App Router` 写操作后缓存失效不完整导致的全局基层问题。若只修退租或合同创建等局部入口，后续在续租、账单变更、房态变更、工作台统计等链路仍会重复出现“操作成功但展示滞后”的同类问题。

## What Changes
- 建立统一的“写操作后路径失效”机制，覆盖合同、账单、房间、租客、仪表、设置等会影响主链展示的数据突变入口。
- 梳理并冻结每类 mutation 对应的页面影响矩阵，确保 `/contracts`、`/bills`、`/rooms`、`/renters`、`/` 及相关详情页在写后能得到正确失效。
- 收口客户端成功跳转策略，对关键成功链路补充必要的 `router.refresh()` 或等效刷新策略，避免返回旧缓存页面。
- 审计高频写后返回页面的 `prefetch` 行为，只在确有必要的入口关闭或调整，避免生产环境继续复用陈旧快照。
- 增加回归验证，覆盖普通 Web 与已安装 PWA 两种入口，确保两者表现一致。

## Impact
- Affected specs:
  - 合同创建 / 退租 / 续租 / 激活
  - 账单状态变更 / 编辑 / 新建
  - 房间状态与工作台统计同步
  - PWA 与普通 Web 共享的数据一致性
- Affected code:
  - `src/app/api/**/*`
  - `src/components/pages/**/*`
  - `src/components/layout/UnifiedNavigation.tsx`
  - 相关 `src/app/**/page.tsx`

## ADDED Requirements
### Requirement: Mutation Path Invalidation Registry
系统 SHALL 为所有会改变主链展示结果的写操作建立统一的路径失效策略，而不是按页面零散补丁。

#### Scenario: Contract mutation succeeds
- **WHEN** 用户成功创建合同、退租、续租或激活合同
- **THEN** 受影响的合同列表、合同详情、账单列表、房间状态页和工作台聚合页必须被标记为 stale
- **AND** 用户再次进入这些页面时应看到最新状态，而不是旧快照

#### Scenario: Bill mutation succeeds
- **WHEN** 用户成功创建账单、编辑账单或更新账单状态
- **THEN** 受影响的账单列表、账单详情、合同详情及相关统计页必须被标记为 stale

#### Scenario: Room or renter mutation succeeds
- **WHEN** 房间、租客或仪表相关写操作改变了业务展示结果
- **THEN** 对应列表页、详情页和依赖这些实体的聚合页必须得到统一失效

### Requirement: Mutation Success Navigation Freshness
系统 SHALL 在关键成功跳转链路中保证当前用户看到的是最新服务端快照，而不是客户端旧缓存。

#### Scenario: Redirect after successful mutation
- **WHEN** 用户在表单或操作页完成写操作后被跳转到详情页或列表页
- **THEN** 当前 route tree 必须在成功链路中显式刷新或消费最新失效状态
- **AND** 不得要求用户手动地址栏刷新才能看到正确结果

### Requirement: Cross-Entry Consistency
系统 SHALL 保证普通浏览器入口与已安装 PWA 入口在写后数据展示上的一致性。

#### Scenario: Same mutation from different entry
- **WHEN** 用户分别从普通 Web 和已安装 PWA 执行相同写操作
- **THEN** 两种入口在返回列表、详情、统计页时都必须看到同样的最新结果
- **AND** 不得出现“Web 已更新、PWA 仍滞后”的分叉

## MODIFIED Requirements
### Requirement: Production Navigation Prefetch Safety
现有导航预取能力 MUST 只在不会放大旧数据复用风险的前提下启用。对于高频写后立即返回的关键页面，应允许关闭或收紧 `prefetch` 以避免陈旧路由缓存干扰主链展示。

## REMOVED Requirements
### Requirement: Manual address-bar refresh as recovery
**Reason**: 手动地址栏刷新只能掩盖写后缓存失效缺口，不能作为主链可接受行为。
**Migration**: 由统一的服务端路径失效 + 客户端成功链路刷新取代。
