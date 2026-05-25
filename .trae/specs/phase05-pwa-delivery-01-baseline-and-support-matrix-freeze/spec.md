# Phase05 PWA 支持矩阵与基线冻结 Spec

## Why

`phase05-pwa-delivery-*` 已被确定为正式候选下一阶段，但若不先冻结支持矩阵、环境分层、退化策略、更新原则与缓存边界，后续很容易再次把 PWA 实现推进成“浏览器支持不确定、调试不可控、缓存不可解释”的高风险试验。当前需要先把 `phase05-01` 的边界和判断标准写成后续 `/spec` 可直接继承的阶段真相源。

## What Changes

- 冻结 `phase05-pwa-delivery-*` 的正式支持矩阵、环境分层、退化策略、更新原则与子任务顺序
- 冻结安卓优先、受控环境优先、渐进增强优先的共享判断标准
- 明确 service worker 与缓存策略的统一边界，防止后续实现越界
- 明确私有部署与 HTTPS 前提下的安装、更新与失败退化语义
- 同步 `phase05` 三份阶段文档与顶层规范文档的候选下一阶段口径
- **BREAKING**：PWA 路线的正式承诺从模糊的“泛移动端安装能力”收口为“受控安卓优先、普通 Web 可退化”的明确支持矩阵

## Impact

- Affected specs:
  - `phase05` 阶段定位
  - `phase05` 子任务顺序
  - PWA 支持矩阵
  - 环境分层与退化策略
  - service worker 与缓存边界
  - 私有部署与安装更新原则
- Affected code:
  - `docs/phase05_pwa_delivery_architecture_plan.md`
  - `docs/phase05_pwa_delivery_dev_plan.md`
  - `docs/phase05_pwa_delivery_shared_baseline.md`
  - `AGENTS.md`
  - `plan.md`
  - `project_rules.md`
  - `architecture_map.md`
  - `global_skills.md`
  - `project_skills.md`

## ADDED Requirements

### Requirement: Phase05 共享边界冻结

系统 SHALL 在进入 `phase05` 首个实现子任务前，提供可直接引用的阶段共享边界文档，明确本阶段的目标、支持矩阵、环境分层、退化策略、更新原则、缓存边界与固定子任务顺序。

#### Scenario: 冻结阶段边界

- **WHEN** 用户审核 `phase05` 阶段文档
- **THEN** 用户可以明确看到 `phase05` 的阶段目标、子任务顺序、共享判断标准与禁止路线
- **AND** 后续 `/spec` 不需要再次讨论是否允许回退到 Flutter / 原生双线、是否默认承诺所有浏览器、是否允许把完整离线能力混入当前主线

### Requirement: PWA 正式支持矩阵冻结

系统 SHALL 在 `phase05` 文档中显式声明 PWA 的正式支持矩阵、次级兼容范围与不承诺范围。

#### Scenario: 明确正式支持范围

- **WHEN** 用户阅读 `phase05` 的共享基线与开发规划
- **THEN** 用户可以明确 `Android + Chrome` 是第一优先级正式支持目标
- **AND** 用户可以明确其他 Chromium 系浏览器只作为次级兼容目标
- **AND** 用户可以明确 iOS 不作为本阶段正式承诺目标

### Requirement: 渐进增强与失败退化口径冻结

系统 SHALL 在 `phase05` 文档中显式声明 PWA 只是增强层，核心业务必须始终可退化为普通 Web 访问。

#### Scenario: 明确退化策略

- **WHEN** 用户阅读 `phase05` 的共享基线与开发规划
- **THEN** 用户可以明确 service worker 失效、安装失败或浏览器不支持时，系统仍必须可作为普通响应式 Web 正常使用
- **AND** 用户可以明确后续实现不得把缓存逻辑做成业务主链的隐性真相源

## MODIFIED Requirements

### Requirement: 顶层候选下一阶段口径

项目的顶层规范文档 SHALL 将 `phase05-pwa-delivery-*` 写入“正式候选下一阶段”，并与 `phase05` 三份阶段文档保持一致，同时继续保留当前默认工作流为“真实场景验证与 fix 闭环”。

#### Scenario: 顶层真相源与阶段文档一致

- **WHEN** 用户同时查看 `AGENTS.md`、`plan.md`、`architecture_map.md` 与 `phase05` 三份文档
- **THEN** 不会出现顶层文档尚未承认 `phase05`、而阶段文档已单独扩写的双重真相
- **AND** 不会误读为当前默认工作流已经从 fix 闭环切换到 `phase05`

### Requirement: Fix 升级为 Phase 的收口规则

当 fix 议题已在 `analysis` 中明确升级为新的 `phase*` 候选阶段时，系统 SHALL 终止该 fix 的后续实现路径，并将实现真相源转移到阶段文档。

#### Scenario: `fix_008` 收口并转交 `phase05`

- **WHEN** 用户查看 `fix_008` 的 `issue`、`analysis`、顶层真相源与 `phase05` 文档
- **THEN** 用户可以明确 `fix_008` 到分析结论为止已完成收口
- **AND** 用户可以明确移动端 / PWA 后续实施由 `phase05-pwa-delivery-*` 统一承接

## REMOVED Requirements

### Requirement: fix_008 继续作为 PWA 实现真相源

**Reason**: `fix_008` 已确认超出单个 fix 的局部修补边界；若继续以 fix 文档承接 `phase05` 实施，会重新制造 fix 与 phase 并行的双重真相。

**Migration**: `fix_008` 仅保留问题事实、分析结论与升级理由；后续支持矩阵、环境边界、安装与更新实施路径统一转移到 `phase05-pwa-delivery-*` 文档与后续 `.trae/specs/phase05-pwa-delivery-*`。
