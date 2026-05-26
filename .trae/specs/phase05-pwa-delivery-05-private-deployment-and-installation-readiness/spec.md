# Phase05 PWA Delivery 05 私有部署与安装验收准备 Spec

## Why
`phase05-pwa-delivery-01` 到 `04` 已经完成支持矩阵、安装壳、`service worker` 与关键页面移动端可用性的主线收口，但当前仍缺少一套可直接交付给真实用户的私有部署与安装验收口径。若不补齐 HTTPS 前提、安装步骤、更新/回退说明和真机验收清单，PWA 仍然只是“技术上可运行”，而不是“可交付、可解释、可验收”的正式入口。

## What Changes
- 冻结受控私有部署环境下的 HTTPS、域名/局域网访问、浏览器选择与安装前提
- 冻结 Android 正式支持环境中的安装步骤、更新方式、失败退化与最小回滚说明
- 冻结最小真机验收清单，覆盖安装、启动、登录、更新、离线退化与移除重装
- 同步 `README.md`、`DEPLOYMENT.md`、`ENVIRONMENT_GUIDE.md` 与必要的 `.env.example` 口径
- 允许补最小脚本或说明帮助验证安装与更新，但不扩展为完整 DevOps 平台

## Impact
- Affected specs:
  - `phase05-pwa-delivery-01-baseline-and-support-matrix-freeze`
  - `phase05-pwa-delivery-02-install-shell-and-manifest-hardening`
  - `phase05-pwa-delivery-03-service-worker-and-update-strategy`
  - `phase05-pwa-delivery-04-mobile-layout-and-key-page-usability-closure`
- Affected code:
  - `README.md`
  - `DEPLOYMENT.md`
  - `ENVIRONMENT_GUIDE.md`
  - `.env.example`
  - 必要时与安装/更新提示相关的最小文档或辅助脚本

## ADDED Requirements
### Requirement: 私有部署前提冻结
系统 SHALL 为 `phase05` 冻结一套可执行的私有部署前提，明确 PWA 仅在受控环境和 HTTPS 前提下作为正式交付能力成立。

#### Scenario: 私有部署条件明确
- **WHEN** 用户查阅部署与安装文档
- **THEN** 文档明确说明正式支持环境必须满足受控网络、HTTPS、最小鉴权门禁与正式支持浏览器条件

#### Scenario: 非正式支持环境退化
- **WHEN** 用户在不满足 HTTPS、浏览器不受支持或安装能力不可用的环境访问系统
- **THEN** 文档明确说明此时系统只能按普通响应式 Web 使用，且不作为 PWA 正式交付验收通过条件

### Requirement: 安装与更新说明可执行
系统 SHALL 提供一套面向 Android 正式支持环境的安装、更新、失败退化与最小回滚说明，使用户能按步骤完成安装并理解版本变化。

#### Scenario: 安装路径可执行
- **WHEN** 用户按文档在正式支持环境中操作
- **THEN** 用户能完成从浏览器访问、安装到主屏、独立窗口启动和再次进入应用的全流程

#### Scenario: 更新路径可解释
- **WHEN** 用户已安装 PWA 且服务端发布新版本
- **THEN** 文档明确说明更新提示、刷新生效、未成功更新时的处理方式以及最小回滚路径

#### Scenario: 失败退化可解释
- **WHEN** 安装失败、`service worker` 异常或缓存被清除
- **THEN** 文档明确说明用户应如何退回普通 Web 访问路径，以及哪些行为不属于故障而是预期退化

### Requirement: 真机验收清单冻结
系统 SHALL 提供一套最小真机验收清单，作为 `phase05` 发布前的正式门禁。

#### Scenario: 真机验收项完整
- **WHEN** 团队准备在受控环境中发布 PWA
- **THEN** 验收清单至少覆盖安装、启动、登录、关键页面访问、更新提示、离线兜底、移除重装与失败退化

#### Scenario: 发布门禁可执行
- **WHEN** 用户按清单执行验收
- **THEN** 每一项均能被明确标记为通过/不通过，而不是依赖口头经验判断

## MODIFIED Requirements
### Requirement: Phase05 PWA 交付闭环
`phase05-pwa-delivery-*` 的最终交付要求不仅包括安装壳、`service worker` 和移动端可用性，还必须补齐私有部署前提、安装/更新/失败退化说明与真机验收门禁，才能作为“可交付的私有管理 Web App”成立。

### Requirement: 正式支持环境定义
正式支持环境的定义补充为：满足受控网络、HTTPS、最小鉴权闭环、`Android + Chrome` 为第一优先级浏览器，且已通过真机安装与更新清单验证；其他环境只作为次级兼容或普通 Web 退化路径，不视为 PWA 正式交付通过。

## REMOVED Requirements
### Requirement: 把私有部署验收等同于普通 Web 启动说明
**Reason**: 仅有普通 Web 的启动和部署说明，不能证明 PWA 已满足“可安装、可更新、可回退、可解释”的正式交付条件。
**Migration**: 后续由 `README.md`、`DEPLOYMENT.md`、`ENVIRONMENT_GUIDE.md` 和最小真机验收清单共同承接发布前门禁，不再把“服务启动成功”视为 PWA 发布完成。
