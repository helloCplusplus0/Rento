# Phase05 PWA 安装壳与 Manifest 收口 Spec

## Why

`phase05-pwa-delivery-01` 已冻结支持矩阵、环境分层、退化策略与缓存边界，但当前仓库仍停留在“有基础 manifest 与部分 metadata、缺少正式安装壳和统一安装语义”的半成品状态。进入 `phase05-02` 需要先把可安装 Web App 的基础壳层收口成一个可解释、可验证、可继续承接后续 SW 与更新策略的正式上游输入。

## What Changes

- 收口 `manifest`、图标、maskable icon、启动名称、启动体验与 metadata 的统一口径
- 冻结安装态、浏览器态与未支持态的识别和展示差异
- 允许引入最小安装提示或安装引导，但不扩张到复杂安装编排
- 明确最小离线页壳资源入口，只作为后续 SW 子任务的承接位
- 审计并明确安装相关关键文件的职责边界
- **BREAKING**：PWA 安装相关资源与元信息必须统一到正式支持矩阵和安装语义，不再允许“manifest 与页面文案、图标、启动体验各说各话”的松散状态

## Impact

- Affected specs:
  - PWA 安装壳
  - `manifest` 与 metadata 统一口径
  - 图标与启动体验
  - 安装态/浏览器态/未支持态差异
  - 最小安装引导
- Affected code:
  - `public/manifest.json` 或迁移后的 `src/app/manifest.ts`
  - `src/app/layout.tsx`
  - `public/icons/*`
  - 必要时安装提示组件与相关 hooks
  - 必要时最小离线页壳资源入口

## ADDED Requirements

### Requirement: PWA 安装壳统一口径

系统 SHALL 提供统一的安装壳基础配置，使应用名、短名称、图标、主题色、显示模式、启动体验和安装说明在正式支持浏览器中保持一致。

#### Scenario: 安装前后产品形态一致

- **WHEN** 用户在正式支持浏览器中查看浏览器态页面、安装提示与安装后的启动表现
- **THEN** 用户看到的应用名称、图标、主题色与启动体验口径一致
- **AND** 不会出现 manifest、布局 metadata 与安装提示文案描述不同一产品形态的情况

### Requirement: 安装态识别与展示差异明确

系统 SHALL 明确安装态、浏览器态与不支持安装环境下的展示差异，并将差异限制在最小范围内。

#### Scenario: 识别安装态与浏览器态

- **WHEN** 用户在正式支持浏览器中访问应用
- **THEN** 系统可以区分当前处于浏览器态、已安装态或不支持安装的环境
- **AND** 系统只在安装提示、安装说明与最小导航壳差异上做必要区分
- **AND** 系统不会因为安装态切换而进入第二套路由或第二套业务 UI

### Requirement: 最小安装提示或安装引导

系统 SHALL 提供最小安装提示或安装引导，帮助正式支持环境中的用户理解如何把应用安装到桌面。

#### Scenario: 正式支持环境提供安装引导

- **WHEN** 用户在 `Android + Chrome` 或次级兼容浏览器中访问系统，且当前尚未安装
- **THEN** 系统可以提供可解释的安装提示或安装引导
- **AND** 安装提示不依赖复杂业务状态或额外配置项
- **AND** 不支持安装时系统不会报错，而是退化为普通 Web 使用说明

### Requirement: 最小离线壳资源入口

系统 SHALL 为后续 `phase05-pwa-delivery-03` 提供最小离线壳资源入口，但本子任务不得扩张为 SW 缓存实现。

#### Scenario: 为后续 SW 子任务预留离线壳入口

- **WHEN** 用户审核 `phase05-02` 的实现边界
- **THEN** 用户可以明确最小离线兜底页或壳资源入口已被定义
- **AND** 用户可以明确本子任务尚未进入复杂缓存策略、动态接口缓存或离线业务实现

## MODIFIED Requirements

### Requirement: Manifest 与 metadata 职责边界

项目的 PWA 相关元信息 SHALL 从“基础存在即可”升级为“正式交付壳层的一部分”，并与 `phase05` 支持矩阵、安装语义和启动体验保持一致。

#### Scenario: Manifest 与布局元信息一致

- **WHEN** 用户同时查看 `manifest`、`layout.tsx`、图标资源与安装提示
- **THEN** 不会出现应用名、图标、启动入口或显示模式描述不一致的双重真相
- **AND** 后续 `phase05-pwa-delivery-03` 可以直接复用当前壳层结果进入 SW 与更新策略实现

## REMOVED Requirements

### Requirement: 仅靠基础 manifest 即视为具备安装能力

**Reason**: 当前阶段已经明确，只有基础 manifest 与零散 metadata 不能构成正式可安装交付，必须补齐安装壳、图标、启动体验和安装引导的一致口径。

**Migration**: 将安装相关真相源统一收口到 `manifest`、`layout.tsx`、图标资源和最小安装引导组件；后续 SW 与更新逻辑只在此基础上继续增强，不再重复定义应用形态。
