# Phase05 PWA Service Worker 与更新策略 Spec

## Why

`phase05-pwa-delivery-02` 已完成安装壳、`manifest`、安装态识别与最小离线页入口收口，但当前仓库仍缺少正式的 `service worker` 注册条件、缓存边界、更新策略与回滚口径。进入 `phase05-03` 需要把这些高风险能力冻结成最小、可解释、可回滚的实现边界，避免重演浏览器调试受阻、旧版本资源脏读和缓存逻辑污染业务真相源的问题。

## What Changes

- 冻结 `service worker` 的注册条件、启用环境与禁用环境
- 实现最小静态应用壳缓存与最小离线兜底，不缓存动态业务接口和鉴权态业务页面响应
- 冻结更新发现、版本切换提示、刷新生效与回滚方式的统一口径
- 允许补最小调试说明，帮助区分本地开发、受控测试和私有部署生产环境的 PWA 行为
- 审计并明确 `public/sw.js`、PWA 注册组件、更新提示组件与离线页之间的职责边界
- **BREAKING**：PWA 缓存与更新行为必须统一到正式支持矩阵和缓存边界，不再允许历史残留 `workbox`/`sw` 资产或隐式浏览器缓存成为不可解释的第二真相源

## Impact

- Affected specs:
  - `service worker` 注册条件
  - 应用壳缓存边界
  - 最小离线兜底
  - 更新策略与版本切换提示
  - SW 调试与回滚说明
- Affected code:
  - `public/sw.js` 或等效 `service worker` 文件
  - `next.config.*` 中与 SW 头部、缓存头或相关资源暴露有关的配置
  - 必要时 PWA 注册组件、更新提示组件
  - `src/app/offline/page.tsx`
  - 必要时 `README.md`、`DEPLOYMENT.md`、`ENVIRONMENT_GUIDE.md`

## ADDED Requirements

### Requirement: Service Worker 注册条件明确

系统 SHALL 只在已冻结的受控环境下注册 `service worker`，并确保本地开发环境不会默认进入 SW 缓存行为。

#### Scenario: 本地开发环境默认禁用 SW

- **WHEN** 开发者在本地开发环境运行应用
- **THEN** 系统默认不注册 `service worker`
- **AND** 开发者无需先清缓存或排查 SW 才能完成日常页面开发
- **AND** PWA 行为不会成为本地页面调试的前置条件

#### Scenario: 受控环境启用 SW

- **WHEN** 用户在受控测试环境或私有部署生产环境访问应用，且满足正式支持矩阵和启用条件
- **THEN** 系统可以注册 `service worker`
- **AND** 注册条件、失败退化与禁用条件都有明确说明

### Requirement: 最小缓存边界

系统 SHALL 仅缓存应用壳静态资源、`manifest`、图标与最小离线兜底资源，不得把动态业务接口、鉴权态业务页面响应或其他动态数据纳入默认缓存范围。

#### Scenario: 动态接口不进入默认缓存

- **WHEN** 用户访问登录后业务页面并触发列表、详情、提醒或其他动态数据请求
- **THEN** `service worker` 不会把这些动态接口响应写入默认离线缓存
- **AND** 缓存逻辑不会成为合同、账单、仪表或抄表等主链数据的隐性真相源

#### Scenario: 离线时提供最小兜底

- **WHEN** 用户在已注册 `service worker` 的正式支持环境中断网并访问应用
- **THEN** 系统只提供最小离线兜底页或最小壳资源响应
- **AND** 不会伪装为完整离线业务可用

### Requirement: 更新策略与版本切换提示

系统 SHALL 提供可解释的更新发现、版本切换提示与刷新生效策略，避免用户长期停留在旧资源版本。

#### Scenario: 检测到新版本

- **WHEN** 已安装或已注册 `service worker` 的用户打开应用，并且浏览器检测到新的 SW 版本
- **THEN** 系统可以以最小、可理解的方式提示用户有新版本可用
- **AND** 用户可以通过明确操作触发刷新生效
- **AND** 文档能说明“何时更新被发现、何时旧版本失效、何时需要手动刷新”

### Requirement: SW 失败时可回滚与可退化

系统 SHALL 在 `service worker` 注册失败、被手动清除、版本异常或缓存异常时仍能退化回普通 Web 路径，并具备最小回滚说明。

#### Scenario: SW 异常不阻断主链访问

- **WHEN** `service worker` 注册失败、被禁用或缓存异常
- **THEN** 用户仍可继续以普通响应式 Web 访问登录页和在线主链页面
- **AND** 系统不会因为 SW 异常导致应用整体不可用
- **AND** 文档可以说明最小回滚方式，例如禁用 SW、清理缓存或发布新版本覆盖

## MODIFIED Requirements

### Requirement: 最小离线壳资源入口职责升级

`phase05-pwa-delivery-02` 中预留的离线页入口 SHALL 从“仅存在承接位”升级为“供 `service worker` 使用的最小离线兜底目标”，但仍不得扩张为完整离线业务系统。

#### Scenario: 离线页被 SW 复用

- **WHEN** `service worker` 进入正式实现并处理最小离线兜底
- **THEN** 已有离线页入口会被复用为统一的最小离线兜底目标
- **AND** 不需要再新增第二套离线入口或第二套路由壳

## REMOVED Requirements

### Requirement: 浏览器缓存行为可由默认静态资源策略自行决定

**Reason**: 当前阶段已经明确，PWA 的 SW、缓存边界、更新提示和回滚方式必须由项目显式定义，不能继续依赖浏览器黑盒缓存行为或历史残留资源文件自行演化。

**Migration**: 将 PWA 的缓存和更新真相源统一收口到 `public/sw.js`、注册组件、更新提示组件及相关文档；后续仅在这个明确边界内做增强，不再让隐式缓存策略主导交付行为。
